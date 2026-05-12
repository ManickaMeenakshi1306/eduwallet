from fastapi import APIRouter, UploadFile, File, Form
from db_config import supabase, container_client
from azure.storage.blob import ContentSettings
import uuid
from urllib.parse import quote

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


@router.get("/{user_id}")
def get_wallet(user_id: str):
    try:
        response = supabase.table("wallet_files") \
            .select("*") \
            .eq("user_id", user_id) \
            .execute()

        files = []

        for file in response.data:
            blob_name = file.get("blob_name")

            if not blob_name:
                continue

            preview_url = get_blob_url(blob_name, preview=True)
            download_url = get_blob_url(blob_name)

            files.append({
                "id": file.get("id"),
                "file_name": file.get("file_name"),
                "subject": file.get("subject"),
                "tags": file.get("tags"),
                "preview": preview_url,
                "download": download_url
            })

        return {"wallet_files": files}

    except Exception as e:
        print("WALLET ERROR:", e)
        return {"wallet_files": [], "error": str(e)}


@router.post("/upload")
async def upload_wallet_file(
    user_id: str = Form(...),
    file: UploadFile = File(...),
    subject: str = Form(""),
    tags: str = Form("")
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

        tag_list = [t.strip() for t in tags.split(",")] if tags else []

        supabase.table("wallet_files").insert({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "file_name": file.filename,
            "blob_name": blob_name,
            "subject": subject,
            "tags": tag_list
        }).execute()

        file_url = get_blob_url(blob_name)
        
        from auth import add_credits
        add_credits(user_id, 2)

        return {
            "message": "Uploaded successfully (+2 credits)",
            "preview": get_blob_url(blob_name, preview=True),
            "download": file_url
        }

    except Exception as e:
        print("UPLOAD ERROR:", e)
        return {"error": str(e)}


@router.delete("/delete/{file_id}")
def delete_file(file_id: str):
    try:
        res = supabase.table("wallet_files") \
            .select("blob_name") \
            .eq("id", file_id) \
            .execute()

        if res.data:
            blob_name = res.data[0]["blob_name"]
            container_client.get_blob_client(blob_name).delete_blob()

        supabase.table("wallet_files").delete().eq("id", file_id).execute()

        return {"message": "Deleted successfully"}

    except Exception as e:
        print("DELETE ERROR:", e)
        return {"error": str(e)}