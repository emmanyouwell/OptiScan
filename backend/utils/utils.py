from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from config.db import db
from bson import ObjectId
import logging

# Use HTTPBearer for token authentication
oauth2_scheme = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET_KEY = "b6562e66f1c68ffe24fa"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPBearer = Depends(oauth2_scheme)):
    token = credentials.credentials
    logging.info(f"Token received: {token}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.info(f"Payload decoded: {payload}")
        user_id: str = payload.get("sub")
        if user_id is None:
            logging.error("Invalid authentication credentials: user_id is None")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        logging.info(f"Querying user with ID: {user_id}")
        user = db["users"].find_one({"_id": ObjectId(user_id)})
        logging.info(f"Database query result found: {user is not None}")
        if user is None:
            logging.error(f"User not found: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        
        logging.info(f"User authenticated: {user_id}")
        return {"_id": user["_id"]}
    except JWTError as e:
        logging.error(f"JWTError: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except Exception as e:
        logging.error(f"Error in get_current_user: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")