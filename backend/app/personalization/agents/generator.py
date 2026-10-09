import json
import uuid
import datetime
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.core.context import AppContext
from app.course_db.models import Draft
from sqlalchemy import text

class QuizItem(BaseModel):
    kind: str
    type: str
    prompt: str
    options: List[str]
    answer: str
    explanation: str
    difficulty: int
    source_chunk_ids: List[str]

class QuizDraftPayload(BaseModel):
    items: List[QuizItem]

async def retrieve_chunks(ctx: AppContext, class_id: str, topic_ids: List[str], count: int = 5) -> str:
    if not topic_ids:
        return ""
    # Naive FTS5 retrieval, in real life we would search by keywords or topic
    # For now, just grab some chunks for these topics
    # Note: topic_ids is a JSON array in the DB, so exact match is tricky without JSON functions.
    # We will just fetch any chunks for the class as a stub.
    result = ctx.course_db.execute(
        text("SELECT text, id FROM material_chunks WHERE class_id = :class_id LIMIT :limit"),
        {"class_id": class_id, "limit": count}
    ).fetchall()
    
    context = ""
    for r in result:
        context += f"Chunk ID {r.id}:\n{r.text}\n\n"
    return context

async def generate_draft(ctx: AppContext, class_id: str, kind: str, spec: dict, created_by: str):
    draft_id = str(uuid.uuid4())
    draft = Draft(
        id=draft_id,
        class_id=class_id,
        kind=kind,
        status="generating",
        payload={},
        validation_warnings=[],
        source_chunk_ids=[],
        model_info={},
        review_notes="",
        created_by=created_by
    )
    ctx.course_db.add(draft)
    ctx.course_db.commit()
    
    # 1. Plan
    topics = spec.get("topic_ids", [])
    
    # 2. Retrieve
    context = await retrieve_chunks(ctx, class_id, topics)
    
    # 3. Generate
    system_prompt = f"You are an educator AI. Generate a {kind} based on the provided context."
    user_prompt = f"Context:\n{context}\n\nSpec:\n{json.dumps(spec)}\n\nOutput valid JSON only matching the requested schema."
    
    try:
        # Call LLM Router
        response = await ctx.llm_router.route(
            task=f"generate_{kind}",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            priority="background",
            stream=False
        )
        
        # 4. Validate (stub)
        if isinstance(response, str):
            payload = json.loads(response)
        else:
            payload = response
            
        draft.payload = payload
        draft.status = "ready"
        
    except Exception as e:
        draft.status = "rejected"
        draft.validation_warnings = [{"error": str(e)}]
        
    ctx.course_db.commit()
    return draft_id
