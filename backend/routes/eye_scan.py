from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from typing import Optional, List
import logging
from bson import ObjectId

from models.eye_scan import EyeScanRequest, EyeScanResponse, EyeScanData
from utils.ai_processor import ai_processor  # Import from utils
from utils.utils import get_current_user
from config.db import db

router = APIRouter()
eye_scans_collection = db.eye_scans

@router.get("/user-scans")
async def get_user_scans(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(10, ge=1, le=50),
    skip: int = Query(0, ge=0)
):
    """Get all scan results for the current user"""
    
    try:
        user_id = str(current_user["_id"])
        
        # Get total count
        total_count = eye_scans_collection.count_documents({"user_id": user_id})
        
        # Get scans with pagination
        scans_cursor = eye_scans_collection.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).skip(skip).limit(limit)
        
        scans = []
        for scan in scans_cursor:
            scan["_id"] = str(scan["_id"])
            scans.append(scan)
        
        return {
            "scans": scans,
            "total_count": total_count,
            "current_page": (skip // limit) + 1,
            "total_pages": (total_count + limit - 1) // limit,
            "has_more": skip + limit < total_count
        }
        
    except Exception as e:
        logging.error(f"❌ Failed to fetch user scans: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch scans: {str(e)}")

@router.get("/scan/{scan_id}")
async def get_scan_by_id(
    scan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific scan by ID"""
    
    try:
        # Validate scan_id format
        if not ObjectId.is_valid(scan_id):
            raise HTTPException(status_code=400, detail="Invalid scan ID format")
        
        # Find the scan
        scan = eye_scans_collection.find_one({
            "_id": ObjectId(scan_id),
            "user_id": str(current_user["_id"])
        })
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        # Convert ObjectId to string
        scan["_id"] = str(scan["_id"])
        
        return {
            "scan": scan,
            "user_info": {
                "username": current_user.get("username"),
                "email": current_user.get("email"),
                "age": current_user.get("age"),
                "gender": current_user.get("gender")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ Failed to fetch scan {scan_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch scan: {str(e)}")

@router.get("/latest-scan")
async def get_latest_scan(
    current_user: dict = Depends(get_current_user)
):
    """Get the most recent scan for the current user"""
    
    try:
        user_id = str(current_user["_id"])
        
        # Find the latest scan
        latest_scan = eye_scans_collection.find_one(
            {"user_id": user_id},
            sort=[("timestamp", -1)]
        )
        
        if not latest_scan:
            raise HTTPException(status_code=404, detail="No scans found for user")
        
        # Convert ObjectId to string
        latest_scan["_id"] = str(latest_scan["_id"])
        
        return {
            "scan": latest_scan,
            "user_info": {
                "username": current_user.get("username"),
                "email": current_user.get("email"),
                "age": current_user.get("age"),
                "gender": current_user.get("gender")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"❌ Failed to fetch latest scan: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch latest scan: {str(e)}")
    
@router.post("/analyze")
async def analyze_eye_scan(
    request: EyeScanRequest,
    current_user: dict = Depends(get_current_user)
):
    """Analyze eye images using AI model"""
    
    # Check if AI processor is available
    if ai_processor is None or not ai_processor.is_initialized:
        raise HTTPException(
            status_code=503, 
            detail="AI model not available. Please try again later."
        )
    
    try:
        # Create scan data
        scan_data = EyeScanData(
            user_id=str(current_user["_id"]),
            age=request.age,
            gender=request.gender,
            left_eye_image=request.left_eye_image,
            right_eye_image=request.right_eye_image
        )
        
        # Helper function to normalize probability scores
        def normalize_probabilities(scores_dict):
            """Normalize probability scores to ensure they're between 0-1 and sum to 1"""
            if not scores_dict:
                return {}
            
            # Convert all values to float and ensure they're positive
            normalized = {}
            for key, value in scores_dict.items():
                try:
                    # Handle different input formats
                    if isinstance(value, (int, float)):
                        normalized[key] = max(0.0, float(value))
                    else:
                        normalized[key] = 0.0
                except (ValueError, TypeError):
                    normalized[key] = 0.0
            
            # If values are already in 0-1 range, keep them as is
            max_value = max(normalized.values()) if normalized.values() else 1.0
            if max_value <= 1.0:
                return normalized
            
            # If values are percentages (0-100), divide by 100
            if max_value <= 100.0:
                return {k: v / 100.0 for k, v in normalized.items()}
            
            # If values are raw scores, normalize using softmax-like approach
            # First, apply softmax to convert to probabilities
            import math
            exp_values = {}
            for key, value in normalized.items():
                try:
                    # Prevent overflow by capping large values
                    capped_value = min(value, 700)  # exp(700) is close to max float
                    exp_values[key] = math.exp(capped_value / max_value * 10)  # Scale down for stability
                except (OverflowError, ValueError):
                    exp_values[key] = 1.0
            
            # Normalize to sum to 1
            total = sum(exp_values.values())
            if total > 0:
                return {k: v / total for k, v in exp_values.items()}
            else:
                # Fallback: equal probabilities
                num_classes = len(normalized)
                return {k: 1.0 / num_classes for k in normalized.keys()}
        
        # Initialize analysis results
        left_eye_scores = {}
        right_eye_scores = {}
        combined_scores = {}
        
        # Process left eye
        try:
            left_result = ai_processor.classify_eye_condition(
                request.left_eye_image, 
                patient_age=request.age
            )
            scan_data.left_eye_analysis = left_result
            
            # Extract and normalize probability scores
            if hasattr(left_result, 'probability_scores') and left_result.probability_scores:
                left_eye_scores = normalize_probabilities(left_result.probability_scores)
            elif hasattr(left_result, 'confidence') and hasattr(left_result, 'condition'):
                # Single prediction format - create probability distribution
                confidence = float(left_result.confidence)
                if confidence > 1.0:  # If confidence is in percentage format
                    confidence = confidence / 100.0
                confidence = min(max(confidence, 0.0), 1.0)  # Clamp to 0-1
                
                # Create probability distribution
                left_eye_scores = {
                    str(left_result.condition.value): confidence,
                    # Distribute remaining probability among other classes
                }
                # Add other common conditions with remaining probability
                remaining_prob = (1.0 - confidence) / 3  # Assuming 4 classes total
                common_conditions = ['normal', 'diabetic_retinopathy', 'glaucoma', 'cataract']
                for condition in common_conditions:
                    if condition not in left_eye_scores:
                        left_eye_scores[condition] = remaining_prob
            
            logging.info(f"✅ Left eye analyzed: {left_result.condition.value}")
        except Exception as e:
            logging.error(f"❌ Left eye analysis failed: {e}")
            scan_data.processing_error = f"Left eye: {str(e)}"
        
        # Process right eye
        try:
            right_result = ai_processor.classify_eye_condition(
                request.right_eye_image, 
                patient_age=request.age
            )
            scan_data.right_eye_analysis = right_result
            
            # Extract and normalize probability scores
            if hasattr(right_result, 'probability_scores') and right_result.probability_scores:
                right_eye_scores = normalize_probabilities(right_result.probability_scores)
            elif hasattr(right_result, 'confidence') and hasattr(right_result, 'condition'):
                # Single prediction format - create probability distribution
                confidence = float(right_result.confidence)
                if confidence > 1.0:  # If confidence is in percentage format
                    confidence = confidence / 100.0
                confidence = min(max(confidence, 0.0), 1.0)  # Clamp to 0-1
                
                # Create probability distribution
                right_eye_scores = {
                    str(right_result.condition.value): confidence,
                }
                # Add other common conditions with remaining probability
                remaining_prob = (1.0 - confidence) / 3  # Assuming 4 classes total
                common_conditions = ['normal', 'diabetic_retinopathy', 'glaucoma', 'cataract']
                for condition in common_conditions:
                    if condition not in right_eye_scores:
                        right_eye_scores[condition] = remaining_prob
            
            logging.info(f"✅ Right eye analyzed: {right_result.condition.value}")
        except Exception as e:
            logging.error(f"❌ Right eye analysis failed: {e}")
            if scan_data.processing_error:
                scan_data.processing_error += f" | Right eye: {str(e)}"
            else:
                scan_data.processing_error = f"Right eye: {str(e)}"
        
        # Calculate combined scores (average of both eyes)
        if left_eye_scores or right_eye_scores:
            all_conditions = set(left_eye_scores.keys()) | set(right_eye_scores.keys())
            for condition in all_conditions:
                left_score = left_eye_scores.get(condition, 0.0)
                right_score = right_eye_scores.get(condition, 0.0)
                combined_scores[condition] = (left_score + right_score) / 2.0
            
            # Ensure combined scores are also normalized
            combined_scores = normalize_probabilities(combined_scores)
        
        # Determine final prediction from combined scores
        final_condition = 'normal'
        final_confidence = 0.0
        final_risk_level = 'low'
        
        if combined_scores:
            # Get the condition with highest combined score
            sorted_conditions = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
            final_condition = sorted_conditions[0][0]
            final_confidence = sorted_conditions[0][1] * 100.0  # Convert to percentage for display
            
            # Determine risk level based on confidence
            if final_confidence >= 80.0:
                final_risk_level = 'high'
            elif final_confidence >= 60.0:
                final_risk_level = 'medium'
            else:
                final_risk_level = 'low'
        
        # Calculate overall assessment
        if scan_data.left_eye_analysis or scan_data.right_eye_analysis:
            scan_data.calculate_overall_assessment()
            scan_data.is_processed = True
        
        # Generate recommendations
        recommendations = []
        try:
            if scan_data.left_eye_analysis and hasattr(scan_data.left_eye_analysis, 'get_medical_recommendation'):
                recommendations.append(scan_data.left_eye_analysis.get_medical_recommendation())
        except:
            pass
        
        try:
            if scan_data.right_eye_analysis and hasattr(scan_data.right_eye_analysis, 'get_medical_recommendation'):
                recommendations.append(scan_data.right_eye_analysis.get_medical_recommendation())
        except:
            pass
        
        # Remove duplicates and filter empty recommendations
        recommendations = list(filter(None, set(recommendations)))
        
        # Default recommendations if no specific ones
        if not recommendations:
            if final_condition == 'normal':
                recommendations = ["No abnormalities detected. Continue regular eye examinations annually."]
            elif final_condition == 'diabetic_retinopathy':
                recommendations = ["Possible diabetic retinopathy detected. Please consult an ophthalmologist immediately for comprehensive evaluation."]
            elif final_condition == 'glaucoma':
                recommendations = ["Possible glaucoma signs detected. Please schedule an appointment with an eye specialist for pressure testing and detailed examination."]
            elif final_condition == 'cataract':
                recommendations = ["Possible cataract detected. Please consult an ophthalmologist to discuss treatment options."]
            else:
                recommendations = ["Please consult with an eye care professional for further evaluation."]
        
        # Save to database with additional fields for frontend compatibility
        scan_dict = scan_data.dict()
        scan_dict["_id"] = scan_data.scan_id
        
        # Add normalized probability scores to the scan data
        scan_dict["left_eye_probability_scores"] = left_eye_scores
        scan_dict["right_eye_probability_scores"] = right_eye_scores
        scan_dict["combined_probability_scores"] = combined_scores
        scan_dict["final_prediction"] = {
            "condition": final_condition,
            "confidence": final_confidence,
            "risk_level": final_risk_level
        }
        scan_dict["recommendations"] = recommendations
        
        result = eye_scans_collection.insert_one(scan_dict)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to save scan data")
        
        logging.info(f"✅ Analysis completed - Final: {final_condition} ({final_confidence:.1f}%)")
        
        # Return response in format expected by frontend
        return {
            "scan_id": str(scan_data.scan_id),
            "message": "Eye scan analysis completed successfully",
            "left_eye": left_eye_scores,
            "right_eye": right_eye_scores,
            "combined": combined_scores,
            "final_prediction": {
                "condition": final_condition,
                "confidence": final_confidence,
                "risk_level": final_risk_level
            },
            "recommendations": recommendations,
            "study_references": scan_data.study_references if hasattr(scan_data, 'study_references') else [],
            "overall_assessment": scan_data.overall_risk_level if hasattr(scan_data, 'overall_risk_level') else "Analysis completed",
            "timestamp": scan_data.timestamp.isoformat(),
            "user_info": {
                "username": current_user.get("username"),
                "email": current_user.get("email"),
                "age": current_user.get("age"),
                "gender": current_user.get("gender")
            }
        }
        
    except Exception as e:
        logging.error(f"❌ Eye scan analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Health check for AI model"""
    if ai_processor is None:
        return {
            "status": "error",
            "message": "AI processor not initialized",
            "ai_models_loaded": 0
        }
    
    health_info = ai_processor.health_check()
    return {
        "status": health_info["status"],
        "message": "AI model ready" if health_info["model_loaded"] else "AI model error",
        "ai_models_loaded": 1 if health_info["model_loaded"] else 0,
        "model_info": health_info["model_info"],
        "timestamp": datetime.now(timezone.utc)
    }