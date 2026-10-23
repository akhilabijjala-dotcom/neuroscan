from sqlalchemy.orm import Session
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pwdlib import PasswordHash
import jwt
from datetime import datetime, timedelta, timezone

from models import User
import os
from dotenv import load_dotenv

from itsdangerous import URLSafeTimedSerializer

load_dotenv()

password_hash = PasswordHash.recommended()

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

def create_user(
    db: Session,
    name: str,
    email: str,
    password: str,
    medical_license_id: str,
    role: str,
    approval_status: str = "pending",
):
    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = password_hash.hash(password)

    user = User(
        name=name,
        email=email,
        password_hash=hashed_password,
        medical_license_id=medical_license_id,
        role=role,
        approval_status=approval_status,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user
def authenticate_user(
    db: Session,
    email: str,
    password: str
):

    user = db.query(User).filter(User.email == email).first()

    if not user:
        return None

    if not password_hash.verify(
        password,
        user.password_hash
    ):
        return None

    return user


def create_access_token(user_id: int):

    expire = datetime.now(timezone.utc) + timedelta(hours=2)

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return int(user_id)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
def require_admin(user_id: int, db: Session):
    admin = db.query(User).filter(User.id == user_id).first()

    if not admin or admin.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return admin

RESET_TOKEN_EXPIRES_SECONDS = 900

def get_reset_serializer():
    return URLSafeTimedSerializer(SECRET_KEY)