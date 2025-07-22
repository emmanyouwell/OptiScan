from fastapi import APIRouter, UploadFile, HTTPException, File
from fastapi.responses import JSONResponse
from torchvision import transforms, models
from PIL import Image
import torch
import io
import torch.nn as nn
import os
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone
from bson import ObjectId
from models.colorblindness import ColorBlindnessTest, IshiharaPlate, ColorBlindnessType
from config.db import db

router = APIRouter()

@router.post("/predict")
async def predict_number(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")

    transform = transforms.Compose([
        transforms.Resize((128, 128)),
        transforms.ToTensor()
    ])
    image = transform(image).unsqueeze(0)

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 10)

    # Use absolute path for the model file
    model_path = os.path.join(os.path.dirname(__file__), "..", "models", "ishihara_cnn.pt")
    model.load_state_dict(torch.load(model_path, map_location="cpu"))
    model.eval()

    with torch.no_grad():
        output = model(image)
        _, predicted = torch.max(output, 1)

    return {"predicted_number": predicted.item()}


class PlateInput(BaseModel):
    plate_number: int
    correct_answer: str
    user_answer: str
    is_correct: bool

class ColorBlindnessTestInput(BaseModel):
    user_id: str
    plates: List[PlateInput]
    suspected_type: ColorBlindnessType
    confidence: float
    device_info: Optional[dict] = None

@router.post("/save-result")
async def save_colorblindness_result(test: ColorBlindnessTestInput):
    try:
        user_obj_id = ObjectId(test.user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    test_doc = ColorBlindnessTest(
        user_id=user_obj_id,
        plates=[IshiharaPlate(**plate.dict()) for plate in test.plates],
        suspected_type=test.suspected_type,
        confidence=test.confidence,
        device_info=test.device_info,
        test_date=datetime.now(timezone.utc)
    )

    # Save to MongoDB
    result = db.colorblindness_tests.insert_one(test_doc.dict(by_alias=True))
    return {"message": "Test result saved", "id": str(result.inserted_id)}