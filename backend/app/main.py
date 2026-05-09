from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import re
import shutil
import uuid

from . import models, schemas, database
from typing import List
from datetime import datetime, timedelta

# --- AUTH CONFIG ---
SECRET_KEY = "super-secret-key-for-excelittysoft" # In production, use env var
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


from fastapi.staticfiles import StaticFiles

app = FastAPI(title="ExcelittySoft Barber API", version="1.0.0")

# Montar frontend para poder acceder desde un solo dominio
frontend_path = os.path.join(os.path.dirname(__file__), "../../frontend")
if os.path.exists(frontend_path):
    app.mount("/app", StaticFiles(directory=frontend_path, html=True), name="frontend")


@app.on_event("startup")
def seed_database():
    import traceback
    try:
        # Intentamos crear las tablas si no existen
        models.Base.metadata.create_all(bind=database.engine)
        
        db = database.SessionLocal()
        # Seed Super Admin
        admin_email = "admin@vipcentral.com"
        admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_user:
            admin_user = models.User(
                email=admin_email,
                hashed_password=get_password_hash("password123"),
                role="super_admin"
            )
            db.add(admin_user)
        
        # Seed Demo Tenant (El Rey Barber Shop)
        demo_slug = "el-rey-barber-shop"
        tenant = db.query(models.Tenant).filter(models.Tenant.slug == demo_slug).first()
        if not tenant:
            tenant = models.Tenant(
                name="El Rey Barber Shop",
                slug=demo_slug,
                is_active=True,
                payment_status="paid",
                bank_details="Banco Atlas | Cta: 888899 | CI: 1234567",
                theme_color="#0ea5e9" # Un azul distinto para demo
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)
            
            # Seed Demo Barber User
            barber_user = models.User(
                email="barbero@elrey.com",
                hashed_password=get_password_hash("password123"),
                role="tenant_admin",
                tenant_id=tenant.id
            )
            db.add(barber_user)
            
            # Seed Demo Services
            db.add(models.Service(tenant_id=tenant.id, name="Corte Fade V.I.P", price=50000, duration_minutes=45))
            db.add(models.Service(tenant_id=tenant.id, name="Corte Clásico + Barba", price=75000, duration_minutes=60))
            
            # Seed Demo Staff
            db.add(models.StaffMember(tenant_id=tenant.id, name="Carlos Master"))
            
        db.commit()
        db.close()
    except Exception as e:
        print(f"CRITICAL ERROR IN STARTUP: {e}")
        traceback.print_exc()
        try:
            db.close()
        except:
            pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

from typing import Optional

class RegisterRequest(BaseModel):
    barberName: str
    barberEmail: str
    barberPassword: str
    subscriptionProofUrl: Optional[str] = None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

# --- INFRAESTRUCTURA PARA AUTOMATIZACIÓN DE WHATSAPP ---
def send_whatsapp_notification(phone: str, message: str):
    """
    TODO: Conectar credenciales de API de WhatsApp aquí.
    Esta función se invoca para:
    - Inmediatamente al hacer la reserva (Aviso de solicitud enviada).
    - Cuando el barbero confirma el pago (Aviso de turno confirmado).
    - (Para recordatorios 24h y el mismo día, se debe implementar un worker o cronjob).
    """
    print(f"[WhatsApp Webhook Mock] A: {phone} | Mensaje: {message}")

# --- RUTAS DE AUTENTICACIÓN / REGISTRO ---
@app.post("/api/upload", tags=["Upload"])
async def upload_proof(file: UploadFile = File(None)):
    if not file:
        return {"url": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300"} # Placeholder
    
    file_id = str(uuid.uuid4())
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{file_id}.{ext}"
    os.makedirs("uploads", exist_ok=True)
    with open(f"uploads/{filename}", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/uploads/{filename}"}

# Montar uploads para ver las imágenes
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads_dir")

@app.post("/api/auth/register", response_model=schemas.Tenant, tags=["Auth"])
def register_barber(req: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == req.barberEmail).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    slug = generate_slug(req.barberName)
    if db.query(models.Tenant).filter(models.Tenant.slug == slug).first():
        slug = f"{slug}-{int(datetime.utcnow().timestamp())}"

    new_tenant = models.Tenant(
        name=req.barberName,
        slug=slug,
        payment_status="pending_approval", 
        is_active=False,
        subscription_proof_url=req.subscriptionProofUrl
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    new_user = models.User(
        email=req.barberEmail,
        hashed_password=get_password_hash(req.barberPassword),
        role="tenant_admin",
        tenant_id=new_tenant.id
    )
    db.add(new_user)
    db.commit()

    return new_tenant

@app.post("/api/auth/login", tags=["Auth"])
def login(req: dict, db: Session = Depends(get_db)):
    email = req.get("email")
    password = req.get("password")
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "tenant_id": user.tenant_id},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "tenant_id": user.tenant_id,
        "role": user.role,
        "tenant_slug": user.tenant.slug if user.tenant else None
    }


# --- RUTAS SUPER ADMIN ---
def require_super_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requieren permisos de Super Admin")
    return current_user

@app.get("/api/sinaptix-master-admin/tenants", response_model=List[schemas.Tenant], tags=["SuperAdmin"])
def read_all_tenants(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    return db.query(models.Tenant).offset(skip).limit(limit).all()

@app.put("/api/sinaptix-master-admin/tenants/{tenant_id}/status", tags=["SuperAdmin"])
def update_tenant_status(tenant_id: int, req: dict, db: Session = Depends(get_db), current_user: models.User = Depends(require_super_admin)):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if "payment_status" in req:
        tenant.payment_status = req["payment_status"]
    if "is_active" in req:
        tenant.is_active = req["is_active"]
    db.commit()
    return {"message": "Status updated successfully"}


# --- RUTAS TENANT ADMIN (Barbero) ---
def require_tenant_admin(tenant_id: int, current_user: models.User = Depends(get_current_user)):
    if current_user.role != "super_admin" and current_user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="No tienes acceso a este tenant")
    return current_user

@app.get("/api/tenant/{tenant_id}/services", response_model=List[schemas.Service], tags=["TenantAdmin"])
def read_services(tenant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    return db.query(models.Service).filter(models.Service.tenant_id == tenant_id).all()

@app.post("/api/tenant/{tenant_id}/services", response_model=schemas.Service, tags=["TenantAdmin"])
def create_service(tenant_id: int, service: schemas.ServiceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    db_service = models.Service(**service.model_dump(), tenant_id=tenant_id)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@app.delete("/api/tenant/{tenant_id}/services/{service_id}", tags=["TenantAdmin"])
def delete_service(tenant_id: int, service_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    service = db.query(models.Service).filter(models.Service.id == service_id, models.Service.tenant_id == tenant_id).first()
    if service:
        db.delete(service)
        db.commit()
    return {"message": "Deleted"}

@app.get("/api/tenant/{tenant_id}/appointments", response_model=List[schemas.Appointment], tags=["TenantAdmin"])
def read_appointments(tenant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    return db.query(models.Appointment).filter(models.Appointment.tenant_id == tenant_id).order_by(models.Appointment.start_time.asc()).all()

@app.put("/api/tenant/{tenant_id}/appointments/{appointment_id}/status", response_model=schemas.Appointment, tags=["TenantAdmin"])
def update_appointment_status(tenant_id: int, appointment_id: int, req: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    appo = db.query(models.Appointment).filter(models.Appointment.id == appointment_id, models.Appointment.tenant_id == tenant_id).first()
    if not appo:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if "status" in req:
        appo.status = req["status"]
        if appo.status == "booked":
            send_whatsapp_notification(appo.client_whatsapp, f"¡Hola {appo.client_name}! Tu turno ha sido confirmado.")

    db.commit()
    db.refresh(appo)
    return appo

# Staff
@app.get("/api/tenant/{tenant_id}/staff", response_model=List[schemas.StaffMember], tags=["TenantAdmin"])
def read_staff(tenant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    return db.query(models.StaffMember).filter(models.StaffMember.tenant_id == tenant_id).all()

@app.post("/api/tenant/{tenant_id}/staff", response_model=schemas.StaffMember, tags=["TenantAdmin"])
def create_staff(tenant_id: int, staff: schemas.StaffMemberCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    db_staff = models.StaffMember(**staff.model_dump(), tenant_id=tenant_id)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff

# Expenses
@app.get("/api/tenant/{tenant_id}/expenses", response_model=List[schemas.Expense], tags=["TenantAdmin"])
def read_expenses(tenant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    return db.query(models.Expense).filter(models.Expense.tenant_id == tenant_id).all()

@app.post("/api/tenant/{tenant_id}/expenses", response_model=schemas.Expense, tags=["TenantAdmin"])
def create_expense(tenant_id: int, exp: schemas.ExpenseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    db_exp = models.Expense(**exp.model_dump(), tenant_id=tenant_id)
    db.add(db_exp)
    db.commit()
    db.refresh(db_exp)
    return db_exp

# Gallery
@app.get("/api/tenant/{tenant_id}/gallery", response_model=List[schemas.GalleryImage], tags=["TenantAdmin"])
def read_gallery(tenant_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    return db.query(models.GalleryImage).filter(models.GalleryImage.tenant_id == tenant_id).all()

@app.post("/api/tenant/{tenant_id}/gallery", response_model=schemas.GalleryImage, tags=["TenantAdmin"])
def create_gallery_image(tenant_id: int, gal: schemas.GalleryImageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    db_gal = models.GalleryImage(**gal.model_dump(), tenant_id=tenant_id)
    db.add(db_gal)
    db.commit()
    db.refresh(db_gal)
    return db_gal

@app.put("/api/tenant/{tenant_id}/settings", tags=["TenantAdmin"])
def update_tenant_settings(tenant_id: int, req: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_tenant_admin(tenant_id, current_user)
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    if "bank_details" in req:
        tenant.bank_details = req["bank_details"]
    if "theme_color" in req:
        tenant.theme_color = req["theme_color"]
    db.commit()
    return {"message": "Settings updated"}


# --- RUTAS VISTA PÚBLICA ---
@app.get("/api/public/{tenant_slug}", response_model=schemas.Tenant, tags=["Public"])
def get_public_tenant(tenant_slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Barbería no encontrada o inactiva")
    return tenant

@app.get("/api/public/{tenant_slug}/services", response_model=List[schemas.Service], tags=["Public"])
def read_public_services(tenant_slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Barbería no encontrada o inactiva")
    return db.query(models.Service).filter(models.Service.tenant_id == tenant.id).all()

@app.get("/api/public/{tenant_slug}/booked-times", tags=["Public"])
def get_booked_times(tenant_slug: str, date: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Barbería no encontrada o inactiva")
    
    # Parse date
    try:
        query_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    # Fetch appointments for that day that are booked or pending
    start_of_day = datetime.combine(query_date, datetime.min.time())
    end_of_day = datetime.combine(query_date, datetime.max.time())

    apps = db.query(models.Appointment).filter(
        models.Appointment.tenant_id == tenant.id,
        models.Appointment.start_time >= start_of_day,
        models.Appointment.start_time <= end_of_day,
        models.Appointment.status.in_(["booked", "pending_approval"])
    ).all()

    # Extract just the times in "HH:MM" format
    booked_times = [app.start_time.strftime("%H:%M") for app in apps]
    return {"booked_times": booked_times}

@app.post("/api/public/{tenant_slug}/appointments", response_model=schemas.Appointment, tags=["Public"])
def create_public_appointment(tenant_slug: str, appointment: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Barbería no encontrada o inactiva")
    
    # Check if a staff exists for this staff_id and tenant
    if appointment.staff_id:
        staff = db.query(models.StaffMember).filter(models.StaffMember.id == appointment.staff_id, models.StaffMember.tenant_id == tenant.id).first()
        if not staff:
            raise HTTPException(status_code=400, detail="Personal seleccionado inválido")

    db_appointment = models.Appointment(**appointment.model_dump(), tenant_id=tenant.id, status="pending_approval")
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    
    send_whatsapp_notification(db_appointment.client_whatsapp, f"¡Hola {db_appointment.client_name}! Tu solicitud de turno ha sido enviada y está pendiente de aprobación.")
    
    return db_appointment

@app.get("/api/public/{tenant_slug}/staff", response_model=List[schemas.StaffMember], tags=["Public"])
def read_public_staff(tenant_slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Barbería no encontrada o inactiva")
    return db.query(models.StaffMember).filter(models.StaffMember.tenant_id == tenant.id, models.StaffMember.is_active == True).all()

@app.get("/api/public/{tenant_slug}/gallery", response_model=List[schemas.GalleryImage], tags=["Public"])
def read_public_gallery(tenant_slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == tenant_slug).first()
    if not tenant or not tenant.is_active:
        raise HTTPException(status_code=404, detail="Barbería no encontrada o inactiva")
    return db.query(models.GalleryImage).filter(models.GalleryImage.tenant_id == tenant.id).all()

# --- RUTAS DE UPLOADS ---
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload", tags=["Uploads"])
def upload_file(file: UploadFile = File(...)):
    ext = file.filename.split(".")[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"/uploads/{filename}"}

# Mount static files (uploads and frontend)
if os.path.exists(UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
