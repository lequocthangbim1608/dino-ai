import sys
import os
from pathlib import Path

# Đảm bảo đường dẫn nạp module luôn chính xác
BASE_DIR = Path(__file__).resolve().parent
site_packages = BASE_DIR / "venv" / "Lib" / "site-packages"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))
if site_packages.exists() and str(site_packages) not in sys.path:
    sys.path.insert(0, str(site_packages))

if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import uvicorn
from config import HOST, PORT
from database.db_manager import init_db
from web.web_routes import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi tạo database và dữ liệu mặc định
    print("[DINO AI] Dang khoi tao co so du lieu...")
    await init_db()
    print("[DINO AI] Khoi tao hoan tat. He thong san sang phuc vu Bo Thang va Me Chi!")
    yield

app = FastAPI(title="DINO AI Assistant", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các API Routes
app.include_router(api_router)

# Mount thư mục tĩnh Web Companion
static_dir = Path(__file__).resolve().parent / "web" / "static"
if not static_dir.exists():
    static_dir.mkdir(parents=True, exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/")
async def root():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "DINO AI Server is Running. Static files not yet generated."}

@app.get("/math")
async def math_view():
    math_file = static_dir / "math.html"
    if math_file.exists():
        return FileResponse(math_file)
    return {"message": "Dino Math module page not found."}


if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
