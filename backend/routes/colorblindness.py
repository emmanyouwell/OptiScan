from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from torchvision import transforms, models
from PIL import Image
import torch
import io
import torch.nn as nn
import os

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
    model.load_state_dict(torch.load("backend/models/ishihara_cnn.pt"))
    model.eval()

    with torch.no_grad():
        output = model(image)
        _, predicted = torch.max(output, 1)

    return {"predicted_number": predicted.item()}


