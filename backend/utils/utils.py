from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from config.db import db  # Import the MongoDB database
from bson import ObjectId
import logging


# Mailtrap
# from config.mailtrap import MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM
# import smtplib
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Secret key for signing tokens
SECRET_KEY = "b6562e66f1c68ffe24fa"

ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=1)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    logging.info(f"Token received: {token}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logging.info(f"Payload decoded: {payload}")
        user_id: str = payload.get("sub")
        if user_id is None:
            logging.error("Invalid authentication credentials: user_id is None")
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        logging.info(f"Querying user with email: {user_id}")
        user = db["users"].find_one({"email": user_id})
        logging.info(f"Database query result: {user}")
        if user is None:
            logging.error(f"User not found: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        
        logging.info(f"User authenticated: {user_id}")
        return {"_id": user["_id"]}
    except JWTError as e:
        logging.error(f"JWTError: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
# def generate_otp():
#     return random.randint(100000, 999999)

# def send_verification_email(email: str, otp: int):
#     subject = "Email Verification"
#     body = f"""
#     <!DOCTYPE html>
#     <html lang="en">
#     <head>
#         <meta charset="UTF-8">
#         <meta name="viewport" content="width=device-width, initial-scale=1.0">
#         <title>Email Verification</title>
#         <style>
#             body {{
#                 font-family: Arial, sans-serif;
#                 background-color: #351742; /* Dark Purple */
#                 color: #ffffff;
#                 margin: 0;
#                 padding: 0;
#                 display: flex;
#                 justify-content: center;
#                 align-items: center;
#                 height: 100vh;
#             }}
#             .email-container {{
#                 background-color: #5e3967; /* Light Purple */
#                 padding: 20px;
#                 border-radius: 10px;
#                 box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
#                 text-align: center;
#                 max-width: 400px;
#                 width: 100%;
#                 animation: fadeIn 1s ease-in-out;
#             }}
#             .email-container h2 {{
#                 color: #00cac9; /* Parang Blue Green */
#                 font-size: 2.5em;
#                 margin: 20px 0;
#                 animation: bounce 1.5s infinite;
#             }}
#             .email-container p {{
#                 font-size: 1.2em;
#                 margin: 10px 0;
#             }}
#             @keyframes fadeIn {{
#                 from {{
#                     opacity: 0;
#                     transform: translateY(-20px);
#                 }}
#                 to {{
#                     opacity: 1;
#                     transform: translateY(0);
#                 }}
#             }}
#             @keyframes bounce {{
#                 0%, 20%, 50%, 80%, 100% {{
#                     transform: translateY(0);
#                 }}
#                 40% {{
#                     transform: translateY(-20px);
#                 }}
#                 60% {{
#                     transform: translateY(-10px);
#                 }}
#             }}
#         </style>
#     </head>
#     <body>
#         <div class="email-container">
#             <p>Please use the following OTP to verify your email:</p>
#             <h2>{otp}</h2>
#         </div>
#     </body>
#     </html>
#     """

#     msg = MIMEMultipart()
#     msg["From"] = MAIL_FROM
#     msg["To"] = email
#     msg["Subject"] = subject
#     msg.attach(MIMEText(body, "html"))  # Use "html" instead of "plain"

#     try:
#         with smtplib.SMTP(MAIL_HOST, MAIL_PORT) as server:
#             server.login(MAIL_USERNAME, MAIL_PASSWORD)
#             server.sendmail(MAIL_FROM, email, msg.as_string())
#     except Exception as e:
#         logger.error(f"Failed to send email: {str(e)}")
#         raise HTTPException(status_code=500, detail="Failed to send email")
    
