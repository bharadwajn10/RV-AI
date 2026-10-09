from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.dependencies import get_context
from app.core.context import AppContext
from app.core.envelope import success
import os
import shutil

router = APIRouter()

@router.get("/dashboard")
async def get_class_dashboard(class_id: str, ctx: AppContext = Depends(get_context)):
    from app.personalization.registry import call
    return success(await call("get_class_dashboard", ctx, {"class_id": class_id}))

@router.post("/materials")
async def upload_material(
    class_id: str = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    # Save the file to disk
    upload_dir = "data/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    payload = {
        "class_id": class_id,
        "title": title,
        "file_path": file_path
    }
    result = await call("ingest_source", ctx, payload)
    return success(result)

from fastapi import BackgroundTasks
from pydantic import BaseModel

class DraftReq(BaseModel):
    class_id: str
    kind: str
    spec: dict

@router.post("/drafts")
async def request_draft(
    req: DraftReq,
    background_tasks: BackgroundTasks,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    payload = req.model_dump()
    result = await call("request_draft", ctx, payload, background_tasks=background_tasks)
    return success(result)

@router.post("/drafts/{draft_id}/approve")
async def approve_draft(
    draft_id: str,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("approve_draft", ctx, {"draft_id": draft_id})
    return success(result)

class PublishPlanReq(BaseModel):
    class_id: str
    items: list

@router.post("/plans")
async def publish_plan(
    req: PublishPlanReq,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    payload = req.model_dump()
    result = await call("publish_plan", ctx, payload)
    return success(result)

class SuggestPathReq(BaseModel):
    class_id: str

@router.post("/paths/suggest")
async def suggest_paths(
    req: SuggestPathReq,
    background_tasks: BackgroundTasks,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("suggest_learning_paths", ctx, req.model_dump(), background_tasks=background_tasks)
    return success(result)

class ChangePathReq(BaseModel):
    class_id: str
    text: str

@router.post("/paths/change")
async def change_path(
    req: ChangePathReq,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("parse_educator_intent", ctx, req.model_dump())
    return success(result)

@router.get("/classes/{class_id}/conflicts")
async def get_conflicts(
    class_id: str,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("list_conflicts", ctx, {"class_id": class_id})
    return success(result)

@router.post("/conflicts/{conflict_id}/override")
async def override_conflict(
    conflict_id: str,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("override_conflict", ctx, {"conflict_id": conflict_id})
    return success(result)
@router.get("/classes/{class_id}/next-actions")
async def get_next_actions(
    class_id: str,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("get_next_actions", ctx, {"class_id": class_id})
    return success(result)

@router.patch("/next-actions/{action_id}")
async def update_next_action(
    action_id: str,
    payload: dict,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("update_next_action", ctx, {"action_id": action_id, **payload})
    return success(result)

@router.get("/classes/{class_id}/interventions")
async def get_interventions(
    class_id: str,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("get_interventions", ctx, {"class_id": class_id})
    return success(result)

@router.get("/classes/{class_id}/interventions/impact")
async def get_intervention_impact(
    class_id: str,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("get_intervention_impact", ctx, {"class_id": class_id})
    return success(result)

@router.post("/classes/{class_id}/interventions")
async def create_intervention(
    class_id: str,
    payload: dict,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("create_intervention", ctx, {"class_id": class_id, **payload})
    return success(result)

@router.get("/classes/{class_id}/knowledge-graph")
async def get_knowledge_graph(
    class_id: str,
    learner_id: str = None,
    ctx: AppContext = Depends(get_context)
):
    from app.personalization.registry import call
    result = await call("get_knowledge_graph", ctx, {"class_id": class_id, "learner_id": learner_id})
    return success(result)
