import tensorflow as tf
import numpy as np
import cv2
import base64
from PIL import Image
from io import BytesIO
import os
from typing import Tuple, Dict, Optional
import logging
from pathlib import Path

# Import your data models
from models.eye_scan import EyeCondition, SeverityLevel, EyeAnalysisResult

class SingleModelAIProcessor:
    """
    AI Processor for single TensorFlow Lite model
    Handles eye disease detection for 4 conditions:
    - Normal, Diabetic Retinopathy, Glaucoma, Cataract
    """
    
    def __init__(self):
        self.model = None
        self.is_initialized = False
        
        # Disease labels for your single model (4 classes)
        self.disease_labels = [
            "Cataract",
            "Diabetic Retinopathy", 
            "Glaucoma",
            "Normal"
        ]
        
        # Model configuration - Updated path
        self.model_path = self._get_model_path()
        self.input_size = (224, 224)  # Adjust based on your model
        
        # Initialize the model
        self._initialize_model()
    
    def _get_model_path(self) -> str:
        """Get the correct path to the model file"""
        # Try different possible paths for your eyescan.tflite
        possible_paths = [
            "backend/models/eyescan.tflite",  # Your preferred path
            "models/eyescan.tflite",
            "./models/eyescan.tflite",
            os.path.join(os.path.dirname(__file__), "../models/eyescan.tflite"),
            os.path.join(os.getcwd(), "backend/models/eyescan.tflite"),
            os.path.join(os.getcwd(), "models/eyescan.tflite")
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                logging.info(f"✅ Found model at: {path}")
                return path
        
        # If not found, log all attempted paths
        logging.error(f"❌ Model file 'eyescan.tflite' not found in any of these locations:")
        for path in possible_paths:
            logging.error(f"   - {os.path.abspath(path)}")
        
        raise FileNotFoundError(f"Model file 'eyescan.tflite' not found. Please place it at: backend/models/eyescan.tflite")
    
    def _initialize_model(self):
        """Initialize the TensorFlow Lite model"""
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load TensorFlow Lite model
            self.model = tf.lite.Interpreter(model_path=self.model_path)
            self.model.allocate_tensors()
            
            # Get model details for validation
            input_details = self.model.get_input_details()
            output_details = self.model.get_output_details()
            
            logging.info(f"✅ AI Model loaded successfully from: {self.model_path}")
            logging.info(f"📊 Input shape: {input_details[0]['shape']}")
            logging.info(f"📊 Output shape: {output_details[0]['shape']}")
            logging.info(f"🔍 Detectable conditions: {', '.join(self.disease_labels)}")
            
            self.is_initialized = True
            
        except Exception as e:
            logging.error(f"❌ Failed to initialize AI model: {e}")
            self.is_initialized = False
            raise e
    
    # ... rest of the methods remain the same as in the previous implementation
    def decode_base64_image(self, base64_string: str) -> np.ndarray:
        """Decode base64 image to numpy array"""
        try:
            # Remove data URL prefix if present (data:image/jpeg;base64,...)
            if ',' in base64_string:
                base64_string = base64_string.split(',')[1]
            
            # Decode base64
            image_data = base64.b64decode(base64_string)
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            image_array = np.array(image)
            return image_array
        
        except Exception as e:
            logging.error(f"❌ Image decoding failed: {e}")
            raise ValueError(f"Invalid image data: {e}")
    
    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for model input"""
        try:
            # Resize to model input size
            image_resized = cv2.resize(image, self.input_size)
            
            # Normalize to [0, 1] range
            image_normalized = image_resized.astype(np.float32) / 255.0
            
            # Add batch dimension
            image_batch = np.expand_dims(image_normalized, axis=0)
            
            return image_batch
        
        except Exception as e:
            logging.error(f"❌ Image preprocessing failed: {e}")
            raise ValueError(f"Image preprocessing failed: {e}")
    
    def run_inference(self, input_data: np.ndarray) -> np.ndarray:
        """Run inference on the TensorFlow Lite model"""
        if not self.is_initialized:
            raise RuntimeError("AI model not initialized")
        
        try:
            # Get input and output details
            input_details = self.model.get_input_details()
            output_details = self.model.get_output_details()
            
            # Set input tensor
            self.model.set_tensor(input_details[0]['index'], input_data)
            
            # Run inference
            self.model.invoke()
            
            # Get output
            output_data = self.model.get_tensor(output_details[0]['index'])
            
            return output_data[0]  # Remove batch dimension
        
        except Exception as e:
            logging.error(f"❌ Model inference failed: {e}")
            raise ValueError(f"AI inference failed: {e}")
    
    def classify_eye_condition(self, image_base64: str, patient_age: Optional[int] = None) -> EyeAnalysisResult:
        """
        Main function to classify eye condition from base64 image
        """
        if not self.is_initialized:
            raise RuntimeError("AI model not initialized. Please check model file at: backend/models/eyescan.tflite")
        
        try:
            # Step 1: Decode image
            image = self.decode_base64_image(image_base64)
            logging.info(f"🖼️ Image decoded: {image.shape}")
            
            # Step 2: Preprocess
            processed_image = self.preprocess_image(image)
            logging.info(f"🔄 Image preprocessed: {processed_image.shape}")
            
            # Step 3: Run AI inference
            probabilities = self.run_inference(processed_image)
            logging.info(f"🤖 AI inference completed")
            
            # Step 4: Apply softmax if needed
            if len(probabilities.shape) > 0 and probabilities.max() > 1:
                exp_probs = np.exp(probabilities - np.max(probabilities))
                probabilities = exp_probs / np.sum(exp_probs)
            
            # Step 5: Get prediction results
            predicted_index = np.argmax(probabilities)
            confidence = float(probabilities[predicted_index]) * 100
            predicted_condition = self.disease_labels[predicted_index]
            
            # Step 6: Create probability scores dictionary
            prob_dict = {
                label: float(prob) * 100 
                for label, prob in zip(self.disease_labels, probabilities)
            }
            
            # Step 7: Map to enum
            condition_enum = self._map_condition_to_enum(predicted_condition)
            
            # Step 8: Determine severity
            severity = self._determine_severity(condition_enum, confidence, patient_age)
            
            # Step 9: Generate clinical notes
            clinical_notes = self._generate_clinical_notes(
                condition_enum, confidence, severity, prob_dict, patient_age
            )
            
            logging.info(f"✅ Classification complete: {predicted_condition} ({confidence:.1f}%)")
            
            return EyeAnalysisResult(
                condition=condition_enum,
                confidence=confidence,
                severity=severity,
                probability_scores=prob_dict,
                clinical_notes=clinical_notes
            )
        
        except Exception as e:
            logging.error(f"❌ Eye classification failed: {e}")
            raise ValueError(f"Eye condition classification failed: {e}")
    
    def _map_condition_to_enum(self, condition_name: str) -> EyeCondition:
        """Map string condition to enum"""
        condition_mapping = {
            "Normal": EyeCondition.NORMAL,
            "Diabetic Retinopathy": EyeCondition.DIABETIC_RETINOPATHY,
            "Glaucoma": EyeCondition.GLAUCOMA,
            "Cataract": EyeCondition.CATARACT,
        }
        return condition_mapping.get(condition_name, EyeCondition.NORMAL)
    
    def _determine_severity(self, condition: EyeCondition, confidence: float, 
                          patient_age: Optional[int] = None) -> Optional[SeverityLevel]:
        """Determine severity level based on condition, confidence, and age"""
        if condition == EyeCondition.NORMAL:
            return None
        
        # Age adjustment factor
        age_factor = 1.0
        if patient_age:
            if patient_age > 65:
                age_factor = 1.1
            elif patient_age < 40:
                age_factor = 0.9
        
        adjusted_confidence = confidence * age_factor
        
        # Condition-specific severity thresholds
        severity_thresholds = {
            EyeCondition.DIABETIC_RETINOPATHY: {
                SeverityLevel.MILD: (50, 70),
                SeverityLevel.MODERATE: (70, 85),
                SeverityLevel.SEVERE: (85, 100)
            },
            EyeCondition.GLAUCOMA: {
                SeverityLevel.MILD: (50, 65),
                SeverityLevel.MODERATE: (65, 80),
                SeverityLevel.SEVERE: (80, 100)
            },
            EyeCondition.CATARACT: {
                SeverityLevel.MILD: (50, 75),
                SeverityLevel.MODERATE: (75, 90),
                SeverityLevel.SEVERE: (90, 100)
            }
        }
        
        thresholds = severity_thresholds.get(condition, {
            SeverityLevel.MILD: (50, 70),
            SeverityLevel.MODERATE: (70, 85),
            SeverityLevel.SEVERE: (85, 100)
        })
        
        for severity, (min_conf, max_conf) in thresholds.items():
            if min_conf <= adjusted_confidence < max_conf:
                return severity
        
        return SeverityLevel.SEVERE if adjusted_confidence >= 85 else SeverityLevel.MILD
    
    def _generate_clinical_notes(self, condition: EyeCondition, confidence: float, 
                               severity: Optional[SeverityLevel], prob_scores: Dict[str, float], 
                               patient_age: Optional[int] = None) -> str:
        """Generate clinical notes based on AI findings"""
        notes = []
        
        notes.append(f"AI Classification: {condition.value}")
        notes.append(f"Confidence: {confidence:.1f}%")
        
        if severity:
            notes.append(f"Severity: {severity.value}")
        
        if patient_age:
            if condition == EyeCondition.DIABETIC_RETINOPATHY and patient_age > 50:
                notes.append("Age-related DR risk factor")
            elif condition == EyeCondition.GLAUCOMA and patient_age > 60:
                notes.append("Age-related glaucoma risk")
            elif condition == EyeCondition.CATARACT and patient_age > 65:
                notes.append("Age-related cataract development")
        
        if confidence >= 85:
            notes.append("High confidence - findings highly reliable")
        elif confidence >= 70:
            notes.append("Good confidence - findings reliable")
        elif confidence >= 55:
            notes.append("Moderate confidence - clinical correlation recommended")
        else:
            notes.append("Low confidence - clinical evaluation strongly recommended")
        
        # Differential diagnosis
        sorted_probs = sorted(prob_scores.items(), key=lambda x: x[1], reverse=True)
        if len(sorted_probs) > 1:
            second_highest = sorted_probs[1]
            if second_highest[1] > 25:
                notes.append(f"Consider: {second_highest[0]} ({second_highest[1]:.1f}%)")
        
        return " | ".join(notes)
    
    def get_model_info(self) -> Dict[str, any]:
        """Get information about the loaded model"""
        return {
            "is_initialized": self.is_initialized,
            "model_path": self.model_path,
            "detectable_conditions": self.disease_labels,
            "input_size": self.input_size,
            "num_classes": len(self.disease_labels),
            "model_filename": "eyescan.tflite"
        }
    
    def health_check(self) -> Dict[str, any]:
        """Health check for the AI processor"""
        return {
            "status": "healthy" if self.is_initialized else "error",
            "model_loaded": self.is_initialized,
            "model_info": self.get_model_info()
        }

# Create global instance
try:
    ai_processor = SingleModelAIProcessor()
    logging.info("🚀 AI Processor initialized successfully")
except Exception as e:
    logging.error(f"🚨 Failed to initialize AI Processor: {e}")
    ai_processor = None
    