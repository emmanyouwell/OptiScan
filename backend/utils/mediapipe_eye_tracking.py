import cv2
import mediapipe as mp
import numpy as np
import base64
import json
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class MediaPipeEyeTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Face mesh model
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Eye landmark indices for EAR calculation
        self.LEFT_EYE = [362, 382, 381, 380, 374, 373]
        self.RIGHT_EYE = [33, 7, 163, 144, 145, 153]
        
        # Pupil landmark indices (iris)
        self.LEFT_IRIS = [474, 475, 476, 477]
        self.RIGHT_IRIS = [469, 470, 471, 472]

    def calculate_ear(self, eye_landmarks):
        """Calculate Eye Aspect Ratio"""
        try:
            # Get coordinates
            coords = np.array([[lm.x, lm.y] for lm in eye_landmarks])
            
            # Calculate distances
            A = np.linalg.norm(coords[1] - coords[5])  # Vertical distance 1
            B = np.linalg.norm(coords[2] - coords[4])  # Vertical distance 2
            C = np.linalg.norm(coords[0] - coords[3])  # Horizontal distance
            
            # Calculate EAR
            ear = (A + B) / (2.0 * C)
            return ear
        except Exception as e:
            logger.error(f"Error calculating EAR: {e}")
            return 0.0

    def calculate_pupil_size(self, iris_landmarks):
        """Estimate pupil size from iris landmarks"""
        try:
            coords = np.array([[lm.x, lm.y] for lm in iris_landmarks])
            
            # Calculate diameter
            horizontal_diameter = np.linalg.norm(coords[0] - coords[2])
            vertical_diameter = np.linalg.norm(coords[1] - coords[3])
            
            return (horizontal_diameter + vertical_diameter) / 2
        except Exception as e:
            logger.error(f"Error calculating pupil size: {e}")
            return 0.0

    def process_frame(self, frame):
        """Process a single frame and extract eye metrics"""
        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.face_mesh.process(rgb_frame)
            
            metrics = {
                'left_ear': 0,
                'right_ear': 0,
                'left_pupil': 0,
                'right_pupil': 0,
                'detected': False,
                'timestamp': None
            }
            
            if results.multi_face_landmarks:
                face_landmarks = results.multi_face_landmarks[0]
                landmarks = face_landmarks.landmark
                
                # Get eye landmarks
                left_eye_landmarks = [landmarks[i] for i in self.LEFT_EYE]
                right_eye_landmarks = [landmarks[i] for i in self.RIGHT_EYE]
                
                # Get iris landmarks
                left_iris_landmarks = [landmarks[i] for i in self.LEFT_IRIS]
                right_iris_landmarks = [landmarks[i] for i in self.RIGHT_IRIS]
                
                # Calculate metrics
                metrics['left_ear'] = self.calculate_ear(left_eye_landmarks)
                metrics['right_ear'] = self.calculate_ear(right_eye_landmarks)
                metrics['left_pupil'] = self.calculate_pupil_size(left_iris_landmarks)
                metrics['right_pupil'] = self.calculate_pupil_size(right_iris_landmarks)
                metrics['detected'] = True
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return {
                'left_ear': 0, 'right_ear': 0, 'left_pupil': 0, 'right_pupil': 0,
                'detected': False, 'timestamp': None
            }

    def analyze_metrics(self, metrics_history: List[Dict[str, Any]]) -> str:
        """Analyze collected metrics and determine status"""
        if not metrics_history:
            return "No data available"
        
        try:
            # Filter out undetected frames
            valid_metrics = [m for m in metrics_history if m.get('detected', False)]
            
            if not valid_metrics:
                return "No valid detections"
            
            # Calculate averages
            avg_left_ear = np.mean([m['left_ear'] for m in valid_metrics])
            avg_right_ear = np.mean([m['right_ear'] for m in valid_metrics])
            avg_left_pupil = np.mean([m['left_pupil'] for m in valid_metrics])
            avg_right_pupil = np.mean([m['right_pupil'] for m in valid_metrics])
            
            # Determine status
            ear_asymmetry = abs(avg_left_ear - avg_right_ear)
            pupil_asymmetry = abs(avg_left_pupil - avg_right_pupil)
            
            if ear_asymmetry > 0.1:
                return "Neurological"
            elif avg_left_pupil < 0.02 or avg_right_pupil < 0.02:
                return "Opioid"
            elif avg_left_pupil > 0.08 or avg_right_pupil > 0.08:
                return "Stimulant"
            else:
                return "Normal"
                
        except Exception as e:
            logger.error(f"Error analyzing metrics: {e}")
            return "Analysis error"

    def decode_image(self, image_data: str):
        """Decode base64 image to OpenCV format"""
        try:
            # Remove data:image/jpeg;base64, prefix if present
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Decode base64
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return frame
        except Exception as e:
            logger.error(f"Error decoding image: {e}")
            return None