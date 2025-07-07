from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional, Dict
from enum import Enum

# Simple status types
class AlertStatus(str, Enum):
    NORMAL = "Normal"
    OPIOID = "Opioid"
    STIMULANT = "Stimulant"
    NEUROLOGICAL = "Neurological"
    UNKNOWN = "Unknown"

class TestStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    FAILED = "Failed"

# Simple test result models
class EarDetectionResult(BaseModel):
    status: TestStatus = TestStatus.PENDING
    left_ear_score: float = 0.0  # 0.0 to 1.0
    right_ear_score: float = 0.0  # 0.0 to 1.0
    face_detected: bool = False
    distance_cm: float = 60.0
    result: str = "Pending..."
    
    def analyze(self):
        """Simple analysis based on ear scores"""
        if self.status != TestStatus.COMPLETED:
            self.result = "Pending..."
            return
            
        avg_score = (self.left_ear_score + self.right_ear_score) / 2
        difference = abs(self.left_ear_score - self.right_ear_score)
        
        # Simple rules based on your image reference
        if difference > 0.15:  # Too different
            self.result = "Asymmetric - Possible neurological issue"
        elif avg_score > 0.45:  # Too high
            self.result = "High EAR - Possible stimulant use"
        elif avg_score < 0.20:  # Too low
            self.result = "Low EAR - Possible opioid use"
        elif 0.25 <= avg_score <= 0.40:  # Normal range
            self.result = "Normal EAR - Healthy range"
        else:
            self.result = "Unclear results"

class PupilDilationResult(BaseModel):
    status: TestStatus = TestStatus.PENDING
    left_pupil_mm: float = 0.0
    right_pupil_mm: float = 0.0
    result: str = "Pending..."
    
    def analyze(self):
        """Simple analysis based on pupil size"""
        if self.status != TestStatus.COMPLETED:
            self.result = "Pending..."
            return
            
        avg_pupil = (self.left_pupil_mm + self.right_pupil_mm) / 2
        difference = abs(self.left_pupil_mm - self.right_pupil_mm)
        
        # Simple rules based on your image reference
        if difference > 1.0:  # Too different
            self.result = "Unequal pupils - Possible neurological issue"
        elif avg_pupil < 2.0:  # Too small
            self.result = "Small pupils - Possible opioid use"
        elif avg_pupil > 8.0:  # Too big
            self.result = "Large pupils - Possible stimulant use"
        elif 3.0 <= avg_pupil <= 4.0:  # Normal range
            self.result = "Normal pupil size"
        else:
            self.result = "Unclear results"

class BlinkCountResult(BaseModel):
    status: TestStatus = TestStatus.PENDING
    total_blinks: int = 0
    blinks_per_minute: float = 0.0
    test_seconds: int = 10
    result: str = "Pending..."
    
    def analyze(self):
        """Simple analysis based on blink rate"""
        if self.status != TestStatus.COMPLETED:
            self.result = "Pending..."
            return
            
        # Calculate blinks per minute
        self.blinks_per_minute = (self.total_blinks / self.test_seconds) * 60
        
        # Simple rules based on your image reference
        if self.blinks_per_minute < 5:  # Too few
            self.result = "Low blink rate - Possible opioid use"
        elif self.blinks_per_minute > 30:  # Too many
            self.result = "High blink rate - Possible stimulant use"
        elif 15 <= self.blinks_per_minute <= 20:  # Normal range
            self.result = "Normal blink rate"
        else:
            self.result = "Irregular blink rate"

# Main test session
class EyeTestSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(ObjectId()))
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    
    # The three tests
    ear_test: EarDetectionResult = Field(default_factory=EarDetectionResult)
    pupil_test: PupilDilationResult = Field(default_factory=PupilDilationResult)
    blink_test: BlinkCountResult = Field(default_factory=BlinkCountResult)
    
    # Final results
    final_status: AlertStatus = AlertStatus.UNKNOWN
    confidence: float = 0.0  # 0-100%
    summary: str = "Tests not completed yet"
    recommendations: List[str] = Field(default_factory=list)
    
    def all_tests_done(self) -> bool:
        """Check if all three tests are completed"""
        return (self.ear_test.status == TestStatus.COMPLETED and
                self.pupil_test.status == TestStatus.COMPLETED and
                self.blink_test.status == TestStatus.COMPLETED)
    
    def calculate_final_result(self):
        """Calculate the final result based on all three tests"""
        if not self.all_tests_done():
            self.summary = "Tests not completed yet"
            return
            
        # Count votes for each condition
        votes = {
            AlertStatus.NORMAL: 0,
            AlertStatus.OPIOID: 0,
            AlertStatus.STIMULANT: 0,
            AlertStatus.NEUROLOGICAL: 0
        }
        
        # Vote based on ear test
        if "Normal" in self.ear_test.result:
            votes[AlertStatus.NORMAL] += 1
        elif "opioid" in self.ear_test.result.lower():
            votes[AlertStatus.OPIOID] += 1
        elif "stimulant" in self.ear_test.result.lower():
            votes[AlertStatus.STIMULANT] += 1
        elif "neurological" in self.ear_test.result.lower():
            votes[AlertStatus.NEUROLOGICAL] += 1
            
        # Vote based on pupil test
        if "Normal" in self.pupil_test.result:
            votes[AlertStatus.NORMAL] += 1
        elif "opioid" in self.pupil_test.result.lower():
            votes[AlertStatus.OPIOID] += 1
        elif "stimulant" in self.pupil_test.result.lower():
            votes[AlertStatus.STIMULANT] += 1
        elif "neurological" in self.pupil_test.result.lower():
            votes[AlertStatus.NEUROLOGICAL] += 1
            
        # Vote based on blink test
        if "Normal" in self.blink_test.result:
            votes[AlertStatus.NORMAL] += 1
        elif "opioid" in self.blink_test.result.lower():
            votes[AlertStatus.OPIOID] += 1
        elif "stimulant" in self.blink_test.result.lower():
            votes[AlertStatus.STIMULANT] += 1
        else:
            votes[AlertStatus.NEUROLOGICAL] += 1
            
        # Find the winner
        max_votes = max(votes.values())
        self.confidence = (max_votes / 3) * 100  # Percentage agreement
        
        for status, vote_count in votes.items():
            if vote_count == max_votes:
                self.final_status = status
                break
                
        # Create summary
        self.create_summary()
        self.create_recommendations()
    
    def create_summary(self):
        """Create a simple summary"""
        self.summary = f"""
Final Assessment: {self.final_status.value}
Confidence Level: {self.confidence:.0f}%

Test Results:
• Ear Detection: {self.ear_test.result}
• Pupil Size: {self.pupil_test.result}  
• Blink Rate: {self.blink_test.result}
        """.strip()
    
    def create_recommendations(self):
        """Create simple recommendations"""
        self.recommendations = []
        
        if self.final_status == AlertStatus.NORMAL:
            self.recommendations = [
                "All measurements appear normal",
                "Continue regular health monitoring"
            ]
        elif self.final_status == AlertStatus.OPIOID:
            self.recommendations = [
                "Consult a doctor immediately",
                "Signs suggest possible opioid use"
            ]
        elif self.final_status == AlertStatus.STIMULANT:
            self.recommendations = [
                "Seek medical evaluation",
                "Signs suggest possible stimulant use"
            ]
        elif self.final_status == AlertStatus.NEUROLOGICAL:
            self.recommendations = [
                "See a neurologist urgently",
                "Signs suggest possible neurological issue"
            ]

# Simple frame data for processing
class FrameData(BaseModel):
    image: str  # Base64 image
    timestamp: int
    frame_number: int

# Request models for each test
class EarTestRequest(BaseModel):
    frames: List[FrameData]
    test_type: str = "ear-detection"
    duration: int = 3000  # 3 seconds

class PupilTestRequest(BaseModel):
    frames: List[FrameData]
    test_type: str = "pupil-dilation"
    duration: int = 5000  # 5 seconds

class BlinkTestRequest(BaseModel):
    frames: List[FrameData]
    test_type: str = "blink-count"
    duration: int = 10000  # 10 seconds