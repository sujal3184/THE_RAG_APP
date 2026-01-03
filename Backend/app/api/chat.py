from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.database.base import get_db
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.utils.dependencies import get_current_user
from app.services.vector_service import vector_service
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class QueryRequest(BaseModel):
    question: str
    session_id: Optional[int] = None
    groq_api_key: str

class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: str

@router.post("/query")
async def query_documents(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Query documents with chat history"""
    
    # Get or create session
    if request.session_id:
        session = db.query(ChatSession).filter(
            ChatSession.id == request.session_id,
            ChatSession.user_id == current_user.id
        ).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    else:
        session = ChatSession(user_id=current_user.id)
        db.add(session)
        db.flush()
    
    # Search for relevant chunks
    relevant_chunks = vector_service.similarity_search(
        db, 
        current_user.id, 
        request.question, 
        k=4
    )
    
    if not relevant_chunks:
        raise HTTPException(
            status_code=400, 
            detail="No documents found. Please upload documents first."
        )
    
    # Build context from chunks
    context = "\n\n".join([
        f"Source: {chunk.metadata.get('filename', 'Unknown')}\n{chunk.content}"
        for chunk in relevant_chunks
    ])
    
    # Get chat history
    history_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session.id
    ).order_by(ChatMessage.created_at).all()
    
    chat_history = []
    for msg in history_messages:
        if msg.role == "user":
            chat_history.append(HumanMessage(content=msg.content))
        else:
            chat_history.append(AIMessage(content=msg.content))
    
    # Create LLM
    llm = ChatGroq(
        groq_api_key=request.groq_api_key,
        model_name="llama-3.3-70b-versatile"
    )
    
    # Create prompt
    system_prompt = """You are a helpful assistant answering questions based on the provided context.
Use the context below to answer the question. If you don't know the answer, say so.
Keep your answer concise and relevant.

Context:
{context}"""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{question}")
    ])
    
    chain = prompt | llm
    
    # Get response
    response = chain.invoke({
        "context": context,
        "chat_history": chat_history,
        "question": request.question
    })
    
    answer = response.content
    
    # Save messages
    user_message = ChatMessage(
        session_id=session.id,
        role="user",
        content=request.question
    )
    db.add(user_message)
    
    assistant_message = ChatMessage(
        session_id=session.id,
        role="assistant",
        content=answer
    )
    db.add(assistant_message)
    
    db.commit()
    
    # Extract citations
    citations = [
        {
            "source": chunk.metadata.get("filename", "Unknown"),
            "page": chunk.metadata.get("page"),
            "content": chunk.content[:200] + "..."
        }
        for chunk in relevant_chunks
    ]
    
    return {
        "answer": answer,
        "session_id": session.id,
        "citations": citations
    }

@router.get("/sessions")
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions"""
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).all()
    
    return {
        "sessions": [
            {
                "id": s.id,
                "title": s.title,
                "created_at": s.created_at.isoformat(),
                "message_count": len(s.messages)
            }
            for s in sessions
        ]
    }

@router.get("/history/{session_id}")
async def get_chat_history(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for a session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).all()
    
    return {
        "session_id": session_id,
        "messages": [
            {
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"status": "success", "message": "Session deleted"}