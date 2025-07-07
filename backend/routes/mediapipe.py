from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import cv2
import numpy as np
import base64
from io import BytesIO
from PIL import Image
import mediapipe as mp

router = APIRouter()

class FrameData(BaseModel):
    image: str
    timestamp: int
    frameIndex: int

class EyeTrackingRequest(BaseModel):
    frames: List[FrameData]
    testType: str
    duration: int

class AnalysisRequest(BaseModel):
    earDetection: Dict[str, Any]
    pupilDilation: Dict[str, Any]
    blinkCount: Dict[str, Any]

class EyeTrackingProcessor:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def decode_frame(self, image_data: str):
        """Decode base64 image to OpenCV format"""
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(BytesIO(image_bytes))
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    
    def detect_ears(self, frames: List[FrameData]):
        """Process frames for ear detection"""
        detected_frames = 0
        left_ear_count = 0
        right_ear_count = 0
        
        for frame_data in frames:
            try:
                frame = self.decode_frame(frame_data.image)
                results = self.face_mesh.process(frame)
                
                if results.multi_face_landmarks:
                    detected_frames += 1
                    landmarks = results.multi_face_landmarks[0]
                    
                    # Check for ear landmarks (simplified detection)
                    # You can implement more sophisticated ear detection here
                    left_ear_count += 1  # Placeholder
                    right_ear_count += 1  # Placeholder
                    
            except Exception as e:
                print(f"Error processing frame: {e}")
                continue
        
        return {
            "left_ear_detected": left_ear_count > len(frames) * 0.5,
            "right_ear_detected": right_ear_count > len(frames) * 0.5,
            "face_detected": detected_frames > 0,
            "face_position": "center" if detected_frames > len(frames) * 0.7 else "off-center",
            "detection_rate": detected_frames / len(frames) if frames else 0
        }
    
    def measure_pupil_dilation(self, frames: List[FrameData]):
        """Process frames for pupil dilation measurement"""
        left_pupil_sizes = []
        right_pupil_sizes = []
        
        for frame_data in frames:
            try:
                frame = self.decode_frame(frame_data.image)
                results = self.face_mesh.process(frame)
                
                if results.multi_face_landmarks:
                    # Extract pupil measurements (placeholder implementation)
                    # You'll need to implement actual pupil detection here
                    left_pupil_sizes.append(0.5)  # Placeholder
                    right_pupil_sizes.append(0.5)  # Placeholder
                    
            except Exception as e:
                print(f"Error processing frame: {e}")
                continue
        
        avg_left = np.mean(left_pupil_sizes) if left_pupil_sizes else 0
        avg_right = np.mean(right_pupil_sizes) if right_pupil_sizes else 0
        
        return {
            "avg_left_pupil": avg_left,
            "avg_right_pupil": avg_right,
            "pupil_variation": np.std(left_pupil_sizes + right_pupil_sizes) if left_pupil_sizes or right_pupil_sizes else 0,
            "pattern": "normal" if avg_left > 0.3 and avg_right > 0.3 else "abnormal"
        }
    
    def count_blinks(self, frames: List[FrameData]):
        """Process frames for blink counting"""
        blink_count = 0
        ear_values = []
        
        for frame_data in frames:
            try:
                frame = self.decode_frame(frame_data.image)
                results = self.face_mesh.process(frame)
                
                if results.multi_face_landmarks:
                    # Calculate EAR and detect blinks
                    # This is a simplified implementation
                    ear = 0.3  # Placeholder EAR calculation
                    ear_values.append(ear)
                    
                    # Simple blink detection (EAR threshold)
                    if len(ear_values) > 1 and ear_values[-2] > 0.25 and ear < 0.2:
                        blink_count += 1
                    
            except Exception as e:
                print(f"Error processing frame: {e}")
                continue
        
        duration_minutes = len(frames) * 0.1 / 60  # Assuming 100ms per frame
        blink_rate = blink_count / duration_minutes if duration_minutes > 0 else 0
        
        return {
            "total_blinks": blink_count,
            "blink_rate": blink_rate,
            "pattern": "normal" if 10 <= blink_rate <= 30 else "abnormal"
        }

processor = EyeTrackingProcessor()

@router.post("/eye-tracking/ear-detection")
async def ear_detection_test(request: EyeTrackingRequest):
    try:
        result = processor.detect_ears(request.frames)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/eye-tracking/pupil-dilation")
async def pupil_dilation_test(request: EyeTrackingRequest):
    try:
        result = processor.measure_pupil_dilation(request.frames)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/eye-tracking/blink-count")
async def blink_count_test(request: EyeTrackingRequest):
    try:
        result = processor.count_blinks(request.frames)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/eye-tracking/analyze")
async def generate_analysis(request: AnalysisRequest):
    try:
        # Combine all test results for final analysis
        ear_detection = request.earDetection
        pupil_dilation = request.pupilDilation
        blink_count = request.blinkCount
        
        # Simple analysis logic (you can make this more sophisticated)
        overall_status = "Normal"
        confidence = 85.0
        recommendations = []
        
        # Check ear detection
        if not (ear_detection.get("left_ear_detected") and ear_detection.get("right_ear_detected")):
            overall_status = "Poor positioning"
            confidence -= 20
            recommendations.append("Ensure proper positioning facing the camera")
        
        # Check pupil patterns
        if pupil_dilation.get("pattern") == "abnormal":
            overall_status = "Abnormal pupil response"
            confidence -= 15
            recommendations.append("Consult with medical professional about pupil response")
        
        # Check blink patterns
        blink_rate = blink_count.get("blink_rate", 15)
        if blink_rate < 10 or blink_rate > 30:
            overall_status = "Abnormal blink pattern"
            confidence -= 10
            recommendations.append("Monitor blink patterns - may indicate neurological changes")
        
        return {
            "overall_status": overall_status,
            "confidence": max(confidence, 50.0),
            "detailed_analysis": f"Analysis based on ear detection, pupil dilation, and blink patterns. Blink rate: {blink_rate:.1f}/min",
            "recommendations": recommendations if recommendations else ["Continue regular monitoring", "Maintain good lighting conditions"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))