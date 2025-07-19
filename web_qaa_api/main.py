from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from readability import Document
import torch

class QARequest(BaseModel):
    url: str
    question: str

app = FastAPI()

# Load summarization model (bart-large-cnn) and QA model (flan-t5-small)
sum_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")
sum_model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-large-cnn")

qa_tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-small")
qa_model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-small")

def summarize_text(text: str, max_new_tokens: int = 200) -> str:
    inputs = sum_tokenizer(text, return_tensors="pt", truncation=True, max_length=1024)
    summary_ids = sum_model.generate(inputs["input_ids"], max_new_tokens=max_new_tokens)
    return sum_tokenizer.decode(summary_ids[0], skip_special_tokens=True)

def generate_answer(prompt: str, max_new_tokens: int = 150) -> str:
    inputs = qa_tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    output = qa_model.generate(**inputs, max_new_tokens=max_new_tokens)
    return qa_tokenizer.decode(output[0], skip_special_tokens=True)

@app.post("/ask")
def ask_question(request: QARequest):
    try:
        response = requests.get(request.url, timeout=10)
        doc = Document(response.text)
        html = doc.summary()
        soup = BeautifulSoup(html, "html.parser")
        raw_text = soup.get_text(separator=" ", strip=True)

        # Step 1: Summarize webpage using bart-large-cnn
        summarized_text = summarize_text(raw_text[:2000], max_new_tokens=200)

        # Step 2: Answer the question based on summary
        prompt = f"""
        Based on the following summarized content, answer the question clearly and concisely.

        Summary:
        {summarized_text}

        Question: {request.question}
        Answer:
        """.strip()

        answer = generate_answer(prompt, max_new_tokens=150)
        return {"answer": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
