from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional
from enum import Enum

class ColorBlindnessType(str, Enum):
    normal = "normal"
    protanopia = "protanopia"  # Red-blind
    deuteranopia = "deuteranopia"  # Green-blind
    tritanopia = "tritanopia"  # Blue-blind

class IshiharaPlate(BaseModel):
    plate_number: int = Field(..., ge=1, le=38)  # Standard Ishihara plates
    correct_answer: str
    user_answer: str
    is_correct: bool

class ColorBlindnessTest(BaseModel):
    _id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: ObjectId
    test_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    plates: list[IshiharaPlate]
    suspected_type: ColorBlindnessType
    confidence: float = Field(..., ge=0, le=1)  # 0-1 scale
    device_info: Optional[dict] = None  # {os: str, camera: str}

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}