import os
import uuid
import datetime
from fastapi import UploadFile
from typing import List, Optional
from pypdf import PdfReader
from sqlalchemy import text

from app.personalization.registry import feature
from app.core.context import AppContext
from app.course_db.models import Material, MaterialChunk
from app.core.settings import get_settings

settings = get_settings()

def parse_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        content = []
        for page in reader.pages:
            content.append(page.extract_text())
        return "\n".join(content)
    except Exception as e:
        print(f"PDF Parsing error: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 1000) -> List[str]:
    # Very basic naive chunking by character length
    chunks = []
    for i in range(0, len(text), chunk_size):
        chunks.append(text[i:i+chunk_size])
    return chunks

@feature("ingest_source", roles=("educator",))
async def ingest_source(ctx: AppContext, payload: dict):
    # payload can have file bytes or URL
    # Assuming FastAPI routes upload the file to `data/uploads` and pass path
    file_path = payload.get("file_path")
    title = payload.get("title", "Untitled")
    class_id = payload.get("class_id")
    
    mat = Material(
        id=str(uuid.uuid4()),
        class_id=class_id,
        owner_id=ctx.user.id,
        type="pdf",
        title=title,
        subtitle="",
        caption="",
        status="processing",
        uploaded_at=datetime.datetime.utcnow(),
        authority=1.0,
        language="en"
    )
    ctx.course_db.add(mat)
    ctx.course_db.commit()
    
    # Process text
    if file_path and file_path.endswith('.pdf'):
        content = parse_pdf(file_path)
    else:
        # Fallback text
        content = "Sample text content."
        
    chunks = chunk_text(content)
    mat.chunks = len(chunks)
    
    # Insert chunks and FTS5
    for i, c_text in enumerate(chunks):
        chunk = MaterialChunk(
            id=str(uuid.uuid4()),
            material_id=mat.id,
            class_id=class_id,
            topic_ids=[],
            text=c_text,
            origin="educator"
        )
        ctx.course_db.add(chunk)
        # FTS5 insert
        ctx.course_db.execute(
            text("INSERT INTO material_chunks_fts(rowid, text) VALUES(:rowid, :text)"),
            {"rowid": chunk.id, "text": c_text}
        )
        
    mat.status = "ready"
    ctx.course_db.commit()
    return {"job_id": "dummy", "material_id": mat.id, "status": "ready"}
