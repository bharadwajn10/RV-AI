from typing import Callable, Any, Tuple, Dict, Set

REGISTRY: Dict[str, Tuple[Callable, Set[str]]] = {}

class Forbidden(Exception):
    pass

def feature(name: str, roles=("educator", "learner")):
    def wrap(fn: Callable):
        REGISTRY[name] = (fn, set(roles))
        return fn
    return wrap

async def call(name: str, ctx: Any, payload: Any = None, **kwargs):
    if name not in REGISTRY:
        raise ValueError(f"Feature '{name}' not found in registry.")
    
    fn, roles = REGISTRY[name]
    if getattr(ctx.user, "role", None) not in roles:
        raise Forbidden()
    
    if payload is not None:
        return await fn(ctx, payload, **kwargs)
    return await fn(ctx, **kwargs)
