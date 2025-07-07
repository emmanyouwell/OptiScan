from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson import ObjectId
from pydantic import BaseModel, Field
from enum import Enum
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image
import mediapipe as mp

# Import your simplified models
from models.eye_tracking import (
    EyeTestSession, 
    EarDetectionResult, 
    PupilDilationResult, 
    BlinkCountResult,
    FrameData,
    EarTestRequest,
    PupilTestRequest,
    BlinkTestRequest,
    TestStatus,
    AlertStatus
)

# MongoDB
from config.db import db

router = APIRouter()

# Collections
sessions_collection = db.eye_test_sessions

# Simple processors for each test
class SimpleEarProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def decode_frame(self, image_data: str):
        """Turn base64 image into something we can work with"""
        try:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(BytesIO(image_bytes))
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def calculate_ear_score(self, landmarks):
        """Calculate simple EAR score"""
        try:
            # Simple calculation based on eye landmarks
            # This is a simplified version - you can make it more complex
            left_eye = landmarks.landmark[33]  # Left eye landmark
            right_eye = landmarks.landmark[362]  # Right eye landmark
            
            # Simple score based on eye openness (mock calculation)
            left_score = min(1.0, max(0.0, left_eye.y * 2))  # Simplified
            right_score = min(1.0, max(0.0, right_eye.y * 2))  # Simplified
            
            return left_score, right_score
        except:
            return 0.3, 0.3  # Default values
            
    def process_frames(self, frames):
        """Process all frames and return results"""
        left_scores = []
        right_scores = []
        face_count = 0
        
        for frame_data in frames:
            frame = self.decode_frame(frame_data.image)
            if frame is None:
                continue
                
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            if results.multi_face_landmarks:
                face_count += 1
                landmarks = results.multi_face_landmarks[0]
                left_score, right_score = self.calculate_ear_score(landmarks)
                left_scores.append(left_score)
                right_scores.append(right_score)
            else:
                left_scores.append(0.0)
                right_scores.append(0.0)
        
        return {
            'left_avg': float(np.mean(left_scores)) if left_scores else 0.0,
            'right_avg': float(np.mean(right_scores)) if right_scores else 0.0,
            'face_detected': face_count > 0,
            'total_frames': len(frames)
        }

class SimplePupilProcessor:
    def decode_frame(self, image_data: str):
        """Turn base64 image into something we can work with"""
        try:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(BytesIO(image_bytes))
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def calculate_pupil_size(self, frame):
        """Calculate pupil size (simplified)"""
        try:
            # This is a mock calculation - replace with actual pupil detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            height, width = gray.shape
            
            # Mock pupil size calculation
            # In real implementation, you'd use proper pupil detection
            left_pupil = 3.5 + np.random.normal(0, 0.5)  # Mock data
            right_pupil = 3.5 + np.random.normal(0, 0.5)  # Mock data
            
            return max(1.0, left_pupil), max(1.0, right_pupil)
        except:
            return 3.5, 3.5  # Default normal size
    
    def process_frames(self, frames):
        """Process all frames and return pupil measurements"""
        left_pupils = []
        right_pupils = []
        
        for frame_data in frames:
            frame = self.decode_frame(frame_data.image)
            if frame is None:
                continue
                
            left_size, right_size = self.calculate_pupil_size(frame)
            left_pupils.append(left_size)
            right_pupils.append(right_size)
        
        return {
            'left_avg': float(np.mean(left_pupils)) if left_pupils else 3.5,
            'right_avg': float(np.mean(right_pupils)) if right_pupils else 3.5,
            'total_frames': len(frames)
        }

class SimpleBlinkProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
    def decode_frame(self, image_data: str):
        """Turn base64 image into something we can work with"""
        try:
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(BytesIO(image_bytes))
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def detect_blink(self, landmarks):
        """Simple blink detection"""
        try:
            # Simple blink detection based on eye aspect ratio
            left_eye_top = landmarks.landmark[159]
            left_eye_bottom = landmarks.landmark[145]
            eye_height = abs(left_eye_top.y - left_eye_bottom.y)
            
            # If eye height is very small, it's likely a blink
            return eye_height < 0.01  # Threshold for blink
        except:
            return False
    
    def process_frames(self, frames):
        """Count blinks in all frames"""
        blink_count = 0
        prev_blink = False
        
        for frame_data in frames:
            frame = self.decode_frame(frame_data.image)
            if frame is None:
                continue
                
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0]
                is_blink = self.detect_blink(landmarks)
                
                # Count blink when transitioning from not-blink to blink
                if is_blink and not prev_blink:
                    blink_count += 1
                    
                prev_blink = is_blink
        
        return {
            'total_blinks': blink_count,
            'total_frames': len(frames)
        }

# Create processors
ear_processor = SimpleEarProcessor()
pupil_processor = SimplePupilProcessor()
blink_processor = SimpleBlinkProcessor()

# Routes for each test
@router.post("/test/ear-detection")
async def run_ear_test(request: EarTestRequest):
    """Run the ear detection test"""
    try:
        # Process the frames
        results = ear_processor.process_frames(request.frames)
        
        # Create result object
        ear_result = EarDetectionResult(
            status=TestStatus.COMPLETED,
            left_ear_score=results['left_avg'],
            right_ear_score=results['right_avg'],
            face_detected=results['face_detected'],
            distance_cm=60.0  # Mock distance
        )
        
        # Analyze the results
        ear_result.analyze()
        
        return {
            "status": "completed",
            "left_ear_score": ear_result.left_ear_score,
            "right_ear_score": ear_result.right_ear_score,
            "face_detected": ear_result.face_detected,
            "result": ear_result.result,
            "total_frames": results['total_frames']
        }
        
    except Exception as e:
        print(f"Error in ear test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/pupil-dilation")
async def run_pupil_test(request: PupilTestRequest):
    """Run the pupil dilation test"""
    try:
        # Process the frames
        results = pupil_processor.process_frames(request.frames)
        
        # Create result object
        pupil_result = PupilDilationResult(
            status=TestStatus.COMPLETED,
            left_pupil_mm=results['left_avg'],
            right_pupil_mm=results['right_avg']
        )
        
        # Analyze the results
        pupil_result.analyze()
        
        return {
            "status": "completed",
            "left_pupil_mm": pupil_result.left_pupil_mm,
            "right_pupil_mm": pupil_result.right_pupil_mm,
            "result": pupil_result.result,
            "total_frames": results['total_frames']
        }
        
    except Exception as e:
        print(f"Error in pupil test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/blink-count")
async def run_blink_test(request: BlinkTestRequest):
    """Run the blink count test"""
    try:
        # Process the frames
        results = blink_processor.process_frames(request.frames)
        
        # Create result object
        blink_result = BlinkCountResult(
            status=TestStatus.COMPLETED,
            total_blinks=results['total_blinks'],
            test_seconds=request.duration // 1000  # Convert ms to seconds
        )
        
        # Analyze the results
        blink_result.analyze()
        
        return {
            "status": "completed",
            "total_blinks": blink_result.total_blinks,
            "blinks_per_minute": blink_result.blinks_per_minute,
            "result": blink_result.result,
            "total_frames": results['total_frames']
        }
        
    except Exception as e:
        print(f"Error in blink test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Session management
@router.post("/session/create")
async def create_test_session():
    """Create a new test session"""
    try:
        session = EyeTestSession()
        
        # Save to database
        session_data = session.dict()
        session_data["_id"] = session.session_id
        
        result = sessions_collection.insert_one(session_data)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create session")
        
        return {
            "session_id": session.session_id,
            "message": "Session created successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}")
async def get_test_session(session_id: str):
    """Get a test session"""
    try:
        session_data = sessions_collection.find_one({"_id": session_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return session_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/update-ear")
async def update_ear_results(session_id: str, ear_data: dict):
    """Update ear test results in session"""
    try:
        # Create proper ear result object
        ear_result = EarDetectionResult(
            status=TestStatus.COMPLETED,
            left_ear_score=ear_data.get("left_ear_score", 0.0),
            right_ear_score=ear_data.get("right_ear_score", 0.0),
            face_detected=ear_data.get("face_detected", False),
            distance_cm=ear_data.get("distance_cm", 60.0),
            result=ear_data.get("result", "No result")
        )
        
        result = sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {"ear_test": ear_result.dict()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Ear test results updated"}
        
    except Exception as e:
        print(f"Error updating ear results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/session/{session_id}/update-pupil")
async def update_pupil_results(session_id: str, pupil_data: dict):
    """Update pupil test results in session"""
    try:
        # Create proper pupil result object
        pupil_result = PupilDilationResult(
            status=TestStatus.COMPLETED,
            left_pupil_mm=pupil_data.get("left_pupil_mm", 3.5),
            right_pupil_mm=pupil_data.get("right_pupil_mm", 3.5),
            result=pupil_data.get("result", "No result")
        )
        
        result = sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {"pupil_test": pupil_result.dict()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Pupil test results updated"}
        
    except Exception as e:
        print(f"Error updating pupil results: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/session/{session_id}/update-blink")
async def update_blink_results(session_id: str, blink_data: dict):
    """Update blink test results in session"""
    try:
        # Create proper blink result object
        blink_result = BlinkCountResult(
            status=TestStatus.COMPLETED,
            total_blinks=blink_data.get("total_blinks", 0),
            blinks_per_minute=blink_data.get("blinks_per_minute", 0.0),
            test_seconds=10,
            result=blink_data.get("result", "No result")
        )
        
        result = sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {"blink_test": blink_result.dict()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Blink test results updated"}
        
    except Exception as e:
        print(f"Error updating blink results: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/session/{session_id}/finalize")
async def finalize_test_session(session_id: str):
    """Calculate final results for all tests"""
    try:
        # Get session data
        session_data = sessions_collection.find_one({"_id": session_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Remove MongoDB _id field for Pydantic model
        session_data.pop("_id", None)
        
        # Create session object from data - handle missing fields gracefully
        try:
            session = EyeTestSession(**session_data)
        except Exception as model_error:
            # If model creation fails, create a new session and populate it manually
            print(f"Model creation error: {model_error}")
            session = EyeTestSession(session_id=session_id)
            
            # Manually populate test results from session data
            if "ear_test" in session_data:
                ear_data = session_data["ear_test"]
                session.ear_test = EarDetectionResult(
                    status=TestStatus.COMPLETED,
                    left_ear_score=ear_data.get("left_ear_score", 0.0),
                    right_ear_score=ear_data.get("right_ear_score", 0.0),
                    face_detected=ear_data.get("face_detected", False),
                    distance_cm=ear_data.get("distance_cm", 60.0),
                    result=ear_data.get("result", "No result")
                )
            
            if "pupil_test" in session_data:
                pupil_data = session_data["pupil_test"]
                session.pupil_test = PupilDilationResult(
                    status=TestStatus.COMPLETED,
                    left_pupil_mm=pupil_data.get("left_pupil_mm", 3.5),
                    right_pupil_mm=pupil_data.get("right_pupil_mm", 3.5),
                    result=pupil_data.get("result", "No result")
                )
            
            if "blink_test" in session_data:
                blink_data = session_data["blink_test"]
                session.blink_test = BlinkCountResult(
                    status=TestStatus.COMPLETED,
                    total_blinks=blink_data.get("total_blinks", 0),
                    blinks_per_minute=blink_data.get("blinks_per_minute", 0.0),
                    test_seconds=10,
                    result=blink_data.get("result", "No result")
                )
        
        # Calculate final results
        session.calculate_final_result()
        session.end_time = datetime.now(timezone.utc)
        
        # Update in database
        sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {
                "final_status": session.final_status.value,
                "confidence": session.confidence,
                "summary": session.summary,
                "recommendations": session.recommendations,
                "end_time": session.end_time
            }}
        )
        
        return {
            "final_status": session.final_status.value,
            "confidence": session.confidence,
            "summary": session.summary,
            "recommendations": session.recommendations
        }
        
    except Exception as e:
        print(f"Error in finalize_test_session: {e}")
        raise HTTPException(status_code=500, detail=f"Error finalizing session: {str(e)}")
# Simple health check
@router.get("/health")
async def health_check():
    """Check if the API is working"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc)}

# Get all sessions
@router.get("/sessions")
async def list_all_sessions():
    """Get list of all test sessions"""
    try:
        sessions = list(sessions_collection.find())
        return {"sessions": sessions, "total": len(sessions)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))