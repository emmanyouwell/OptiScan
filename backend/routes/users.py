from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Request, Depends
from fastapi.responses import JSONResponse

# MongoDB and Secret Key
from config.db import db  
from utils.utils import SECRET_KEY

# Cloudinary - Use your config
import cloudinary.uploader
from config.cloudinary_config import upload_image  # Import your function

# Logging
import logging

from itsdangerous import URLSafeTimedSerializer
from bson import ObjectId
import bcrypt
from utils.utils import create_access_token, get_current_user
from datetime import timedelta, datetime, date, timezone
from models.users import Role, Gender
from typing import Optional

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

serializer = URLSafeTimedSerializer(SECRET_KEY)

@router.post("/register")
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    age: int = Form(...),
    gender: Optional[str] = Form(None),
    img: UploadFile = File(None)  # Make img optional
):
    try:
        # Validate age
        if age < 1 or age > 150:
            raise HTTPException(status_code=400, detail="Age must be between 1 and 150")
        
        # Validate gender if provided
        if gender and gender not in [g.value for g in Gender]:
            raise HTTPException(status_code=400, detail="Invalid gender. Must be 'male' or 'female'")
        
        # Check if email already exists
        if db["users"].find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if username already exists
        if db["users"].find_one({"username": username}):
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Handle image upload - EXACTLY as you specified
        img_url = None
        if img:
            try:
                # Ensure the "users" folder exists in Cloudinary
                result = cloudinary.uploader.upload(img.file, folder="users")
                img_url = result.get("secure_url")
            except Exception as e:
                logger.error(f"Image upload failed: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
        
        # Create user document
        user_dict = {
            "username": username,
            "age": age,
            "email": email,
            "password": hashed_password.decode('utf-8'),
            "img_path": img_url,
            "gender": gender,
            "role": Role.user.value,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert user into database
        inserted_user = db["users"].insert_one(user_dict)
        user_id = str(inserted_user.inserted_id)
        
        logger.info(f"User registered successfully: {email}")
        
        # Return success response
        return JSONResponse(
            status_code=201,
            content={
                "message": "User registered successfully",
                "user": {
                    "id": user_id,
                    "username": username,
                    "age": age,
                    "email": email,
                    "img_path": img_url,
                    "gender": gender,
                    "role": Role.user.value,
                    "created_at": user_dict["created_at"]
                }
            }
        )
    
    except HTTPException as e:
        logger.error(f"HTTPException: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"An error occurred during registration: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred during registration: {str(e)}")

                    
@router.post("/login")
async def login(
    email: str = Form(...),
    password: str = Form(...)
):
    try:
        # Find user by email
        user = db["users"].find_one({"email": email})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create access token
        access_token_expires = timedelta(days=30)
        access_token = create_access_token(
            data={"sub": str(user["_id"])},
            expires_delta=access_token_expires
        )
        
        # Return user info and token
        return JSONResponse(content={
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user["_id"]),
                "username": user["username"],
                "age": user.get("age"),
                "email": user["email"],
                "img_path": user.get("img_path"),
                "gender": user.get("gender"),
                "role": user["role"],
                "created_at": user.get("created_at")
            }
        })
    
    except HTTPException as e:
        logger.error(f"HTTPException: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"An error occurred during login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred during login: {str(e)}")