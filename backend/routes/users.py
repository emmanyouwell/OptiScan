from fastapi import APIRouter, HTTPException, File, UploadFile, Form, Request, Depends
from fastapi.responses import JSONResponse


# MongoDB and Secret Key
from config.db import db  
from utils.utils import SECRET_KEY

# # Cloudinary
# import cloudinary.uploader
# import config.cloudinary_config 



# Logging
import logging


from itsdangerous import URLSafeTimedSerializer
from bson import ObjectId
import bcrypt
from utils.utils import create_access_token, get_current_user
from datetime import timedelta, datetime, date  
from models.users import Role
from fastapi import Body


router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the serializer with the SECRET_KEY
serializer = URLSafeTimedSerializer(SECRET_KEY)


@router.post("/register")
async def register(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
):
    try:
        if db["users"].find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # img_url = None
        # if img:
        #     try:
        #         # Ensure the "users" folder exists in Cloudinary
        #         result = cloudinary.uploader.upload(img.file, folder="users")
        #         img_url = result.get("secure_url")
        #     except Exception as e:
        #         logger.error(f"Image upload failed: {str(e)}")
        #         raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")
        
        # birthday_str = birthday.strftime("%Y-%m-%d")
        
        # otp = generate_otp()
        
        user_dict = {
            "username": username,
            "email": email,
            "password": hashed_password.decode('utf-8'),
            "role": Role.user,
            "created_at": datetime.now().isoformat(),  # Add created_at field
        }
        inserted_user = db["users"].insert_one(user_dict)
        user_dict["_id"] = str(inserted_user.inserted_id)

        # Send verification email with OTP
        # send_verification_email(email, otp)
        
        return JSONResponse(content={"email": email})
    
    except HTTPException as e:
        logger.error(f"HTTPException: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


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
        access_token_expires = timedelta(days=30)  # Token expires in 30 days
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
                "email": user["email"],
                "role": user["role"]
            }
        })
    
    except HTTPException as e:
        logger.error(f"HTTPException: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"An error occurred during login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred during login: {str(e)}")



