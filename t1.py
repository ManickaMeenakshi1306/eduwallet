from azure.storage.blob import BlobServiceClient
import uuid

# 🔥 paste your connection string here directly for test
AZURE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=eduwallet12;AccountKey=...;EndpointSuffix=core.windows.net"
CONTAINER_NAME = "eduwallet"

def upload_test_file():
    try:
        print(">>> Connecting to Azure...")

        blob_service_client = BlobServiceClient.from_connection_string(
            AZURE_CONNECTION_STRING
        )

        container_client = blob_service_client.get_container_client(CONTAINER_NAME)

        content = b"Hello from EduWallet"
        blob_name = f"test_{uuid.uuid4()}.txt"

        print(">>> Uploading blob:", blob_name)

        blob_client = container_client.get_blob_client(blob_name)
        blob_client.upload_blob(content, overwrite=True)

        print(">>> UPLOAD SUCCESS ✅")

        print("\n>>> Listing blobs:")
        for blob in container_client.list_blobs():
            print(" -", blob.name)

    except Exception as e:
        print(">>> ERROR ❌:", e)


if __name__ == "__main__":
    upload_test_file()