# FastAPI Web QA Service

## Description
This FastAPI app accepts a URL and a user question, extracts the content from the webpage, and answers the question using a pre-trained transformer model.

## Setup Instructions

1. **Clone or unzip the project folder**

2. **Create and activate a virtual environment** (optional but recommended)
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the server**
```bash
uvicorn main:app --reload
```

5. **Test in Postman**
POST to: `http://127.0.0.1:8000/ask`
JSON Body:
```json
{
  "url": "https://www.geeksforgeeks.org/fastapi/",
  "question": "What is FastAPI?"
}
```

## Notes
- Uses `readability-lxml` to clean up webpage content.
- Model: `google/flan-t5-base` (can be swapped with `flan-t5-large` or others from HuggingFace)





# QA Backend API

## Setup

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Endpoints

### 1. Upload a Document

**POST** `/upload`  
**Form field:** `file` (upload `.pdf`, `.txt`, or `.docx`)

### 2. Ask a Question

**POST** `/question`  
**Body (JSON):**
```json
{
  "question": "What is the document about?"
}
```

## Notes

- Ensure the document is uploaded first.
- You can use Postman to test both endpoints.



# Image Generator Backend (FastAPI)

This is a lightweight backend to handle image generation using the [apiimagestrax](https://apiimagestrax.vercel.app/api/genimage) API.

## Features

- ✅ Prompt-based image generation
- ⚡ Caching for repeated prompts
- ⏱️ Timeout protection
- 📏 Resizes large images for frontend use (max 512x512)
- 🖼️ Base64-encoded PNG image response

## Run the server

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Then hit: `http://127.0.0.1:8000/generate-image`