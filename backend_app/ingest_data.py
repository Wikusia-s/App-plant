import os
import json
import psycopg2
import numpy as np
from pathlib import Path
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

print(f"Loading .env from: {env_path}")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")

# Load the SentenceTransformer model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

def get_db_connection():
    """Get a PostgreSQL database connection."""
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )

def store_chunk_in_db(plant_name: str, article_title: str, article_url: str, chunk_text: str):
    """Store a chunk with its embedding as vector type."""
    embedding = embedding_model.encode([chunk_text], convert_to_numpy=True)[0]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO plant_documents (plant_name, article_title, article_url, chunk_text, embedding)
        VALUES (%s, %s, %s, %s, %s::vector)
    """, (plant_name, article_title, article_url, chunk_text, embedding.tolist()))
    conn.commit()
    cursor.close()
    conn.close()

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def load_and_store_articles():
    """Load articles from JSON file and store them in database with embeddings."""
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'plant_articles.json')
    
    with open(json_path, 'r', encoding='utf-8') as f:
        articles = json.load(f)
    
    for article in articles:
        plant_name = article.get('plant_name', '')
        article_title = article.get('article_title', '')
        article_url = article.get('link', '') or article.get('article_url', '')
        content = article.get('content', '')
        
        # Chunk the content
        chunks = chunk_text(content)
        
        # Store each chunk with its embedding
        for chunk in chunks:
            if chunk.strip():  # Only store non-empty chunks
                store_chunk_in_db(plant_name, article_title, article_url, chunk)
                print(f"Stored chunk for {plant_name}")

if __name__ == "__main__":
    load_and_store_articles()
    print("✓ All articles loaded and stored successfully")
