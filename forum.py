from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from db_config import supabase, container_client
from azure.storage.blob import ContentSettings
import uuid
from urllib.parse import quote

class ForumCreate(BaseModel):
    title: str
    content: str
    is_private: bool = False
    classroom_id: Optional[str] = None
    user_id: str

router = APIRouter()

STORAGE_ACCOUNT = "eduwallet"
CONTAINER_NAME = "eduwalletfinal"


def get_blob_url(blob_name, preview=False):
    blob_url = f"https://{STORAGE_ACCOUNT}.blob.core.windows.net/{CONTAINER_NAME}/{blob_name}"

    office_ext = (".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx")

    if preview and blob_name.lower().endswith(office_ext):
        encoded = quote(blob_url, safe="")
        return f"https://view.officeapps.live.com/op/view.aspx?src={encoded}"

    return blob_url


@router.get("/forums")
def list_forums():
    try:
        response = supabase.table("forums").select("*").execute()
        return {"forums": response.data}
    except Exception as e:
        print("FORUM LIST ERROR:", e)
        return {"forums": [], "error": str(e)}


@router.get("/forum_notes/{forum_id}")
def get_notes(forum_id: str):
    try:
        response = supabase.table("forum_notes") \
            .select("*, users(username)") \
            .eq("forum_id", forum_id) \
            .execute()

        notes = []

        for note in response.data:
            blob_name = note.get("blob_name")

            if not blob_name:
                continue

            is_dl = str(note.get("is_downloadable")).lower() == "true"

            username = (
                note.get("users", {}).get("username")
                if note.get("users")
                else "Unknown"
            )

            preview_url = get_blob_url(blob_name, preview=True)
            download_url = get_blob_url(blob_name)

            notes.append({
                "id": note.get("id"),
                "file_name": note.get("file_name"),
                "description": note.get("description"),
                "tags": note.get("tags"),
                "uploaded_by": username,
                "preview": preview_url,
                "download": download_url if is_dl else None
            })

        return {"notes": notes}

    except Exception as e:
        print("NOTES ERROR:", e)
        return {"notes": [], "error": str(e)}


@router.post("/create_forum")
async def create_forum(data: dict):
    try:
        supabase.table("forums").insert({
            "id": str(uuid.uuid4()),
            "name": data["name"],
            "description": data["description"],
            "created_by": data["user_id"]
        }).execute()

        return {"message": "Forum created"}

    except Exception as e:
        print("CREATE FORUM ERROR:", e)
        return {"error": str(e)}

# Extra Endpoints

@router.put("/update_note/{note_id}")
def update_note(note_id: str, description: Optional[str] = None, tags: Optional[str] = None):
    update_data = {}
    if description is not None: update_data["description"] = description
    if tags is not None: update_data["tags"] = tags
    if not update_data: raise HTTPException(status_code=400, detail="No fields to update")
    response = supabase.table("forum_notes").update(update_data).eq("id", note_id).execute()
    return {"message": "Note updated", "data": response.data}

# ---------------- CREATE POST (FORUM) ----------------
@router.post("/create")
def create_post(data: ForumCreate):
    if data.is_private and not data.classroom_id:
        raise HTTPException(status_code=400, detail="Private posts require classroom_id")

    response = supabase.table("forums").insert({
        "id": str(uuid.uuid4()),
        "name": data.title,
        "description": data.content,
        "is_private": data.is_private,
        "classroom_id": data.classroom_id,
        "created_by": data.user_id
    }).execute()

    return {"message": "Post created", "data": response.data}

# ---------------- UPDATE POST ----------------
@router.put("/update/{post_id}")
def update_post(post_id: str, title: Optional[str] = None, content: Optional[str] = None, is_private: Optional[bool] = None):
    update_data = {}
    if title is not None: update_data["name"] = title
    if content is not None: update_data["description"] = content
    if is_private is not None: update_data["is_private"] = is_private
    if not update_data: raise HTTPException(status_code=400, detail="No fields to update")
    response = supabase.table("forums").update(update_data).eq("id", post_id).execute()
    return {"message": "Post updated", "data": response.data}

# ---------------- DELETE POST ----------------
@router.delete("/delete/{post_id}")
def delete_post(post_id: str):
    supabase.table("forums").delete().eq("id", post_id).execute()
    return {"message": "Post deleted"}

# ---------------- GET PUBLIC POSTS ----------------
@router.get("/public")
def get_public_posts():
    response = supabase.table("forums").select("*").eq("is_private", False).execute()
    return {"data": response.data}

# ---------------- ADD FORUM MEMBER ----------------
@router.post("/add-member")
def add_forum_member(forum_id: str, user_id: str, role: str = "member"):
    response = supabase.table("forum_members").insert({
        "forum_id": forum_id, "user_id": user_id, "role": role
    }).execute()
    return {"message": "Member added", "data": response.data}

# ---------------- GET FORUM MEMBERS ----------------
@router.get("/members/{forum_id}")
def get_forum_members(forum_id: str):
    response = supabase.table("forum_members").select("*").eq("forum_id", forum_id).execute()
    return {"data": response.data}



@router.post("/upload_note")
async def upload_note(
    forum_id: str = Form(...),
    user_id: str = Form(...),
    file: UploadFile = File(...),
    description: str = Form(""),
    tags: str = Form(""),
    is_downloadable: bool = Form(True)
):
    try:
        safe_name = file.filename.replace(" ", "_")
        blob_name = f"{uuid.uuid4()}_{safe_name}"

        file_data = await file.read()

        blob_client = container_client.get_blob_client(blob_name)

        content_settings = ContentSettings(
            content_type=file.content_type
        )

        blob_client.upload_blob(
            file_data,
            overwrite=True,
            content_settings=content_settings
        )

        file_url = get_blob_url(blob_name)

        supabase.table("forum_notes").insert({
            "id": str(uuid.uuid4()),
            "forum_id": forum_id,
            "uploaded_by": user_id,
            "file_name": file.filename,
            "blob_name": blob_name,
            "file_url": file_url,
            "description": description,
            "tags": tags,
            "is_downloadable": is_downloadable
        }).execute()

        return {
            "message": "Uploaded successfully",
            "preview": get_blob_url(blob_name, preview=True),
            "download": file_url
        }

    except Exception as e:
        print("FORUM UPLOAD ERROR:", e)
        return {"error": str(e)}