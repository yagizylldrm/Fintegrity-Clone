from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from typing import Optional

from app.database import get_db, User
from app.api.auth_deps import create_access_token

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    success: bool
    role: str
    message: str
    theme: str
    access_token: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    username: str
    old_password: str
    new_password: str

class RegisterRequest(BaseModel):
    admin_username: str
    admin_password: str
    new_username: str
    new_password: str
    role: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı",
        )
    
    # Generate real JWT token
    token = create_access_token(data={"sub": user.username})
    
    return LoginResponse(
        success=True,
        role=user.role,
        message="Giriş başarılı",
        theme=user.theme or "current",
        access_token=token
    )

@router.post("/change-password")
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    
    user.password_hash = pwd_context.hash(request.new_password)
    db.commit()
    return {"success": True, "message": "Şifre başarıyla güncellendi"}

@router.post("/register")
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Verify Admin
    admin = db.query(User).filter(User.username == request.admin_username, User.role == "admin").first()
    if not admin or not verify_password(request.admin_password, admin.password_hash):
        raise HTTPException(status_code=403, detail="Sadece yöneticiler yeni kullanıcı ekleyebilir")
        
    # Check if user exists
    if db.query(User).filter(User.username == request.new_username).first():
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
        
    new_user = User(
        username=request.new_username,
        password_hash=pwd_context.hash(request.new_password),
        role=request.role,
        theme="current"
    )
    db.add(new_user)
    db.commit()
    return {"success": True, "message": f"{request.new_username} başarıyla eklendi"}

class PublicRegisterRequest(BaseModel):
    username: str
    password: str

@router.post("/register-public")
def register_public(request: PublicRegisterRequest, db: Session = Depends(get_db)):
    # Prevent duplicate usernames
    user = db.query(User).filter(User.username == request.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış")
        
    new_user = User(
        username=request.username,
        password_hash=pwd_context.hash(request.password),
        role="user",
        theme="current"
    )
    db.add(new_user)
    db.commit()
    return {"success": True, "message": "Kayıt başarıyla tamamlandı"}

class ThemeUpdateRequest(BaseModel):
    username: str
    theme: str

@router.put("/theme")
def update_theme(request: ThemeUpdateRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    user.theme = request.theme
    db.commit()
    return {"success": True, "theme": user.theme}
