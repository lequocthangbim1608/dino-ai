# 🦖 DINO AI - Người Bạn Đồng Hành Cùng Bé Lê Trương Quốc Vũ

Dự án **DINO AI** là hệ thống trợ lý thông minh được tạo ra nhằm đồng hành cùng **Bố Lê Quốc Thắng** và **Mẹ Trương Hoàng Linh Chi** trong suốt hành trình nuôi dạy và chứng kiến con trai yêu **Lê Trương Quốc Vũ (Dino)** khôn lớn trong kỷ nguyên trí tuệ nhân tạo.

---

## 👨‍👩‍👦 Thông Tin Gia Đình

- **Bé yêu:** Lê Trương Quốc Vũ (ở nhà gọi là **Dino / Dinosaur**)
- **Ngày sinh:** 14/02/2026 (Ngày Lễ Tình Nhân)
- **Bố:** Lê Quốc Thắng (04/02/2000)
- **Mẹ:** Trương Hoàng Linh Chi (13/09/2001)

---

## 🌟 Tính Năng Nổi Bật

1. **Ghi chép thông minh (Smart Logger):**
   - Bố mẹ nhắn tin tự nhiên (văn bản/giọng nói): *"Dino vừa ăn hết 60ml cháo bí đỏ"*, *"Hôm nay Dino được 8.6kg, 70cm"*, *"Con vừa biết tự vịn đứng mép giường"*.
   - AI tự động nhận diện và phân loại: Ăn dặm (`MEAL`), Sức khỏe/Tăng trưởng (`HEALTH`), Cột mốc (`MILESTONE`), Giấc ngủ (`SLEEP`), hoặc Kỷ niệm (`NOTE`).
2. **Trợ lý Nhi khoa & Phát triển sớm:**
   - Đưa ra lời khuyên ấm áp, khoa học theo chuẩn WHO và viện dinh dưỡng, sát theo độ tuổi hiện tại của bé Dino (giai đoạn 7-8 tháng tuổi).
3. **Biểu đồ tăng trưởng chuẩn WHO:**
   - Tự động vẽ đường tăng trưởng cân nặng của bé Dino so với dải chuẩn (+2SD, Median, -2SD) của WHO cho bé trai 0 - 24 tháng.
4. **Sổ tay tiêm chủng điện tử:**
   - Tích hợp sẵn toàn bộ lịch tiêm chủng mở rộng và dịch vụ tại Việt Nam (Lao, 6 trong 1, Phế cầu, Rota, Cúm, Sởi, Thủy đậu...).
5. **Đa kênh - Điện thoại Bố & Mẹ:**
   - **Ứng dụng Zalo:** Nhận tin nhắn và phản hồi trực tiếp qua Zalo Official Account.
   - **Web App Mobile (PWA):** Giao diện đẹp, mượt mà, lưu ra màn hình chính điện thoại như 1 ứng dụng độc lập.

---

## 🚀 Cách Chạy Ứng Dụng

### Cách 1: Chạy 1-Click (Nhanh nhất)
- Nhấp đúp chuột vào tệp **`run.bat`** trong thư mục dự án.
- Trình duyệt sẽ tự động mở trang chủ tại: **`http://localhost:8000`**

### Cách 2: Chạy bằng dòng lệnh Terminal
```powershell
.\venv\Scripts\activate
python main.py
```

---

## 📱 Hướng Dẫn Mở Trên Điện Thoại (Bố Thắng & Mẹ Chi)

1. Đảm bảo điện thoại của Bố và Mẹ kết nối **cùng mạng Wi-Fi** với máy tính đang chạy DINO AI.
2. Tìm địa chỉ IP của máy tính (Mở CMD gõ `ipconfig`, tìm dòng `IPv4 Address`, ví dụ: `192.168.1.15`).
3. Trên Safari (iPhone) hoặc Chrome (Android), mở địa chỉ:
   ```
   http://192.168.1.15:8000
   ```
4. **Tạo icon ứng dụng ngoài màn hình chính:**
   - Trên **iPhone (Safari):** Bấm nút Chia sẻ (Share) ➡️ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   - Trên **Android (Chrome):** Bấm dấu 3 chấm góc trên ➡️ Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào Màn hình chính"**.
   - Bây giờ trên điện thoại đã có ứng dụng **Dino AI** sẵn sàng sử dụng!

---

## 💬 Cấu Hình Zalo Official Account (OA)

Khi bố Thắng đăng ký Zalo Official Account trên [developers.zalo.me](https://developers.zalo.me/):

1. **Cấu hình Webhook URL:**
   - Đặt URL webhook trỏ về: `https://<ten-mien-cua-ban>/api/zalo/webhook` (có thể dùng dịch vụ như Cloudflare Tunnel, ngrok hoặc VPS để tạo URL HTTPS ra ngoài internet).
   - Mã xác thực (Verify Token): `dino_ai_secret_token_2026`
2. **Điền thông tin vào file `.env`:**
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   ZALO_APP_ID=your_zalo_app_id
   ZALO_APP_SECRET=your_zalo_app_secret
   ZALO_ACCESS_TOKEN=your_zalo_access_token
   ZALO_FATHER_ID=id_zalo_bo_thang
   ZALO_MOTHER_ID=id_zalo_me_chi
   ```
3. *Lưu ý:* Hệ thống tích hợp sẵn công cụ **"Mô Phỏng Nhắn Tin Zalo"** ngay trên tab Kết Nối Zalo của Web App để bố mẹ kiểm tra trước tính năng bất kỳ lúc nào!
