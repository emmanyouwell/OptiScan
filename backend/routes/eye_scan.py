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

@router.post("/analyze", response_model=EyeScanResponse)
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
        
        # Process left eye
        try:
            left_result = ai_processor.classify_eye_condition(
                request.left_eye_image, 
                patient_age=request.age
            )
            scan_data.left_eye_analysis = left_result
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
            logging.info(f"✅ Right eye analyzed: {right_result.condition.value}")
        except Exception as e:
            logging.error(f"❌ Right eye analysis failed: {e}")
            if scan_data.processing_error:
                scan_data.processing_error += f" | Right eye: {str(e)}"
            else:
                scan_data.processing_error = f"Right eye: {str(e)}"
        
        # Calculate overall assessment
        if scan_data.left_eye_analysis or scan_data.right_eye_analysis:
            scan_data.calculate_overall_assessment()
            scan_data.is_processed = True
        
        # Save to database
        scan_dict = scan_data.dict()
        scan_dict["_id"] = scan_data.scan_id
        result = eye_scans_collection.insert_one(scan_dict)
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to save scan data")
        
        # Generate recommendations
        recommendations = []
        if scan_data.left_eye_analysis:
            recommendations.append(scan_data.left_eye_analysis.get_medical_recommendation())
        if scan_data.right_eye_analysis:
            recommendations.append(scan_data.right_eye_analysis.get_medical_recommendation())
        
        return EyeScanResponse(
            scan_id=scan_data.scan_id,
            message="Eye scan analysis completed successfully",
            left_eye_result=scan_data.left_eye_analysis,
            right_eye_result=scan_data.right_eye_analysis,
            overall_assessment=scan_data.overall_risk_level,
            recommendations=list(set(recommendations)),  # Remove duplicates
            study_references=scan_data.study_references,
            timestamp=scan_data.timestamp
        )
        
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