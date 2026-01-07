from typing import List
from sqlalchemy.orm import Session
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, WebBaseLoader
from app.models.document import Document, DocumentChunk
from app.services.vector_service import vector_service
import tempfile
import os

class DocumentService:
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
    
    def process_pdf(
        self, 
        db: Session, 
        user_id: int, 
        file_path: str, 
        filename: str
    ) -> Document:
        """Process PDF file and store in database"""
        # Load PDF
        loader = PyPDFLoader(file_path)
        pages = loader.load()
        
        # Create document record
        document = Document(
            user_id=user_id,
            filename=filename,
            source_type="pdf",
            metadata={"page_count": len(pages)}
        )
        db.add(document)
        db.flush()
        
        # Split into chunks
        chunks_data = self.text_splitter.split_documents(pages)
        
        # Generate embeddings
        chunk_texts = [chunk.page_content for chunk in chunks_data]
        embeddings = vector_service.generate_embeddings(chunk_texts)
        
        # Store chunks
        for idx, (chunk_data, embedding) in enumerate(zip(chunks_data, embeddings)):
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                content=chunk_data.page_content,
                embedding=embedding,
                metadata={
                    "page": chunk_data.metadata.get("page", None)
                }
            )
            db.add(chunk)
        
        db.commit()
        db.refresh(document)
        
        return document
    
    def process_url(
        self,
        db: Session,
        user_id: int,
        url: str
    ) -> Document:
        """Process URL and store in database"""
        # Load URL content
        loader = WebBaseLoader(url)
        pages = loader.load()
        
        if not pages or not pages[0].page_content.strip():
            raise ValueError("No content extracted from URL")
        
        # Create document record
        document = Document(
            user_id=user_id,
            filename=url.split("/")[-1] or "webpage",
            source_type="url",
            source_url=url,
            metadata={}
        )
        db.add(document)
        db.flush()
        
        # Split into chunks
        chunks_data = self.text_splitter.split_documents(pages)
        
        # Generate embeddings
        chunk_texts = [chunk.page_content for chunk in chunks_data]
        embeddings = vector_service.generate_embeddings(chunk_texts)
        
        # Store chunks
        for idx, (chunk_data, embedding) in enumerate(zip(chunks_data, embeddings)):
            chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=idx,
                content=chunk_data.page_content,
                embedding=embedding,
                metadata={}
            )
            db.add(chunk)
        
        db.commit()
        db.refresh(document)
        
        return document
    
    def get_user_documents(self, db: Session, user_id: int) -> List[Document]:
        """Get all documents for a user"""
        return db.query(Document).filter(Document.user_id == user_id).all()
    
    def delete_document(self, db: Session, document_id: int, user_id: int) -> bool:
        """Delete a document and its chunks"""
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
        
        if not document:
            return False
        
        db.delete(document)
        db.commit()
        return True

document_service = DocumentService()