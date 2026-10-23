from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, func, Boolean
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    hospital_name = Column(String(150), nullable=True)
    medical_license_id = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False)
    approval_status = Column(
        String(20),
        nullable=False,
        default="pending"
    )

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    scans = relationship("Scan", back_populates="patient")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    mri_filename = Column(String(255), nullable=False)
    diagnosis = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    scan_date = Column(DateTime, server_default=func.current_timestamp())

    patient = relationship("Patient", back_populates="scans")