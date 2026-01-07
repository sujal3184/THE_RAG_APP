from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.base import init_db
from app.api import auth, documents, chat
from app.config import settings

app = FastAPI(
    title="RAG API with Authentication",
    version="3.0.0",
    description="Secure RAG API with user authentication and PostgreSQL storage"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()

@app.get("/")
async def root():
    return {
        "message": "RAG API v3.0 with Authentication",
        "status": "healthy",
        "features": [
            "User Authentication (JWT)",
            "Document Upload (PDF/URL)",
            "Vector Search (PostgreSQL + pgvector)",
            "Chat History",
            "Multi-user Support"
        ],
        "endpoints": {
            "auth": "/api/auth/signup, /api/auth/login, /api/auth/me",
            "documents": "/api/documents/upload-pdf, /api/documents/upload-url",
            "chat": "/api/chat/query, /api/chat/sessions, /api/chat/history/{session_id}"
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "database": "PostgreSQL with pgvector",
        "embeddings": settings.EMBEDDING_MODEL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)