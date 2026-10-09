from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel

DataT = TypeVar("DataT")

class ErrorDetail(BaseModel):
    code: str
    message: str

class ResponseEnvelope(BaseModel, Generic[DataT]):
    data: Optional[DataT] = None
    meta: dict[str, Any] = {}
    error: Optional[ErrorDetail] = None

class JobResponse(BaseModel):
    job_id: str
