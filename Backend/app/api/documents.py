from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
import tempfile
import os
from app.database.base import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.services.document_service import document_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])

class URLUpload(BaseModel):
    urls: List[str]

class DocumentResponse(BaseModel):
    id: int
    filename: str
    source_type: str
    uploaded_at: str
    chunk_count: int
    
    class Config:
        from_attributes = True

@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and process PDF file"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        document = document_service.process_pdf(
            db, 
            current_user.id, 
            tmp_path, 
            file.filename
        )
        
        return {
            "status": "success",
            "document_id": document.id,
            "filename": document.filename,
            "chunks": len(document.chunks)
        }
    finally:
        os.unlink(tmp_path)

@router.post("/upload-urls")
async def upload_urls(
    data: URLUpload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process URLs"""
    results = []
    
    for url in data.urls:
        try:
            document = document_service.process_url(db, current_user.id, url)
            results.append({
                "url": url,
                "status": "success",
                "document_id": document.id,
                "chunks": len(document.chunks)
            })
        except Exception as e:
            results.append({
                "url": url,
                "status": "error",
                "error": str(e)
            })
    
    return {"results": results}

@router.get("/list")
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all user's documents"""
    documents = document_service.get_user_documents(db, current_user.id)
    
    return {
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "source_type": doc.source_type,
                "uploaded_at": doc.uploaded_at.isoformat(),
                "chunk_count": len(doc.chunks)
            }
            for doc in documents
        ]
    }

@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document"""
    success = document_service.delete_document(db, document_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"status": "success", "message": "Document deleted"}