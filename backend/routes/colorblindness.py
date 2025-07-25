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
import base64
import cloudinary.uploader
from io import BytesIO


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
    image_base64: Optional[str] = None
    correct_answer: str
    user_answer: str
    is_correct: bool
    

class ColorBlindnessTestInput(BaseModel):
    user_id: str
    plates: List[PlateInput]
    suspected_type: ColorBlindnessType
    confidence: float
    device_info: Optional[dict] = None

# @router.post("/save-result")
# async def save_colorblindness_result(test: ColorBlindnessTestInput):
#     try:
#         user_obj_id = ObjectId(test.user_id)
#     except Exception:
#         raise HTTPException(status_code=400, detail="Invalid user_id format")

#     test_doc = ColorBlindnessTest(
#         user_id=user_obj_id,
#         plates=[IshiharaPlate(**plate.dict()) for plate in test.plates],
#         suspected_type=test.suspected_type,
#         confidence=test.confidence,
#         device_info=test.device_info,
#         test_date=datetime.now(timezone.utc)
#     )

#     # Save to MongoDB
#     result = db.colorblindness_tests.insert_one(test_doc.dict(by_alias=True))
#     return {"message": "Test result saved", "id": str(result.inserted_id)}

@router.post("/save-result")
async def save_colorblindness_result(test: ColorBlindnessTestInput):
    try:
        user_obj_id = ObjectId(test.user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    enriched_plates = []

    for plate in test.plates:
        plate_dict = plate.dict()

        image_url = None
        if plate.image_base64:
            try:
                # Decode base64 image
                image_data = base64.b64decode(plate.image_base64.split(",")[-1])
                image = Image.open(BytesIO(image_data))
                
                # Upload to Cloudinary
                result = cloudinary.uploader.upload(
                    BytesIO(image_data),
                    folder="colorblind-tests",
                    public_id=f"{test.user_id}_{plate.plate_number}_{datetime.now().timestamp()}"
                )
                image_url = result.get("secure_url")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

        enriched_plates.append(IshiharaPlate(
            plate_number=plate.plate_number,
            correct_answer=plate.correct_answer,
            user_answer=plate.user_answer,
            is_correct=plate.is_correct,
            image_url=image_url
        ))

    test_doc = ColorBlindnessTest(
        user_id=user_obj_id,
        plates=enriched_plates,
        suspected_type=test.suspected_type,
        confidence=test.confidence,
        device_info=test.device_info,
        test_date=datetime.now(timezone.utc)
    )

    result = db.colorblindness_tests.insert_one(test_doc.dict(by_alias=True))
    return {"message": "Test result saved", "id": str(result.inserted_id)}


@router.get("/results/{user_id}")
async def get_user_colorblindness_results(user_id: str):
    """
    Get the latest colorblindness test result for a specific user
    """
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Find the most recent test for this user
    test_result = db.colorblindness_tests.find_one(
        {"user_id": user_obj_id},
        sort=[("test_date", -1)]  # Sort by test_date descending to get the latest
    )
    
    if not test_result:
        raise HTTPException(status_code=404, detail="No test results found for this user")
    
    # Convert ObjectId to string for JSON serialization
    test_result["_id"] = str(test_result["_id"])
    test_result["user_id"] = str(test_result["user_id"])
    
    return test_result

@router.get("/results/{user_id}/all")
async def get_all_user_colorblindness_results(user_id: str):
    """
    Get all colorblindness test results for a specific user (optional endpoint for history)
    """
    try:
        user_obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")
    
    # Find all tests for this user, sorted by most recent first
    test_results = list(db.colorblindness_tests.find(
        {"user_id": user_obj_id},
        sort=[("test_date", -1)]
    ))
    
    if not test_results:
        raise HTTPException(status_code=404, detail="No test results found for this user")
    
    # Convert ObjectIds to strings for JSON serialization
    for result in test_results:
        result["_id"] = str(result["_id"])
        result["user_id"] = str(result["user_id"])
    
    return {"results": test_results, "count": len(test_results)}

@router.get("/results/{user_id}/latest")
async def get_latest_user_colorblindness_result(user_id: str):
    """
    Alternative endpoint that explicitly gets the latest result (same as /results/{user_id})
    """
    return await get_user_colorblindness_results(user_id)