from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    slug = Column(String, unique=True, index=True) # e.g., 'nombre-barberia'
    logo_url = Column(String, nullable=True)
    address = Column(String, nullable=True)
    map_url = Column(String, nullable=True) # Google Maps enlace o iframe
    bank_details = Column(String, nullable=True) # For manual transfers
    subscription_proof_url = Column(String, nullable=True) # For SaaS subscription
    theme_color = Column(String, default="#3b82f6") # Blue 500 default
    whatsapp_number = Column(String, nullable=True) # WhatsApp del barbero
    is_active = Column(Boolean, default=False)
    payment_status = Column(String, default="pending_approval") # 'paid', 'pending_approval', 'suspended', 'trial'
    created_at = Column(DateTime, default=datetime.utcnow)

    users = relationship("User", back_populates="tenant")
    services = relationship("Service", back_populates="tenant")
    appointments = relationship("Appointment", back_populates="tenant")
    staff = relationship("StaffMember", back_populates="tenant")
    expenses = relationship("Expense", back_populates="tenant")
    gallery = relationship("GalleryImage", back_populates="tenant")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="tenant_admin") # 'super_admin' or 'tenant_admin'
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)

    tenant = relationship("Tenant", back_populates="users")

class StaffMember(Base):
    __tablename__ = "staff_members"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String, index=True)
    base_salary = Column(Float, default=0.0)
    commission_percentage = Column(Float, default=0.0)
    working_hours = Column(String, nullable=True) # e.g., JSON string or simple schedule
    is_active = Column(Boolean, default=True)

    tenant = relationship("Tenant", back_populates="staff")
    appointments = relationship("Appointment", back_populates="staff")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    duration_minutes = Column(Integer)
    image_url = Column(String, nullable=True)

    tenant = relationship("Tenant", back_populates="services")
    appointments = relationship("Appointment", back_populates="service")

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    staff_id = Column(Integer, ForeignKey("staff_members.id"), nullable=True)
    client_name = Column(String)
    client_whatsapp = Column(String)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    payment_proof_url = Column(String, nullable=True)
    status = Column(String, default="pending_approval") # 'pending_approval', 'booked', 'completed', 'cancelled'

    tenant = relationship("Tenant", back_populates="appointments")
    service = relationship("Service", back_populates="appointments")
    staff = relationship("StaffMember", back_populates="appointments")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    category = Column(String) # 'Alquiler y servicios', 'Sueldos/comisiones', 'Insumos', 'Marketing', 'Impuestos'
    amount = Column(Float)
    date = Column(DateTime, default=datetime.utcnow)
    description = Column(String, nullable=True)

    tenant = relationship("Tenant", back_populates="expenses")

class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    image_url = Column(String)
    description = Column(String, nullable=True)

    tenant = relationship("Tenant", back_populates="gallery")
