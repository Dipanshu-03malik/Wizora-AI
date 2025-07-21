from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from tempfile import NamedTemporaryFile
import docx
import fitz  # PyMuPDF
import torch
import os
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

app = FastAPI()

# Load FLAN-T5-Base model and tokenizer for generative QA
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

chunks = []

def extract_text(file_path: str, content_type: str) -> str:
    if content_type == "application/pdf":
        text = ""
        with fitz.open(file_path) as doc:
            for page in doc:
                text += page.get_text()
        return text
    elif content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    elif content_type.startswith("text"):
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def split_text(text, chunk_size=500):
    words = text.split()
    return [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]

def get_most_relevant_chunk(question):
    if not chunks:
        return ""
    vectorizer = TfidfVectorizer().fit(chunks + [question])
    vectors = vectorizer.transform(chunks + [question])
    similarities = (vectors[-1] @ vectors[:-1].T).toarray().flatten()
    best_chunk_index = int(np.argmax(similarities))
    return chunks[best_chunk_index]

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[-1]
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    text = extract_text(tmp_path, file.content_type)
    os.remove(tmp_path)

    global chunks
    chunks = split_text(text)
    return {"message": "File uploaded and text chunked successfully."}

class QuestionRequest(BaseModel):
    question: str

@app.post("/question")
async def ask_question(data: QuestionRequest):
    context = get_most_relevant_chunk(data.question)
    if not context:
        return {"error": "No relevant context found."}

    prompt = f"Answer the question based on the context below.\n\nContext: {context}\n\nQuestion: {data.question}\nAnswer:"
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    output = model.generate(**inputs, max_new_tokens=100)
    answer = tokenizer.decode(output[0], skip_special_tokens=True)

    return {"answer": answer}
