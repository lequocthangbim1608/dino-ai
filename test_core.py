import asyncio
import sys

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from database.db_manager import init_db, get_recent_logs, get_growth_records, get_vaccines
from ai.prompt_templates import calculate_dino_age
from ai.gemini_service import process_parent_message
from bot.zalo_service import handle_zalo_event

async def test():
    print("--- 1. Kiểm tra tính tuổi bé Dino ---")
    age = calculate_dino_age()
    print("Tuổi bé Dino:", age["age_str"])

    print("\n--- 2. Khởi tạo Cơ Sở Dữ Liệu SQLite ---")
    await init_db()
    logs = await get_recent_logs(5)
    print("Số lượng logs ban đầu:", len(logs))
    growth = await get_growth_records()
    print("Số lượng bản ghi tăng trưởng:", len(growth))
    vaccines = await get_vaccines()
    print("Số lượng mũi vắc xin đã nạp:", len(vaccines))

    print("\n--- 3. Thử nghiệm AI Phân tích tin nhắn ---")
    res = await process_parent_message(
        "Hôm nay Dino ăn hết 50ml cháo yến mạch và 1 miếng bơ, con rất thích", 
        "Bố", 
        "Lê Quốc Thắng"
    )
    print("Phân loại:", res.get("category"))
    print("Phản hồi AI:", res.get("reply"))

    print("\n--- 4. Thử nghiệm Webhook Zalo mô phỏng ---")
    webhook_res = await handle_zalo_event({
        "event_name": "user_send_text",
        "sender": {"id": "test_sender_123"},
        "message": {"text": "Dino hôm nay cân được 8.7kg rồi nè"}
    })
    print("Webhook Status:", webhook_res.get("status"))
    print("Webhook Reply:", webhook_res.get("reply"))
    print("\n✅ TẤT CẢ CÁC BƯỚC KIỂM TRA ĐỀU THÀNH CÔNG!")

if __name__ == "__main__":
    asyncio.run(test())
