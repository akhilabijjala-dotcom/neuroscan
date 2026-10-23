from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import traceback
from fastapi.staticfiles import StaticFiles

from predict import predict_image
from database import engine, Base
from models import User, Patient, Scan
from fastapi import Depends
from sqlalchemy.orm import Session

from auth import get_current_user, get_reset_serializer, RESET_TOKEN_EXPIRES_SECONDS, password_hash

from database import get_db
from schemas import SignupRequest, LoginRequest, PatientCreate, PatientResponse
from auth import create_user, authenticate_user, create_access_token, require_admin

from itsdangerous import BadSignature, SignatureExpired
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

def send_reset_email(to_email: str, reset_link: str):
    msg = EmailMessage()
    msg["Subject"] = "NeuroScan - Password Reset"
    msg["From"] = os.getenv("SMTP_EMAIL")
    msg["To"] = to_email

    msg.set_content(
        f"""Hello,

We received a request to reset your NeuroScan password.

Use this link to reset your password:
{reset_link}

This link expires in 15 minutes. If you did not request this,
you can ignore this email.

NeuroScan Team
"""
    )

    smtp_email = os.getenv("SMTP_EMAIL")
    smtp_password = os.getenv("SMTP_APP_PASSWORD")
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")

    if not smtp_email or not smtp_password:
        raise RuntimeError("Gmail SMTP settings are missing from the .env file.")

    with smtplib.SMTP(smtp_server, 587) as server:
        server.starttls()
        server.login(smtp_email, smtp_password)
        server.send_message(msg)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.post("/signup")
def signup(
    user_data: SignupRequest,
    db: Session = Depends(get_db)
):
    # Check whether the email is already registered
    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="This email is already registered."
        )

    # Create the account using your existing password-hashing function
    user = create_user(
        db,
        user_data.name,
        user_data.email,
        user_data.password,
        user_data.medical_license_id,
        user_data.role,
        "pending",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Registration submitted. Your account is pending approval.",
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "approval_status": user.approval_status
    }


@app.post("/login")
def login(
    user_data: LoginRequest,
    db: Session = Depends(get_db)
):
    user = authenticate_user(
        db,
        user_data.email,
        user_data.password
    )

    # Check email and password
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Do not allow pending accounts to log in
    if user.approval_status != "approved":
        raise HTTPException(
            status_code=403,
            detail="Your account is pending approval. Please contact the system administrator."
        )

    # Create a token only after approval
    access_token = create_access_token(user.id)
    print("LOGIN ROLE:", repr(user.role))
    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/")
def home():
    return {"message": "Brain Tumor Detection API is running!"}

@app.post("/predict")
async def predict(
    patient_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    try:
        # Check that the selected patient exists in MySQL
        patient = db.query(Patient).filter(
            Patient.id == patient_id
        ).first()

        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found"
            )

        # Create a unique filename to avoid overwriting uploads
        import uuid
        from pathlib import Path

        extension = Path(file.filename or "").suffix.lower()
        filename = f"{uuid.uuid4().hex}{extension}"
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Save uploaded MRI image
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run your existing CNN model
        result = predict_image(file_path)

        # Save prediction to MySQL
        scan = Scan(
            patient_id=patient.id,
            mri_filename=filename,
            diagnosis=result["prediction"],
            confidence=result["confidence"]
        )

        db.add(scan)
        db.commit()
        db.refresh(scan)

        return {
            "message": "Prediction completed and scan saved",
            "scan_id": scan.id,
            "patient_id": patient.id,
            "filename": filename,
            "image_url": f"/uploads/{filename}",
            "prediction": result["prediction"],
            "confidence": result["confidence"],
            "scan_date": (
                scan.scan_date.isoformat()
                if scan.scan_date else None
            )
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        print("Prediction error:", str(e))
        raise HTTPException(
            status_code=500,
            detail="Prediction failed or scan could not be saved"
        )

@app.post("/patients", response_model=PatientResponse)
def create_patient(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    existing_patient = db.query(Patient).filter(
        Patient.patient_code == patient_data.patient_code
    ).first()

    if existing_patient:
        raise HTTPException(
            status_code=400,
            detail="Patient code already exists"
        )

    patient = Patient(
        patient_code=patient_data.patient_code,
        name=patient_data.name,
        age=patient_data.age
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient


@app.get("/patients", response_model=list[PatientResponse])
def get_patients(
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    return (
        db.query(Patient)
        .filter(Patient.is_deleted == False)
        .order_by(Patient.id.desc())
        .all()
    )

@app.get("/patients/{patient_id}/scans")
def get_patient_scans(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.is_deleted == False
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )
    scans = db.query(Scan).filter(
        Scan.patient_id == patient_id
    ).order_by(Scan.id.desc()).all()

    return [
        {
            "id": scan.id,
            "patient_id": scan.patient_id,
            "mri_filename": scan.mri_filename,
            "diagnosis": scan.diagnosis,
            "confidence": scan.confidence,
            "scan_date": (
                scan.scan_date.isoformat()
                if scan.scan_date else None
            ),
            "image_url": f"/uploads/{scan.mri_filename}"
        }
        for scan in scans
    ]


@app.delete("/patients/{patient_id}")
def soft_delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.is_deleted == False
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    patient.is_deleted = True
    db.commit()

    return {"message": "Patient soft-deleted successfully"}


@app.post("/patients/{patient_id}/restore")
def restore_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.is_deleted == True
    ).first()

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Deleted patient not found"
        )

    patient.is_deleted = False
    db.commit()

    return {"message": "Patient restored successfully"}

    
@app.get("/scans/{scan_id}/image")
def get_scan_image(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    scan = db.query(Scan).filter(
        Scan.id == scan_id
    ).first()

    if not scan:
        raise HTTPException(
            status_code=404,
            detail="Scan not found"
        )

    from fastapi.responses import FileResponse

    file_path = os.path.join(UPLOAD_FOLDER, scan.mri_filename)

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="MRI image file not found"
        )

    return FileResponse(file_path)

@app.get("/admin/pending-users")
def get_pending_users(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(current_user_id, db)

    users = db.query(User).filter(
        User.approval_status == "pending"
    ).all()

    return [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "medical_license_id": user.medical_license_id,
            "role": user.role,
            "approval_status": user.approval_status
        }
        for user in users
    ]
@app.post("/admin/users/{user_id}/approve")
def approve_user(
    user_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(current_user_id, db)

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.approval_status == "approved":
        raise HTTPException(
            status_code=400,
            detail="User is already approved"
        )

    user.approval_status = "approved"
    db.commit()

    return {
        "message": "User approved successfully",
        "user_id": user.id,
        "approval_status": user.approval_status
    }


from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@app.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()

    if not user:
        return {
            "message": "If that email is registered, a reset link has been sent."
        }

    serializer = get_reset_serializer()
    token = serializer.dumps({"user_id": user.id}, salt="password-reset")
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    try:
        send_reset_email(user.email, reset_link)
    except Exception:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Could not send the reset email. Please try again later."
        )

    return {
        "message": "If that email is registered, a password reset link has been sent."
    }

@app.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    if len(request.new_password) < 12:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 12 characters long."
        )

    serializer = get_reset_serializer()

    try:
        data = serializer.loads(
            request.token,
            salt="password-reset",
            max_age=RESET_TOKEN_EXPIRES_SECONDS
        )
    except SignatureExpired:
        raise HTTPException(
            status_code=400,
            detail="Reset link expired. Please request a new one."
        )
    except BadSignature:
        raise HTTPException(
            status_code=400,
            detail="Invalid reset link. Please request a new one."
        )

    user = db.query(User).filter(User.id == data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset link.")

    user.password_hash = password_hash.hash(request.new_password)
    db.commit()

    return {"message": "Password reset successfully. You can now log in."}


@app.post("/admin/users/{user_id}/reject")
def reject_user(
    user_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    require_admin(current_user_id, db)

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.approval_status != "pending":
        raise HTTPException(status_code=400, detail="User is not pending")

    user.approval_status = "rejected"
    db.commit()

    return {
        "message": "User rejected successfully",
        "user_id": user.id,
        "approval_status": user.approval_status
    }
