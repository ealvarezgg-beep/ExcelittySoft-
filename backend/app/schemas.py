from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# Shared properties
class TenantBase(BaseModel):
    name: str
    slug: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    bank_details: Optional[str] = None
    theme_color: Optional[str] = "#3b82f6"

class TenantCreate(TenantBase):
    subscription_proof_url: Optional[str] = None

class Tenant(TenantBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    payment_status: str
    subscription_proof_url: Optional[str] = None
    created_at: datetime

class UserBase(BaseModel):
    email: str
    role: str = "tenant_admin"

class UserCreate(UserBase):
    password: str
    tenant_id: Optional[int] = None

class User(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: Optional[int] = None

class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    duration_minutes: int
    image_url: Optional[str] = None

class ServiceCreate(ServiceBase):
    pass

class Service(ServiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int

class StaffMemberBase(BaseModel):
    name: str
    base_salary: float = 0.0
    commission_percentage: float = 0.0
    working_hours: Optional[str] = None
    is_active: bool = True

class StaffMemberCreate(StaffMemberBase):
    pass

class StaffMember(StaffMemberBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int

class ExpenseBase(BaseModel):
    category: str
    amount: float
    description: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    date: datetime

class GalleryImageBase(BaseModel):
    image_url: str
    description: Optional[str] = None

class GalleryImageCreate(GalleryImageBase):
    pass

class GalleryImage(GalleryImageBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int

class AppointmentBase(BaseModel):
    service_id: int
    staff_id: Optional[int] = None
    client_name: str
    client_whatsapp: str
    start_time: datetime
    end_time: datetime
    payment_proof_url: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    tenant_id: int
    status: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    tenant_id: Optional[int] = None
