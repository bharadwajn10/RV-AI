import asyncio
from typing import Any
import time

class AgnesLimiter:
    def __init__(self, rpm: int, interactive_reserve: int):
        self.rpm = rpm
        self.interactive_reserve = interactive_reserve
        self.tokens = rpm
        self.last_refill = time.time()
        self.lock = asyncio.Lock()
        
    async def acquire(self, priority: str = "background"):
        while True:
            async with self.lock:
                now = time.time()
                elapsed = now - self.last_refill
                # refill
                added = elapsed * (self.rpm / 60.0)
                if added > 0:
                    self.tokens = min(self.rpm, self.tokens + added)
                    self.last_refill = now
                
                # Check reserve
                required_tokens = 1
                can_acquire = False
                
                if priority == "interactive":
                    if self.tokens >= 1:
                        can_acquire = True
                else:
                    if self.tokens > self.interactive_reserve:
                        can_acquire = True
                
                if can_acquire:
                    self.tokens -= 1
                    return True
            
            # If not acquired, wait a bit
            await asyncio.sleep(0.5)

global_limiter = None

def get_limiter():
    global global_limiter
    if global_limiter is None:
        from app.core.settings import get_settings
        settings = get_settings()
        global_limiter = AgnesLimiter(settings.AGNES_RPM, settings.AGNES_INTERACTIVE_RESERVE)
    return global_limiter
