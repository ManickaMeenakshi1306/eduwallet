from fastapi import FastAPI, Query
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from db_config import container_client
from forum import router as forum_router
from wallet import router as wallet_router
from auth import router as auth_router
from sum import router as summarizer_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Server Running 🚀"}

@app.get("/file/{file_name}")
def get_file(file_name: str, mode: str = Query(None)):
    if not file_name or file_name == "None":
        return {"error": "Invalid file name"}
    try:
        blob_client = container_client.get_blob_client(file_name)
        props = blob_client.get_blob_properties()
        is_download = props.metadata.get("is_downloadable", "true") == "true"
        
        import mimetypes
        m_type, _ = mimetypes.guess_type(file_name)
        if not m_type:
            m_type = "application/octet-stream"
        
        if mode == "preview": 
            is_download = False
        elif mode == "download": 
            is_download = True

        def stream_blob():
            download_stream = blob_client.download_blob()
            for chunk in download_stream.chunks():
                yield chunk

        disposition = "attachment" if is_download else "inline"
        # If previewing, we want the browser to handle the type
        if not is_download:
            headers = {"Content-Disposition": f"{disposition}; filename={file_name}"}
        else:
            headers = {"Content-Disposition": f"{disposition}; filename={file_name}"}
            m_type = "application/octet-stream"

        return StreamingResponse(
            stream_blob(),
            media_type=m_type,
            headers=headers
        )
    except Exception as e:
        return {"error": str(e)}

app.include_router(auth_router, prefix="/auth")
app.include_router(forum_router, prefix="/forum")
app.include_router(wallet_router, prefix="/wallet")
app.include_router(summarizer_router, prefix="/ai")