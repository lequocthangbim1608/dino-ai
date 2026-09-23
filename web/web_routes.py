from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
from config import BABY_INFO, PARENTS_INFO, ZALO_WEBHOOK_VERIFY_TOKEN
from ai.prompt_templates import calculate_dino_age
from ai.gemini_service import process_parent_message
from database.db_manager import (
    get_recent_logs,
    add_log,
    get_growth_records,
    add_growth_record,
    get_who_standards,
    get_milestones,
    add_milestone,
    get_vaccines,
    update_vaccine_status
)
from bot.zalo_service import handle_zalo_event

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    author_role: str = "Bố" # "Bố" hoặc "Mẹ"
    author_name: Optional[str] = None

class GrowthRequest(BaseModel):
    record_date: str
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    head_circ_cm: Optional[float] = None
    notes: Optional[str] = None

class MilestoneRequest(BaseModel):
    achieved_date: str
    title: str
    category: str = "motor"
    description: Optional[str] = None

class VaccineToggleRequest(BaseModel):
    status: str
    given_date: Optional[str] = None

@router.get("/api/info")
async def get_system_info():
    age_info = calculate_dino_age()
    return {
        "baby": {
            **BABY_INFO,
            "age": age_info
        },
        "parents": PARENTS_INFO
    }

@router.get("/api/logs")
async def fetch_logs(limit: int = 30):
    return await get_recent_logs(limit)

@router.post("/api/chat")
async def chat_interaction(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Tin nhắn không được để trống")
        
    author_name = req.author_name or (PARENTS_INFO["father"]["name"] if req.author_role == "Bố" else PARENTS_INFO["mother"]["name"])
    
    # Process message
    ai_res = await process_parent_message(req.message, req.author_role, author_name)
    reply = ai_res.get("reply", "Dino AI đã ghi nhận!")
    category = ai_res.get("category", "NOTE")
    
    # Save log
    await add_log(
        author_name=author_name,
        author_role=req.author_role,
        channel="web",
        category=category,
        raw_message=req.message,
        parsed_data=ai_res.get("extracted_data", {}),
        ai_reply=reply
    )
    
    return {
        "reply": reply,
        "category": category,
        "extracted_data": ai_res.get("extracted_data", {}),
        "author_name": author_name,
        "author_role": req.author_role
    }

@router.get("/api/growth")
async def fetch_growth():
    records = await get_growth_records()
    who = await get_who_standards()
    return {"records": records, "who_standards": who}

@router.post("/api/growth")
async def create_growth_record(req: GrowthRequest):
    age_info = calculate_dino_age()
    month_age = round(age_info["total_days"] / 30.4375, 1)
    record_id = await add_growth_record(
        record_date=req.record_date,
        month_age=month_age,
        weight_kg=req.weight_kg,
        height_cm=req.height_cm,
        head_circ_cm=req.head_circ_cm,
        notes=req.notes
    )
    return {"status": "success", "id": record_id}

@router.get("/api/milestones")
async def fetch_milestones():
    return await get_milestones()

@router.post("/api/milestones")
async def create_milestone(req: MilestoneRequest):
    m_id = await add_milestone(
        achieved_date=req.achieved_date,
        title=req.title,
        category=req.category,
        description=req.description or ""
    )
    return {"status": "success", "id": m_id}

@router.get("/api/vaccines")
async def fetch_vaccines():
    return await get_vaccines()

@router.post("/api/vaccines/{vaccine_id}/toggle")
async def toggle_vaccine(vaccine_id: int, req: VaccineToggleRequest):
    await update_vaccine_status(vaccine_id, req.status, req.given_date)
    return {"status": "success"}

# Zalo OA Webhook Endpoints
@router.get("/api/zalo/webhook")
async def zalo_webhook_verification(request: Request):
    # Zalo challenge verification or token check
    params = dict(request.query_params)
    challenge = params.get("challenge") or params.get("hub.challenge")
    if challenge:
        return int(challenge) if challenge.isdigit() else challenge
    return {"status": "ok", "message": "Zalo Webhook Endpoint Ready"}

@router.post("/api/zalo/webhook")
async def zalo_webhook_receiver(request: Request):
    try:
        body = await request.json()
        result = await handle_zalo_event(body)
        return result
    except Exception as e:
        print(f"[Zalo Webhook Exception]: {e}")
        return {"status": "error", "detail": str(e)}
