import time
import re
import os
import sys

if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, 'reconfigure'):
            sys.stdout.reconfigure(encoding='utf-8')
            sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def find_tunnel_url():
    log_file = "tunnel.log"
    print("Dang khoi tao duong link HTTPS cho dien thoai...", flush=True)
    
    # Wait up to 15 seconds for URL to appear in log
    start_time = time.time()
    url = None
    
    while time.time() - start_time < 15:
        if os.path.exists(log_file):
            try:
                with open(log_file, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    matches = re.findall(r"https://[a-zA-Z0-9\-]+\.trycloudflare\.com", content)
                    if matches:
                        url = matches[-1]
                        break
            except Exception:
                pass
        time.sleep(0.5)
        
    if url:
        print("\n========================================================", flush=True)
        print("     DUONG LINK MO TREN DIEN THOAI (SAFARI / CHROME)    ", flush=True)
        print("========================================================", flush=True)
        print(f"\n   LINK: {url}\n", flush=True)
        print("========================================================", flush=True)
        print("Meo: Mo Zalo may tinh, gui link tren sang Zalo dien thoai")
        print("roi bam vao link la xong ngay!")
        print("========================================================\n", flush=True)
        
        # Save to helper text file for easy copy
        with open("LINK_CHO_DIEN_THOAI.txt", "w", encoding="utf-8") as f:
            f.write(f"Đường link mở trên điện thoại (iPhone Safari / Android Chrome):\n\n{url}\n\n(Chỉ cần copy link này gửi vào Zalo máy tính -> Mở trên điện thoại là dùng được ngay!)")
    else:
        print("\nKhong lay duoc duong dan Cloudflare. Ban co the dung link Wi-Fi noi bo:")
        print("http://192.168.1.26:8000\n", flush=True)

if __name__ == "__main__":
    find_tunnel_url()
