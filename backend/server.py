from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, eye_tracking, mediapipe, colorblindness, ashihara_plates
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response
import os

class CORSMiddlewareStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        response: Response = await super().get_response(path, scope)
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGE_FOLDER = os.path.join(BASE_DIR, "data", "ishihara_cards", "images")

api_app = FastAPI()

api_app.include_router(users.router, prefix="/users")
api_app.include_router(eye_tracking.router, prefix="/eye-tracking")
api_app.include_router(mediapipe.router, prefix="/mediapipe")  # Add this line
api_app.include_router(colorblindness.router, prefix="/colorblindness") 
# api_app.include_router(colorblindness_save.router, prefix="/colorblindness")
api_app.include_router(ashihara_plates.router, prefix="/plates")

app = FastAPI()

origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all `/api` routes
app.mount("/api", api_app)

# app.mount("/images", StaticFiles(directory=IMAGE_FOLDER), name="images")
app.mount("/images", CORSMiddlewareStaticFiles(directory=IMAGE_FOLDER), name="images")
