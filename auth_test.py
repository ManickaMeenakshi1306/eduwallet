from fastapi import FastAPI, HTTPException
from supabase import create_client
from dotenv import load_dotenv
from pydantic import BaseModel
import os

load_dotenv()

app = FastAPI(title="Supabase Auth Test")

# =========================
# CONFIG
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


# =========================
# SCHEMAS
# =========================
class UserAuth(BaseModel):
    email: str
    password: str


class EmailOnly(BaseModel):
    email: str


# =========================
# REGISTER
# =========================
@app.post("/register")
def register(user: UserAuth):
    try:
        res = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password
        })
        return {"message": "Registered", "user": res.user}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# LOGIN (EMAIL + PASSWORD)
# =========================
@app.post("/login")
def login(user: UserAuth):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password
        })

        return {
            "message": "Login success",
            "access_token": res.session.access_token,
            "user_id": res.user.id
        }

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid credentials")


# =========================
# OTP LOGIN (EMAIL MAGIC LINK)
# =========================
@app.post("/send-otp")
def send_otp(data: EmailOnly):
    try:
        supabase.auth.sign_in_with_otp({
            "email": data.email,
            "options": {
                "email_redirect_to": "http://127.0.0.1:8000/auth/callback"
            }
        })
        return {"message": "OTP sent to email"}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# =========================
# GOOGLE LOGIN (OAUTH)
# =========================
@app.get("/google-login")
def google_login():
    try:
        res = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {
                "redirect_to": "http://127.0.0.1:8000/auth/callback"
            }
        })

        return {
            "auth_url": res.url
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# CALLBACK (FOR GOOGLE)
# =========================
@app.get("/auth/callback")
def callback():
    return {
        "message": "Google login successful (handle token in frontend)"
    }