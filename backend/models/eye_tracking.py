from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from typing import List, Optional
from enum import Enum

class EyeTrackingSession(BaseModel):
    _id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: ObjectId
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    duration_sec: Optional[float] = None  # Auto-calculated
    blink_count: int = 0
    avg_pupil_size: float = Field(..., ge=0, le=1)  # Normalized 0-1
    screen_time_min: float = 0
    device_info: dict = Field(default_factory=dict)  # {os: str, camera: str}
    raw_metrics: Optional[List[dict]] = None  # Time-series data

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

    def calculate_duration(self):
        if self.end_time:
            self.duration_sec = (self.end_time - self.start_time).total_seconds()