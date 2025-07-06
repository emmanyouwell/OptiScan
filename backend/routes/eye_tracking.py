from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson import ObjectId
from pydantic import BaseModel, Field
from enum import Enum
import numpy as np

# MongoDB
from config.db import db

router = APIRouter()

# Collection name
sessions_collection = db.eye_tracking_sessions

# Models
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

class EyeTrackingSessionCreate(BaseModel):
    device_info: dict = Field(default_factory=dict)
    raw_metrics: List[EyeMetricSnapshot] = Field(default_factory=list)

class EyeTrackingSessionResponse(EyeTrackingSessionCreate):
    _id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_sec: Optional[float] = None
    blink_count: int
    avg_pupil_size: float
    avg_ear: float
    screen_time_min: float
    classification_stats: Dict[AlertStatus, float]
    distance_stats: Dict[str, float]
    pupil_asymmetry: float

@router.post("/sessions", response_model=EyeTrackingSessionResponse)
async def create_session(session_data: EyeTrackingSessionCreate):
    """Create a new eye tracking session"""
    try:
        # Create session object
        session_id = str(ObjectId())
        start_time = datetime.now(timezone.utc)
        
        # Calculate derived metrics
        avg_pupil_size = np.mean([
            (m.pupil_size_left_mm + m.pupil_size_right_mm)/2 
            for m in session_data.raw_metrics
        ]) if session_data.raw_metrics else 0
        
        avg_ear = np.mean([
            (m.ear_left + m.ear_right)/2 
            for m in session_data.raw_metrics
        ]) if session_data.raw_metrics else 0
        
        blink_count = len([m for m in session_data.raw_metrics if m.blink_id is not None])
        
        # Calculate classification stats
        status_counts = {status: 0 for status in AlertStatus}
        for metric in session_data.raw_metrics:
            status_counts[metric.alert_status] += 1
        
        total = len(session_data.raw_metrics)
        classification_stats = {
            status: (count / total) * 100 if total > 0 else 0
            for status, count in status_counts.items()
        }
        
        # Calculate distance stats
        distances = [m.distance_cm for m in session_data.raw_metrics]
        distance_stats = {
            "avg": np.mean(distances) if distances else 0,
            "min": np.min(distances) if distances else 0,
            "max": np.max(distances) if distances else 0
        }
        
        # Calculate pupil asymmetry
        pupil_asymmetry = np.mean([
            abs(m.pupil_size_left_mm - m.pupil_size_right_mm)
            for m in session_data.raw_metrics
        ]) if session_data.raw_metrics else 0
        
        # Create session document
        session = {
            "_id": session_id,
            "start_time": start_time,
            "end_time": None,
            "duration_sec": None,
            "blink_count": blink_count,
            "avg_pupil_size": float(avg_pupil_size),
            "avg_ear": float(avg_ear),
            "screen_time_min": 0,
            "device_info": session_data.device_info,
            "raw_metrics": [m.dict() for m in session_data.raw_metrics],
            "classification_stats": classification_stats,
            "distance_stats": distance_stats,
            "pupil_asymmetry": float(pupil_asymmetry)
        }
        
        # Insert into MongoDB
        result = sessions_collection.insert_one(session)
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create session")
        
        return session
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}", response_model=EyeTrackingSessionResponse)
async def get_session(session_id: str):
    """Retrieve a specific eye tracking session"""
    try:
        session = sessions_collection.find_one({"_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sessions/{session_id}/finalize")
async def finalize_session(session_id: str):
    """Mark a session as complete and calculate final duration"""
    try:
        end_time = datetime.now(timezone.utc)
        
        # Get session to calculate duration
        session = sessions_collection.find_one({"_id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        duration_sec = (end_time - session["start_time"]).total_seconds()
        
        # Update session in database
        result = sessions_collection.update_one(
            {"_id": session_id},
            {"$set": {
                "end_time": end_time,
                "duration_sec": duration_sec
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to finalize session")
        
        return {"message": "Session finalized", "duration_sec": duration_sec}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[EyeTrackingSessionResponse])
async def list_sessions():
    """List all eye tracking sessions"""
    try:
        sessions = list(sessions_collection.find())
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-metrics")
async def analyze_metrics(metrics: List[EyeMetricSnapshot]):
    """Analyze a set of eye metrics without creating a session"""
    try:
        if not metrics:
            raise HTTPException(status_code=400, detail="No metrics provided")
        
        # Calculate basic statistics
        left_ear_avg = np.mean([m.ear_left for m in metrics])
        right_ear_avg = np.mean([m.ear_right for m in metrics])
        asymmetry = abs(left_ear_avg - right_ear_avg)
        
        # Determine most common alert status
        status_counts = {status: 0 for status in AlertStatus}
        for metric in metrics:
            status_counts[metric.alert_status] += 1
        dominant_status = max(status_counts.items(), key=lambda x: x[1])[0]
        
        return {
            "ear_left_avg": left_ear_avg,
            "ear_right_avg": right_ear_avg,
            "asymmetry": asymmetry,
            "dominant_status": dominant_status,
            "status_distribution": status_counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))