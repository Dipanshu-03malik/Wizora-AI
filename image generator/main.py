# main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import httpx
import uuid
import os
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve /images path as static files
if not os.path.exists("images"):
    os.makedirs("images")

app.mount("/images", StaticFiles(directory="images"), name="images")

IMAGE_API_URL = "https://apiimagestrax.vercel.app/api/genimage"

@app.post("/generate-image")
async def generate_image(request: Request):
    try:
        data = await request.json()
        prompt = data.get("prompt", "")
        if not prompt:
            return JSONResponse(status_code=400, content={"error": "Prompt is required"})

        start_time = time.time()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                IMAGE_API_URL,
                json={"prompt": prompt},
                timeout=60
            )

        duration = time.time() - start_time
        print(f"⏱️ External API response time: {duration:.2f} seconds")

        if response.status_code != 200:
            return JSONResponse(
                status_code=502,
                content={"error": f"❌ Failed to generate image: {response.status_code}"}
            )

        # Save the image to /images folder
        file_id = str(uuid.uuid4())
        filename = f"images/{file_id}.png"
        with open(filename, "wb") as f:
            f.write(response.content)

        # Return public URL to frontend
        image_url = f"http://127.0.0.1:8000/images/{file_id}.png"
        return {"image_url": image_url}

    except Exception as e:
        print("❌ Exception:", str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})
