import asyncio
import json
import httpx
import os
import sys
from dotenv import load_dotenv

# Add backend directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

async def smoke_agnes():
    api_key = os.getenv("AGNES_API_KEY", "test")
    base_url = os.getenv("AGNES_BASE_URL", "https://apihub.agnes-ai.com/v1")
    model = os.getenv("AGNES_TEXT_MODEL", "agnes-3.0-flash")
    
    print(f"Testing Agnes API at {base_url} with model {model}...")
    try:
        async with httpx.AsyncClient() as client:
            # Test streaming
            print("\n1. Testing Streaming...")
            req = {
                "model": model,
                "messages": [{"role": "user", "content": "Say 'hello world' and stream it."}],
                "stream": True
            }
            async with client.stream("POST", f"{base_url}/chat/completions", json=req, headers={"Authorization": f"Bearer {api_key}"}) as response:
                if response.status_code != 200:
                    print(f"Failed: {response.status_code}")
                else:
                    async for chunk in response.aiter_text():
                        print(chunk, end="")
            
            print("\n\n2. Testing JSON mode...")
            req = {
                "model": model,
                "messages": [{"role": "user", "content": "Return a JSON object with a key 'test' and value 'hello'."}],
                "response_format": {"type": "json_object"}
            }
            response = await client.post(f"{base_url}/chat/completions", json=req, headers={"Authorization": f"Bearer {api_key}"})
            if response.status_code != 200:
                print(f"Failed: {response.status_code}")
                print(response.text)
            else:
                data = response.json()
                print(json.dumps(data, indent=2))
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(smoke_agnes())
