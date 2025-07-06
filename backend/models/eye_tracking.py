from pydantic import BaseModel, Field, validator
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional, Dict
from enum import Enum

class AlertStatus(str, Enum):
    NORMAL = "Normal"
    OPIOID = "Opioid"
    STIMULANT = "Stimulant"
    NEUROLOGICAL = "Neurological"
    UNKNOWN = "Unknown"

class EyeMetricSnapshot(BaseModel):
    timestamp: datetime
    ear_left: float = Field(..., ge=0, le=1)
    ear_right: float = Field(..., ge=0, le=1)
    pupil_size_left_mm: float = Field(..., gt=0)
    pupil_size_right_mm: float = Field(..., gt=0)
    distance_cm: float = Field(..., gt=0)
    alert_status: AlertStatus
    blink_id: Optional[int] = None

    @validator('timestamp', pre=True)
    def parse_timestamp(cls, value):
        if isinstance(value, str):
            try:
                # Handle timestamp with microseconds
                return datetime.strptime(value, "%H:%M:%S.%f")
            except ValueError:
                return datetime.strptime(value, "%H:%M:%S")
        return value

class EyeTrackingSession(BaseModel):
    _id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    # user_id: ObjectId
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_sec: Optional[float] = None  # Auto-calculated
    blink_count: int = 0
    avg_pupil_size: float = Field(..., ge=0, le=1)  # Normalized 0-1
    avg_ear: float = Field(..., ge=0, le=1)  # Average Eye Aspect Ratio
    screen_time_min: float = 0
    device_info: dict = Field(default_factory=dict)  # {os: str, camera: str}
    raw_metrics: List[EyeMetricSnapshot] = Field(default_factory=list)
    classification_stats: Dict[AlertStatus, float] = Field(default_factory=dict)  # % time in each state
    distance_stats: Dict[str, float] = Field(default_factory=dict)  # {avg_distance, min, max}

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
        use_enum_values = True

    def calculate_duration(self):
        if self.end_time:
            self.duration_sec = (self.end_time - self.start_time).total_seconds()

    def update_classification_stats(self):
        """Calculate percentage of time in each alert status"""
        status_counts = {status: 0 for status in AlertStatus}
        for metric in self.raw_metrics:
            status_counts[metric.alert_status] += 1
        
        total = len(self.raw_metrics)
        if total > 0:
            self.classification_stats = {
                status: (count / total) * 100 
                for status, count in status_counts.items()
            }

    def calculate_pupil_asymmetry(self) -> float:
        """Calculate average pupil asymmetry between left and right eyes"""
        if not self.raw_metrics:
            return 0.0
            
        total_asymmetry = 0.0
        for metric in self.raw_metrics:
            total_asymmetry += abs(metric.pupil_size_left_mm - metric.pupil_size_right_mm)
        
        return total_asymmetry / len(self.raw_metrics)