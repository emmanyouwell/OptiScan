from pydantic import BaseModel, Field
from datetime import date, datetime, timezone
from bson import ObjectId
from typing import Optional, List
from enum import Enum

class Role(str, Enum):
    admin = "admin"
    user = "user"


class User(BaseModel):
    username: str
    email: str
    password: str
    role: Role = Role.user
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    

    class Config:
        arbitrary_types_allowed = True