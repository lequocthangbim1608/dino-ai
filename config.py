import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# Server Config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# AI Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Zalo OA Config
ZALO_APP_ID = os.getenv("ZALO_APP_ID", "")
ZALO_APP_SECRET = os.getenv("ZALO_APP_SECRET", "")
ZALO_OA_SECRET_KEY = os.getenv("ZALO_OA_SECRET_KEY", "")
ZALO_ACCESS_TOKEN = os.getenv("ZALO_ACCESS_TOKEN", "")
ZALO_WEBHOOK_VERIFY_TOKEN = os.getenv("ZALO_WEBHOOK_VERIFY_TOKEN", "dino_ai_secret_token_2026")

# Database Path
DB_PATH = BASE_DIR / "dino.db"

# Family Profile Defaults
BABY_INFO = {
    "name": "Lê Trương Quốc Vũ",
    "nickname": "Dino (Dinosaur)",
    "dob": "2026-02-14",
    "gender": "male",
}

PARENTS_INFO = {
    "father": {
        "name": "Lê Quốc Thắng",
        "dob": "2000-02-04",
        "role": "Bố",
        "zalo_id": os.getenv("ZALO_FATHER_ID", "")
    },
    "mother": {
        "name": "Trương Hoàng Linh Chi",
        "dob": "2001-09-13",
        "role": "Mẹ",
        "zalo_id": os.getenv("ZALO_MOTHER_ID", "")
    }
}
