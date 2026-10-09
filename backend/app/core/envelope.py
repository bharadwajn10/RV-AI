from typing import Any, Optional

def success(data: Any, meta: dict = None):
    return {
        "data": data,
        "meta": meta or {},
        "error": None
    }

def error(code: str, message: str):
    return {
        "data": None,
        "meta": {},
        "error": {
            "code": code,
            "message": message
        }
    }
