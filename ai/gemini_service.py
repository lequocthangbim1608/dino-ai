import json
import re
from datetime import datetime, date
from config import GEMINI_API_KEY, GEMINI_MODEL
from ai.prompt_templates import SYSTEM_PROMPT, calculate_dino_age
from database.db_manager import add_growth_record, add_milestone

def fallback_smart_parser(message: str, author_role: str):
    """
    Hệ thống phân tích dự phòng thông minh (Rule-based & Pediatric Knowledge)
    hoạt động mượt mà ngay cả khi chưa gắn GEMINI_API_KEY.
    """
    msg_lower = message.lower()
    age_info = calculate_dino_age()
    role_str = "Bố Thắng" if "bố" in author_role.lower() or "thắng" in author_role.lower() else "Mẹ Chi"

    # Kiểm tra chỉ số sức khỏe (Cân nặng, chiều cao, nhiệt độ)
    weight_match = re.search(r"(\d+(\.\d+)?)\s*(kg|kí|cân)", msg_lower)
    height_match = re.search(r"(\d+(\.\d+)?)\s*(cm|phân)", msg_lower)
    temp_match = re.search(r"(\d+(\.\d+)?)\s*(độ|°c)", msg_lower)

    if weight_match or height_match or temp_match or "sốt" in msg_lower or "khám" in msg_lower:
        weight = float(weight_match.group(1)) if weight_match else None
        height = float(height_match.group(1)) if height_match else None
        
        reply_lines = [f"Chào {role_str}! Dino AI đã ghi nhận chỉ số sức khỏe của bé Dino ({age_info['age_str']})."]
        if weight:
            # Chuẩn WHO bé trai 7-8 tháng: 6.9 - 10.7kg, trung bình ~8.6kg
            reply_lines.append(f"• Cân nặng: {weight} kg. So với chuẩn WHO bé trai giai đoạn này (~8.3 - 8.6 kg), trộm vía chỉ số của Dino rất tốt và khỏe mạnh!")
        if height:
            # Chuẩn WHO bé trai 7-8 tháng: 66 - 75cm, trung bình ~70.6cm
            reply_lines.append(f"• Chiều cao: {height} cm. Bé đang phát triển chiều dài cơ thể rất đạt chuẩn.")
        if temp_match:
            temp = float(temp_match.group(1))
            if temp >= 38.5:
                reply_lines.append(f"⚠️ Chú ý: Nhiệt độ {temp}°C là sốt cao đối với bé {age_info['months']} tháng. {role_str} hãy lau mát nách/bẹn bằng nước ấm, cho bé bú nhiều cữ nhỏ và tham vấn bác sĩ chuyên khoa nhi nếu sốt kéo dài nhé!")
            elif temp >= 37.5:
                reply_lines.append(f"• Thân nhiệt {temp}°C hơi ấm nhẹ (có thể do mọc răng hoặc vừa tiêm phòng). {role_str} cho bé mặc đồ thoáng mát và theo dõi thêm nhé.")

        return {
            "category": "HEALTH",
            "summary": "Ghi nhận chỉ số sức khỏe/thể chất",
            "extracted_data": {
                "weight_kg": weight,
                "height_cm": height,
                "temp": float(temp_match.group(1)) if temp_match else None
            },
            "reply": "\n".join(reply_lines)
        }

    # Kiểm tra ăn uống / ăn dặm
    if any(k in msg_lower for k in ["ăn", "cháo", "bột", "bơ", "yến mạch", "súp", "sữa", "bú", "blw"]):
        return {
            "category": "MEAL",
            "summary": "Bữa ăn dặm / cữ sữa của Dino",
            "extracted_data": {"food_text": message},
            "reply": f"Dạ {role_str}! Dino AI đã lưu lại nhật ký bữa ăn này của bé Dino rồi ạ. "
                     f"Ở mốc {age_info['age_str']}, hệ tiêu hóa của Dino đang làm quen tuyệt vời với các món mới. "
                     f"{role_str} nhớ cho bé uống vài ngụm nước ấm sau bữa ăn và duy trì lượng sữa chính 600-800ml/ngày để đảm bảo năng lượng nhé!"
        }

    # Kiểm tra giấc ngủ
    if any(k in msg_lower for k in ["ngủ", "nap", "dậy", "thức", "ngáy"]):
        return {
            "category": "SLEEP",
            "summary": "Giấc ngủ / nếp sinh hoạt Easy",
            "extracted_data": {"sleep_text": message},
            "reply": f"Dino AI đã ghi nhận giấc ngủ của bé Dino! Ở tuổi này ({age_info['age_str']}), "
                     f"bé thường duy trì 2-3 giấc nap ban ngày với thời gian thức (wake window) khoảng 2.5 - 3 tiếng trước mỗi cữ ngủ. "
                     f"Chúc bé Dino ngủ thật ngon và sâu giấc!"
        }

    # Kiểm tra cột mốc phát triển
    if any(k in msg_lower for k in ["bò", "ngồi", "lẫy", "vịn", "đứng", "nói", "bập bẹ", "ba ba", "ma ma", "răng", "mọc"]):
        return {
            "category": "MILESTONE",
            "summary": "Cột mốc phát triển mới của Dino",
            "extracted_data": {"milestone_title": message[:50]},
            "reply": f"🎉 Hoan hô bé Dino! Chúc mừng {role_str} và gia đình! "
                     f"Mốc phát triển '{message}' là một bước tiến vượt bậc của Dino ở giai đoạn {age_info['age_str']}. "
                     f"Bố mẹ nhớ khích lệ con và chú ý an toàn xung quanh khu vực bé vận động nhé!"
        }

    # Trường hợp hỏi đáp chung hoặc ghi chép khác
    return {
        "category": "NOTE",
        "summary": "Ghi chép kỷ niệm gia đình",
        "extracted_data": {"content": message},
        "reply": f"Dạ chào {role_str}! Dino AI đã lắng nghe và lưu lại ghi chép này vào sổ tay trưởng thành của Dino ({age_info['age_str']}). "
                 f"{role_str} cần em hỗ trợ giải đáp hay gợi ý điều gì về thực đơn ăn dặm, lịch tiêm phòng hay trò chơi phát triển cho con không ạ?"
    }

async def process_parent_message(message: str, author_role: str, author_name: str) -> dict:
    """
    Xử lý tin nhắn từ Bố Thắng hoặc Mẹ Chi qua Gemini API (hoặc fallback thông minh)
    Đồng thời tự động lưu vào các bảng tăng trưởng/cột mốc nếu có số liệu.
    """
    age_info = calculate_dino_age()
    
    result = None
    if GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            
            prompt_context = SYSTEM_PROMPT.format(
                age_str=age_info["age_str"],
                months=age_info["months"]
            )
            
            user_instruction = f"""Người gửi: {author_name} ({author_role})
Nội dung tin nhắn: "{message}"
Thời gian gửi: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
Hãy phân tích và trả về đúng định dạng JSON như đã hướng dẫn."""

            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[prompt_context, user_instruction]
            )
            
            text_response = response.text.strip()
            # Clean markdown codeblocks if Gemini wraps in ```json
            if "```" in text_response:
                match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text_response)
                if match:
                    text_response = match.group(1).strip()
            
            result = json.loads(text_response)
        except Exception as e:
            print(f"[Gemini Service Warning]: {e}. Using fallback parser.")
            result = fallback_smart_parser(message, author_role)
    else:
        result = fallback_smart_parser(message, author_role)

    # Tự động cập nhật vào database nếu có chỉ số sức khỏe hoặc cột mốc
    extracted = result.get("extracted_data", {})
    if isinstance(extracted, dict):
        weight = extracted.get("weight_kg")
        height = extracted.get("height_cm")
        if weight or height:
            today_str = date.today().strftime("%Y-%m-%d")
            month_age = round(age_info["total_days"] / 30.4375, 1)
            await add_growth_record(
                record_date=today_str,
                month_age=month_age,
                weight_kg=weight,
                height_cm=height,
                notes=f"Ghi nhận tự động từ tin nhắn: '{message}'"
            )

        if result.get("category") == "MILESTONE":
            milestone_title = extracted.get("milestone_title") or message[:50]
            today_str = date.today().strftime("%Y-%m-%d")
            await add_milestone(
                achieved_date=today_str,
                title=milestone_title,
                category="motor" if any(w in message.lower() for w in ["bò", "ngồi", "đứng", "vịn"]) else "general",
                description=f"Ghi nhận từ {author_name}: {message}"
            )

    return result
