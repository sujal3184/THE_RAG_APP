from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from app.database.base import Base
from app.config import settings


class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    source_type = Column(String)  # 'pdf' or 'url'
    source_url = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # 🔴 FIX HERE
    meta_data = Column("metadata", JSON, default=dict)

    # Relationships
    owner = relationship("User", back_populates="documents")
    chunks = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan"
    )


class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(settings.EMBEDDING_DIMENSION))

    # 🔴 FIX HERE
    meta_data = Column("metadata", JSON, default=dict)

    # Relationships
    document = relationship("Document", back_populates="chunks")
