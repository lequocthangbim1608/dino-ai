import httpx
from config import (
    ZALO_ACCESS_TOKEN,
    ZALO_OA_SECRET_KEY,
    PARENTS_INFO
)
from database.db_manager import add_log
from ai.gemini_service import process_parent_message

ZALO_OPENAPI_URL = "https://openapi.zalo.me/v3.0/oa/message/cs"

def identify_parent(sender_id: str, message_text: str = ""):
    """
    Xác định danh tính người gửi (Bố Thắng hoặc Mẹ Chi)
    dựa trên Zalo User ID đã lưu hoặc xưng hô trong tin nhắn.
    """
    father_id = PARENTS_INFO["father"]["zalo_id"]
    mother_id = PARENTS_INFO["mother"]["zalo_id"]

    if sender_id and sender_id == father_id:
        return PARENTS_INFO["father"]["name"], "Bố"
    if sender_id and sender_id == mother_id:
        return PARENTS_INFO["mother"]["name"], "Mẹ"

    # Nhận diện theo từ khóa trong câu nếu chưa cấu hình ID cố định
    text_lower = message_text.lower()
    if any(k in text_lower for k in ["bố thắng", "ba thắng", "bố đây", "ba đây", "anh thắng"]):
        return PARENTS_INFO["father"]["name"], "Bố"
    if any(k in text_lower for k in ["mẹ chi", "mẹ đây", "linh chi", "em chi"]):
        return PARENTS_INFO["mother"]["name"], "Mẹ"

    # Mặc định là Bố hoặc Mẹ chung cho gia đình
    return "Bố/Mẹ", "Phụ huynh"

async def send_zalo_message(user_id: str, text: str):
    """
    Gửi tin nhắn phản hồi tới Zalo của Bố Thắng hoặc Mẹ Chi qua Zalo OpenAPI.
    """
    if not ZALO_ACCESS_TOKEN:
        print("[Zalo Service] Chưa có ZALO_ACCESS_TOKEN. Không thể gửi tin nhắn qua Zalo OpenAPI.")
        return False

    payload = {
        "recipient": {
            "user_id": user_id
        },
        "message": {
            "text": text
        }
    }
    headers = {
        "access_token": ZALO_ACCESS_TOKEN,
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(ZALO_OPENAPI_URL, json=payload, headers=headers)
            data = resp.json()
            if data.get("error") == 0:
                print(f"[Zalo Service] Đã gửi tin nhắn thành công tới {user_id}")
                return True
            else:
                print(f"[Zalo Service Error] Zalo API error: {data}")
                return False
    except Exception as e:
        print(f"[Zalo Service Exception]: {e}")
        return False

async def handle_zalo_event(payload: dict):
    """
    Xử lý webhook event nhận được từ Zalo OA.
    Hỗ trợ text, voice (nếu có transcription/audio), hình ảnh.
    """
    event_name = payload.get("event_name", "")
    sender_id = payload.get("sender", {}).get("id", "")
    message_obj = payload.get("message", {})

    if event_name in ["user_send_text", "user_send_image", "user_send_audio"]:
        raw_text = message_obj.get("text", "")
        if not raw_text:
            if event_name == "user_send_image":
                raw_text = "Đã gửi 1 bức ảnh của bé Dino"
            elif event_name == "user_send_audio":
                raw_text = "Đã gửi 1 đoạn tin nhắn thoại"

        author_name, author_role = identify_parent(sender_id, raw_text)

        # Xử lý thông điệp qua AI Engine
        ai_res = await process_parent_message(raw_text, author_role, author_name)
        reply_text = ai_res.get("reply", "Dino AI đã ghi nhận thông tin!")

        # Lưu log vào database
        await add_log(
            author_name=author_name,
            author_role=author_role,
            channel="zalo",
            category=ai_res.get("category", "NOTE"),
            raw_message=raw_text,
            parsed_data=ai_res.get("extracted_data", {}),
            ai_reply=reply_text
        )

        # Gửi phản hồi qua Zalo nếu có sender_id
        if sender_id:
            await send_zalo_message(sender_id, reply_text)

        return {
            "status": "success",
            "reply": reply_text,
            "category": ai_res.get("category"),
            "author": author_name
        }

    return {"status": "ignored", "event": event_name}
