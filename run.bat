@echo off
chcp 65001 > nul
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
title DINO AI - Tro Ly Nuoi Day Be Quoc Vu
color 0A

echo ========================================================
echo       DINO AI - HE THONG TRO LY NUOI DAY CON
echo       Be: Le Truong Quoc Vu (Dino) - 14/02/2026
echo       Bo Thang va Me Chi
echo ========================================================
echo.

:: Don dep cac tien trinh cu neu co
taskkill /F /IM cloudflared.exe >nul 2>&1
del tunnel.log >nul 2>&1
del LINK_CHO_DIEN_THOAI.txt >nul 2>&1

if not exist venv (
    echo [1/3] Dang khoi tao moi truong Python venv...
    "C:\Users\lequo\AppData\Local\Programs\Python\Python312\python.exe" -m venv venv
    call venv\Scripts\pip.exe install -r requirements.txt
)

echo [1/3] Dang khoi dong Server DINO AI...
start "DINO AI Server" /min venv\Scripts\python.exe main.py
timeout /t 2 /nobreak > nul

if exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
    echo [2/3] Dang khoi tao ket noi an toan cho dien thoai...
    start "Cloudflare Tunnel" /min "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:8000 --logfile tunnel.log
    timeout /t 2 /nobreak > nul
    venv\Scripts\python.exe show_url.py
)

echo [3/3] Dang mo trinh duyet tren may tinh...
start http://localhost:8000

echo.
echo ========================================================
echo   SERVER VA HE THONG DANG CHAY ON DINH!
echo   - Tren may tinh: http://localhost:8000
echo   - Mo file LINK_CHO_DIEN_THOAI.txt de copy link gui Zalo
echo   - Dong cua so nay de tat server.
echo ========================================================
echo.

pause
