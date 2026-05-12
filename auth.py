from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from db_config import supabase

router = APIRouter(tags=["Auth"])
security = HTTPBearer()
DUMMY_TOKEN = "mysecrettoken123"

class UserRegister(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    user_id: str
    username: str

def add_credits(user_id: str, amount: int):
    try:
        res = supabase.table("users").select("credits").eq("id", user_id).execute()
        current = 0
        if res.data and res.data[0].get("credits") is not None:
            current = int(res.data[0]["credits"])
        
        # Update
        supabase.table("users").update({"credits": current + int(amount)}).eq("id", user_id).execute()
        return True
    except Exception as e:
        print("CREDIT UPDATE ERROR:", e)
        return False

@router.post("/register")
def register(user: UserRegister):
    try:
        response = supabase.auth.sign_up({"email": user.email, "password": user.password})
        try:
            supabase.table("users").insert({
                "id": response.user.id,
                "username": user.email.split('@')[0]
            }).execute()
        except: pass
        return {"message": "User registered", "user_id": response.user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
def login(user: UserLogin):
    try:
        response = supabase.auth.sign_in_with_password({"email": user.email, "password": user.password})
        username = None
        try:
            profile = supabase.table("users").select("username").eq("id", response.user.id).execute()
            if profile.data: username = profile.data[0]["username"]
        except: pass
        return {
            "message": "Login successful",
            "access_token": DUMMY_TOKEN,
            "user_id": response.user.id,
            "username": username
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.post("/set_username")
def set_username(data: ProfileUpdate):
    try:
        supabase.table("users").upsert({"id": data.user_id, "username": data.username}).execute()
        return {"message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile/{user_id}")
def get_username(user_id: str):
    try:
        res = supabase.table("users").select("username, credits").eq("id", user_id).execute()
        if res.data:
            return {
                "username": res.data[0]["username"],
                "credits": res.data[0].get("credits", 0)
            }
        return {"username": "User", "credits": 0}
    except:
        return {"username": "User", "credits": 0}

@router.post("/add_credits")
def api_add_credits(data: dict):
    success = add_credits(data["user_id"], data["amount"])
    return {"success": success}