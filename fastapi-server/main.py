from fastapi import FastAPI, Request
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
import subprocess
import json
from pathlib import Path
import sys
import httpx

# Add the parent directory to the Python path so we can import the Next.js API routes
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

app = FastAPI(title="Adani Excel Server", version="1.0.0")

NEXT_BUILD_DIR = BASE_DIR / ".next"
NEXT_STATIC_DIR = NEXT_BUILD_DIR / "static"
NEXT_PUBLIC_DIR = BASE_DIR / "public"

# Mount static files for Next.js assets
if NEXT_BUILD_DIR.exists():
    # Serve Next.js build assets
    app.mount("/_next", StaticFiles(directory=str(NEXT_BUILD_DIR), follow_symlink=True), name="next-assets")

if NEXT_STATIC_DIR.exists():
    # Serve static files from .next/static
    app.mount("/_next/static", StaticFiles(directory=str(NEXT_STATIC_DIR)), name="next-static")

if NEXT_PUBLIC_DIR.exists():
    # Serve public directory assets
    app.mount("/public", StaticFiles(directory=str(NEXT_PUBLIC_DIR)), name="public")

# Create an HTTP client for proxying requests with proper handling of compressed content
http_client = httpx.AsyncClient(
    base_url="http://localhost:3000",
    headers={"Accept-Encoding": "identity"}  # Disable compression to avoid encoding issues
)

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def api_handler(path: str, request: Request):
    try:
        # Proxy the request to the Next.js development server
        url = f"/api/{path}"
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # Remove headers that might cause issues
        headers.pop("host", None)
        headers.pop("content-length", None)
        
        # Explicitly set encoding to identity to avoid compression issues
        headers["Accept-Encoding"] = "identity"
        
        response = await http_client.request(
            method=method,
            url=url,
            headers=headers,
            content=body
        )
        
        # Handle the response properly
        response_headers = dict(response.headers)
        # Remove encoding headers that might cause issues
        response_headers.pop("content-encoding", None)
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers
        )
    except Exception as e:
        return Response(content=f"Error proxying request: {str(e)}", status_code=500)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Handle static asset requests that should be served directly
@app.get("/_next/{path:path}")
async def serve_next_assets(path: str):
    # This will be handled by the mounted static files
    pass

@app.get("/public/{path:path}")
async def serve_public_assets(path: str):
    # This will be handled by the mounted static files
    pass

# Catch-all route for all other paths - proxy to Next.js dev server
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def serve_page(path: str, request: Request):
    # Don't proxy API routes or static assets through this handler
    if path.startswith("api/") or path.startswith("_next/") or path.startswith("public/"):
        # These should be handled by static file serving or API routes
        return Response(content="Not Found", status_code=404)
    
    try:
        # Proxy all non-API requests to the Next.js development server
        url = f"/{path}" if path else "/"
        method = request.method
        headers = dict(request.headers)
        body = await request.body()
        
        # Remove headers that might cause issues
        headers.pop("host", None)
        headers.pop("content-length", None)
        
        # Explicitly set encoding to identity to avoid compression issues
        headers["Accept-Encoding"] = "identity"
        
        response = await http_client.request(
            method=method,
            url=url,
            headers=headers,
            content=body
        )
        
        # Handle the response properly
        response_headers = dict(response.headers)
        # Remove encoding headers that might cause issues
        response_headers.pop("content-encoding", None)
        
        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers
        )
    except Exception as e:
        return Response(content=f"Error proxying request: {str(e)}", status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)