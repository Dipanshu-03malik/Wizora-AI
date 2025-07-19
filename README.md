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