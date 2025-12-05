import os
import psycopg2
import numpy as np
from pathlib import Path
from typing import List, Dict
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Load the embedding model
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

def retrieve_relevant_chunks(query: str, top_k: int = 5) -> List[Dict]:
    """Retrieve top-k most relevant chunks using pgvector cosine similarity."""
    query_embedding = embedding_model.encode([query], convert_to_numpy=True)[0]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Use pgvector for efficient top-k retrieval with cosine similarity
    cursor.execute("""
        SELECT plant_name, article_title, article_url, chunk_text,
               1 - (embedding <#> %s::vector) AS similarity
        FROM plant_documents
        WHERE embedding IS NOT NULL
        ORDER BY embedding <#> %s::vector
        LIMIT %s
    """, (query_embedding.tolist(), query_embedding.tolist(), top_k))
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    chunks = []
    for row in results:
        chunks.append({
            'plant_name': row[0],
            'article_title': row[1],
            'article_url': row[2],
            'chunk_text': row[3],
            'similarity': float(row[4])
        })
    
    return chunks