from fastapi import FastAPI, UploadFile, File
import pandas as pd
from io import BytesIO
from ai_insights import generate_insights

app = FastAPI()

@app.post("/analyze-csv/")
async def analyze_csv(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(BytesIO(contents))
    insights = generate_insights(df)
    return {"insights": insights}
