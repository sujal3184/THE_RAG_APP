from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from sentence_transformers import SentenceTransformer
from app.models.document import Document, DocumentChunk
from app.config import settings

class VectorService:
    def __init__(self):
        self.model = None
    
    def get_embedding_model(self):
        """Lazy load embedding model"""
        if self.model is None:
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self.model
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        model = self.get_embedding_model()
        embeddings = model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()
    
    def similarity_search(
        self, 
        db: Session, 
        user_id: int, 
        query_text: str, 
        k: int = 4
    ) -> List[DocumentChunk]:
        """Search for similar document chunks using cosine similarity"""
        # Generate query embedding
        query_embedding = self.generate_embeddings([query_text])[0]
        
        # Perform similarity search using pgvector
        query = text("""
            SELECT dc.*, d.filename, d.source_type
            FROM document_chunks dc
            JOIN documents d ON dc.document_id = d.id
            WHERE d.user_id = :user_id
            ORDER BY dc.embedding <=> :query_embedding
            LIMIT :k
        """)
        
        result = db.execute(
            query,
            {
                "user_id": user_id,
                "query_embedding": str(query_embedding),
                "k": k
            }
        )
        
        chunks = []
        for row in result:
            chunk = DocumentChunk(
                id=row.id,
                document_id=row.document_id,
                chunk_index=row.chunk_index,
                content=row.content,
                metadata={
                    "filename": row.filename,
                    "source_type": row.source_type,
                    **row.metadata
                }
            )
            chunks.append(chunk)
        
        return chunks

# Global instance
vector_service = VectorService()