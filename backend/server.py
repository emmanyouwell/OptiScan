# In your server.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import users, eye_tracking  # Add this import

api_app = FastAPI()

api_app.include_router(users.router, prefix="/users")
api_app.include_router(eye_tracking.router, prefix="/eye-tracking")  # Add this line

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