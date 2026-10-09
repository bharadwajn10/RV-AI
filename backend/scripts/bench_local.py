import asyncio
import time
import httpx
import os
import sys

async def bench_local():
    url = os.getenv("LOCAL_URL", "http://127.0.0.1:8081/v1")
    model = os.getenv("LOCAL_MODEL", "qwen3.5-4b")
    
    print(f"Benchmarking local model at {url} with model {model}...")
    req = {
        "model": model,
        "messages": [{"role": "user", "content": "Write a 5 sentence story about a brave toaster."}],
        "stream": True
    }
    
    try:
        start_time = time.time()
        first_token_time = None
        token_count = 0
        
        async with httpx.AsyncClient() as client:
            async with client.stream("POST", f"{url}/chat/completions", json=req) as response:
                if response.status_code != 200:
                    print(f"Failed: {response.status_code}")
                    return
                
                async for chunk in response.aiter_text():
                    if not first_token_time:
                        first_token_time = time.time()
                    print(chunk, end="", flush=True)
                    token_count += 1 # roughly
                    
        end_time = time.time()
        print("\n\n--- Benchmark Results ---")
        if first_token_time:
            print(f"Time to first token: {first_token_time - start_time:.2f}s")
            print(f"Total time: {end_time - start_time:.2f}s")
            # This token count is very rough, just chunks
            print(f"Rough chunks/sec: {token_count / (end_time - first_token_time):.2f}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(bench_local())
