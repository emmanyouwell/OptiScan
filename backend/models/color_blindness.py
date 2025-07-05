from pydantic import BaseModel, Field
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional, List
from enum import Enum

class ColorBlindnessType(str, Enum):
    normal = "normal"
    protanopia = "protanopia"  # Red-blind
    deuteranopia = "deuteranopia"  # Green-blind
    tritanopia = "tritanopia"  # Blue-blind

class IshiharaPlate(BaseModel):
    plate_number: int = Field(..., ge=1, le=99)  # Standard Ishihara plates
    correct_answer: str
    user_answer: str
    is_correct: bool

class FarnsworthD15Arrangement(BaseModel):
    arrangement: List[int]  # List of cap indices in the order arranged by the user (0-15)
    is_correct: bool

class ColorBlindnessTest(BaseModel):
    _id: ObjectId = Field(default_factory=ObjectId, alias="_id")
    user_id: ObjectId
    test_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    plates: Optional[List[IshiharaPlate]] = None
    farnsworth_d15: Optional[FarnsworthD15Arrangement] = None
    suspected_type: ColorBlindnessType
    confidence: float = Field(..., ge=0, le=1)  # 0-1 scale
    device_info: Optional[dict] = None  # {os: str, camera: str}

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}