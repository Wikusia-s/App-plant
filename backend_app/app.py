# app.py
import os
import json
import numpy as np
from pathlib import Path
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
from langchain_text_splitters import CharacterTextSplitter
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import psycopg2
from psycopg2.extras import Json
from rag_service import retrieve_relevant_chunks

# ------------------ Setup & load once at startup ------------------
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

print(f"DB Config: host={os.getenv('DB_HOST')}, port={os.getenv('DB_PORT')}, db={os.getenv('DB_NAME')}")

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Database connection
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5433")),
        database=os.getenv("DB_NAME", "plant_app_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD")
    )

embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ------------------ FastAPI models ------------------
class Turn(BaseModel):
    user: str
    assistant: str

class ChatRequest(BaseModel):
    message: str = Field(..., description="User question")
    k: int = 5
    history: List[Turn] = Field(default_factory=list)

class Source(BaseModel):
    plant_name: str
    title: str
    url: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]

# ------------------ FastAPI app ------------------
app = FastAPI(title="RAG Plant Chatbot API", version="1.0.0")

# CORS for local dev; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/initialize")
def initialize_embeddings():
    """Initialize embeddings from JSON and store in PostgreSQL using ingest_data.py"""
    try:
        # Don't import and call initDb.js from here - it should already be initialized
        # Just load the plant data
        from ingest_data import load_and_store_articles
        
        # Clear existing embeddings
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM plant_documents")
        conn.commit()
        cursor.close()
        conn.close()
        
        # Load and store new articles
        load_and_store_articles()
        
        return {"status": "success", "message": "Articles loaded successfully"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def build_prompt(query: str, context_chunks: List[dict], chat_history: List[dict]):
    context = "\n\n".join(
        f"Title: {c['title']}\nURL: {c['url']}\nText: {c['text']}"
        for c in context_chunks
    )
    history_str = "\n".join(f"User: {h['user']}\nAssistant: {h['assistant']}" for h in chat_history)
    prompt = f"""You are a helpful plant care assistant.
Use ONLY the context below to answer the question. If the answer is not in the context, reply exactly: "I don't know".
When you see US units (inches, feet, Fahrenheit, etc.), convert them to European metric units in your answer.
If the plant was not mentioned in the question, use the plant stated in the previous questions - in the chat history.
If you need any clarification, ask the user for more details.
Chat history so far:
{history_str}

Context:
{context}

Question: {query}
Answer:"""
    return prompt

@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    # Use pgvector-based retrieval from rag_service
    chunks = retrieve_relevant_chunks(req.message, top_k=req.k)
    
    # Convert to format expected by build_prompt
    formatted_chunks = [
        {
            "plant_name": c["plant_name"],
            "title": c["article_title"],
            "url": c["article_url"],
            "text": c["chunk_text"]
        }
        for c in chunks
    ]
    
    prompt = build_prompt(
        query=req.message,
        context_chunks=formatted_chunks,
        chat_history=[{"user": t.user, "assistant": t.assistant} for t in req.history]
    )
    response = gemini_model.generate_content(prompt)
    answer = response.text or "I don't know"

    # Unique sources from returned chunks
    seen = set()
    sources = []
    for c in formatted_chunks:
        key = (c["title"], c["url"])
        if key not in seen:
            seen.add(key)
            sources.append(Source(plant_name=c["plant_name"], title=c["title"], url=c["url"]))

    return ChatResponse(answer=answer, sources=sources)
