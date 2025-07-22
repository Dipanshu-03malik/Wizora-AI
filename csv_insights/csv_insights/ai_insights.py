import pandas as pd
from transformers import pipeline

summarizer = pipeline("text2text-generation", model="google/flan-t5-large")

def generate_insights(df: pd.DataFrame, chunk_size: int = 20) -> str:
    summaries = []
    num_chunks = (len(df) + chunk_size - 1) // chunk_size  # ceiling division

    for i in range(0, len(df), chunk_size):
        chunk = df.iloc[i:i+chunk_size]
        chunk_text = chunk.to_string(index=False)
        prompt = (
            "You are a skilled data analyst  "
            "Examine the following dataset chunk to find meaningful insights, draw conclusions, "
            "and suggest data-driven decisions. Focus on trends, patterns, and possible predictions:\n\n"
            f"{chunk_text}\n\nProvide a concise insight summary."
        )
        summary = summarizer(prompt, max_length=150, do_sample=True)[0]["generated_text"]
        summaries.append(summary)

    # Combine all individual summaries into one final insight
    final_prompt = (
        "You are a data analyst. Based on the following summaries from multiple parts of a dataset, "
        "generate a final overall insight:\n\n" +
        "\n\n".join(summaries) +
        "\n\nProvide a comprehensive final summary."
    )
    final_summary = summarizer(final_prompt, max_length=200, do_sample=True)[0]["generated_text"]
    return final_summary
