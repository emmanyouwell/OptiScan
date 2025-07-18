from pydantic import BaseModel, Field
from datetime import date, datetime, timezone
from bson import ObjectId
from typing import Optional, List
from enum import Enum

class Gender(str, Enum):
    male = "male"
    female = "female"

class Role(str, Enum):
    admin = "admin"
    user = "user"


class User(BaseModel):
    username: str
    age: int
    email: str
    password: str
    img_path: Optional[str] = None
    gender: Optional[Gender] = None
    role: Role = Role.user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    

    class Config:
        arbitrary_types_allowed = True