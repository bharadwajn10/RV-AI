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

