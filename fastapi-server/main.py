from fastapi import FastAPI, Request
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
import subprocess
import json
from pathlib import Path

app = FastAPI(title="Adani Excel Server", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parent.parent
NEXT_BUILD_DIR = BASE_DIR / ".next"
NEXT_STATIC_DIR = NEXT_BUILD_DIR / "static"
NEXT_PUBLIC_DIR = BASE_DIR / "public"

if NEXT_STATIC_DIR.exists():
    app.mount("/_next/static", StaticFiles(directory=str(NEXT_STATIC_DIR)), name="next-static")

if NEXT_PUBLIC_DIR.exists():
    app.mount("/public", StaticFiles(directory=str(NEXT_PUBLIC_DIR)), name="public")

@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def api_handler(path: str, request: Request):
    import sys
    sys.path.insert(0, str(BASE_DIR))
    
    try:
        route_parts = path.split("/")
        module_path = ".".join(["app", "api"] + route_parts + ["route"])
        
        module = __import__(module_path, fromlist=[""])
        
        method_handlers = {
            "GET": getattr(module, "GET", None),
            "POST": getattr(module, "POST", None),
            "PUT": getattr(module, "PUT", None),
            "DELETE": getattr(module, "DELETE", None),
            "PATCH": getattr(module, "PATCH", None),
        }
        
        handler = method_handlers.get(request.method)
        if handler:
            result = await handler(request)
            return result
        else:
            return Response(content="Method Not Allowed", status_code=405)
    except Exception as e:
        return Response(content=f"Error: {str(e)}", status_code=500)

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/{path:path}")
async def serve_page(path: str = ""):
    if not path:
        path = "index"
    
    html_file = NEXT_BUILD_DIR / "server" / "pages" / f"{path}.html"
    if not html_file.exists():
        html_file = NEXT_BUILD_DIR / "server" / "pages" / "index.html"
    
    if html_file.exists():
        return FileResponse(str(html_file), media_type="text/html")
    
    return Response(content="Not Found", status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
