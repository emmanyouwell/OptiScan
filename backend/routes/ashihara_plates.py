import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import csv

router = APIRouter()

@router.get("/")
def list_plates_with_labels():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.normpath(os.path.join(base_dir, "..", "data", "ishihara_cards", "labels.csv"))
    image_path_prefix = "/images"

    plates = []

    try:
        with open(csv_path, mode="r", newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                plates.append({
                    "filename": row["filename"],
                    "label": int(row["label"]),
                    "type": int(row["type"]),
                    "url": f"{image_path_prefix}/{row['filename']}"
                })
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    return {"plates": plates}


@router.get("/{filename}")
def get_plate_by_filename(filename: str):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.normpath(os.path.join(base_dir, "..", "data", "ishihara_cards", "labels.csv"))
    image_path_prefix = "/images"

    try:
        with open(csv_path, mode="r", newline="") as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row["filename"] == filename:
                    return {
                        "filename": row["filename"],
                        "label": int(row["label"]),
                        "type": int(row["type"]),
                        "url": f"{image_path_prefix}/{row['filename']}"
                    }
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

    raise HTTPException(status_code=404, detail="Image not found")
