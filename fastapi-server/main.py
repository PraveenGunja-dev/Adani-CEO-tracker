from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, Response
import httpx
import os

# Create FastAPI app
app = FastAPI(title="Adani Excel Server", version="1.0.0")

# Proxy requests to Next.js server
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_to_nextjs(path: str, request: Request):
    # Proxy to Next.js server running on localhost:3000
    async with httpx.AsyncClient() as client:
        # Forward the request to Next.js server
        nextjs_url = f"http://localhost:3000/{path}"
        
        # Get request details
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # Make request to Next.js server
        response = await client.request(
            method=method,
            url=nextjs_url,
            headers=headers,
            content=body
        )
        
        # Return the response from Next.js server
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=dict(response.headers)
        )

# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)