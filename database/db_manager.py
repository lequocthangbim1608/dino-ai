import aiosqlite
import json
from datetime import datetime
from config import DB_PATH, BABY_INFO

INITIAL_VACCINES = [
    # Giai đoạn Sơ sinh
    ("Lao (BCG)", "Sơ sinh (trong 30 ngày đầu)", "Phòng bệnh lao màng não, lao kê", "COMPLETED", "2026-02-15"),
    ("Viêm gan B (Mũi 0)", "Sơ sinh (trong 24h đầu)", "Phòng lây truyền viêm gan B từ mẹ", "COMPLETED", "2026-02-14"),

    # Giai đoạn 2 tháng
    ("6 trong 1 (Mũi 1)", "2 tháng", "Bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B", "COMPLETED", "2026-04-15"),
    ("Phế cầu khuẩn (Mũi 1)", "2 tháng", "Phòng viêm phổi, viêm màng não, viêm tai giữa do phế cầu (Synflorix/Prevenar 13)", "COMPLETED", "2026-04-15"),
    ("Rota virus (Liều 1)", "2 tháng", "Phòng tiêu chảy cấp do virus Rota (Rotarix/Rotateq)", "COMPLETED", "2026-04-15"),

    # Giai đoạn 3 tháng
    ("6 trong 1 (Mũi 2)", "3 tháng", "Bạch hầu, ho gà, uốn ván, bại liệt, Hib, viêm gan B", "COMPLETED", "2026-05-16"),
    ("Phế cầu khuẩn (Mũi 2)", "3 tháng", "Phòng viêm phổi, viêm tai giữa, viêm màng não", "COMPLETED", "2026-05-16"),
    ("Rota virus (Liều 2)", "3 tháng", "Phòng tiêu chảy cấp do virus Rota", "COMPLETED", "2026-05-16"),

    # Giai đoạn 4 tháng
    ("6 trong 1 (Mũi 3)", "4 tháng", "Hoàn thành phác đồ cơ bản 6 trong 1", "COMPLETED", "2026-06-16"),
    ("Phế cầu khuẩn (Mũi 3)", "4 tháng", "Hoàn thành phác đồ cơ bản phế cầu", "COMPLETED", "2026-06-16"),
    ("Rota virus (Liều 3 - nếu dùng Rotateq)", "4 tháng", "Hoàn thành phác đồ Rota 3 liều", "COMPLETED", "2026-06-16"),

    # Giai đoạn 6 tháng
    ("Cúm mùa (Mũi 1)", "6 tháng", "Phòng cúm các chủng A/B (Vaxigrip Tetra/Influvac)", "COMPLETED", "2026-08-16"),
    ("Não mô cầu B hoặc BC (Mũi 1)", "6 tháng", "Phòng viêm màng não, nhiễm trùng huyết do não mô cầu B/BC (Bexsero/Mengoc BC)", "PENDING", None),

    # Giai đoạn 7 tháng (Tuổi hiện tại của Dino)
    ("Cúm mùa (Mũi 2 - nhắc lại)", "7 tháng", "Nhắc lại sau mũi 1 một tháng (hoàn thành phác đồ năm đầu)", "PENDING", None),
    ("Não mô cầu B hoặc BC (Mũi 2)", "7 - 8 tháng", "Mũi nhắc cách mũi 1 tối thiểu 1-2 tháng", "PENDING", None),

    # Giai đoạn 9 tháng
    ("Sởi đơn (MVVac) / Priorix", "9 tháng", "Phòng bệnh sởi nguy hiểm ở trẻ nhỏ", "PENDING", None),
    ("Viêm não Nhật Bản (Mũi 1 - Imojev)", "9 tháng", "Phòng viêm não Nhật Bản thế hệ mới (từ 9 tháng)", "PENDING", None),
    ("Não mô cầu ACYW-135 (Mũi 1 - Menactra/MenQuadfi)", "9 tháng", "Phòng 4 chủng não mô cầu A, C, Y, W-135", "PENDING", None),

    # Giai đoạn 12 tháng (1 tuổi)
    ("Thủy đậu (Mũi 1 - Varilrix/Varivax)", "12 tháng", "Phòng bệnh thủy đậu và biến chứng", "PENDING", None),
    ("Sởi - Quai bị - Rubella (MMR II / Priorix)", "12 tháng", "Phòng 3 bệnh sởi, quai bị, rubella", "PENDING", None),
    ("Viêm gan A (Mũi 1 - Avaxim 80U)", "12 tháng", "Phòng viêm gan siêu vi A cấp tính", "PENDING", None),
    ("Phế cầu khuẩn (Mũi 4 - Nhắc lại)", "11 - 15 tháng", "Mũi nhắc lại quan trọng củng cố miễn dịch sau 1 tuổi", "PENDING", None),

    # Giai đoạn 15 - 18 tháng
    ("6 trong 1 / 5 trong 1 (Mũi 4 - Nhắc lại)", "16 - 18 tháng", "Mũi nhắc lại then chốt duy trì kháng thể bạch hầu, ho gà, uốn ván", "PENDING", None),
    ("Viêm gan A (Mũi 2 - Nhắc lại)", "18 - 24 tháng", "Cách mũi 1 từ 6 - 12 tháng, bảo vệ trọn đời", "PENDING", None),

    # Giai đoạn 24 tháng (2 tuổi)
    ("Viêm não Nhật Bản (Mũi 2 - Imojev)", "24 tháng (sau mũi 1 một năm)", "Mũi nhắc lại hoàn thành phác đồ Imojev", "PENDING", None),
    ("Thương hàn (Typhim Vi Mũi 1)", "Từ 24 tháng (2 tuổi)", "Phòng vi khuẩn thương hàn Salmonella typhi", "PENDING", None),
    ("Tả (Uống 2 liều mORCVAX)", "Từ 24 tháng (2 tuổi)", "Phòng bệnh tả cấp tính (2 liều cách nhau 2 tuần)", "PENDING", None),
    ("Cúm mùa (Tiêm nhắc hàng năm)", "24 tháng", "Tiêm nhắc lại 1 mũi mỗi năm vào mùa thu/đông", "PENDING", None),
    ("Tẩy giun định kỳ (Đợt 1)", "24 tháng (2 tuổi)", "Khuyến cáo Bộ Y tế cho trẻ từ 12-24 tháng (uống 6 tháng/lần)", "PENDING", None),

    # Giai đoạn 36 tháng (3 tuổi)
    ("Thủy đậu (Mũi 2 - Nhắc lại)", "3 tuổi (36 tháng)", "Mũi nhắc củng cố miễn dịch suốt đời phòng thủy đậu", "PENDING", None),
    ("Cúm mùa (Tiêm nhắc 3 tuổi)", "36 tháng", "Tiêm nhắc lại 1 mũi hàng năm", "PENDING", None),
    ("Tẩy giun định kỳ (Đợt tiếp theo)", "36 tháng (3 tuổi)", "Duy trì tẩy giun mỗi 6 tháng", "PENDING", None),
]

WHO_STANDARDS_BOYS = [
    # month, weight_min_kg, weight_med_kg, weight_max_kg, height_min_cm, height_med_cm, height_max_cm
    (0, 2.5, 3.3, 4.4, 46.1, 49.9, 53.7),
    (1, 3.4, 4.5, 5.8, 50.8, 54.7, 58.6),
    (2, 4.3, 5.6, 7.1, 54.4, 58.4, 62.4),
    (3, 5.0, 6.4, 8.0, 57.3, 61.4, 65.5),
    (4, 5.6, 7.0, 8.7, 59.7, 63.9, 68.0),
    (5, 6.0, 7.5, 9.3, 61.7, 65.9, 70.1),
    (6, 6.4, 7.9, 9.8, 63.3, 67.6, 71.9),
    (7, 6.7, 8.3, 10.3, 64.8, 69.2, 73.5),
    (8, 6.9, 8.6, 10.7, 66.2, 70.6, 75.0),
    (9, 7.1, 8.9, 11.0, 67.5, 72.0, 76.5),
    (10, 7.4, 9.2, 11.4, 68.7, 73.3, 77.9),
    (11, 7.6, 9.4, 11.7, 69.9, 74.5, 79.2),
    (12, 7.7, 9.6, 12.0, 71.0, 75.7, 80.5),
    (18, 8.8, 10.9, 13.7, 76.9, 82.3, 87.7),
    (24, 9.7, 12.2, 15.3, 81.7, 87.8, 93.9),
    (30, 10.5, 13.3, 16.9, 85.1, 91.9, 98.7),
    (36, 11.3, 14.3, 18.3, 88.7, 96.1, 103.5),
]

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS baby_profile (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                nickname TEXT,
                dob TEXT NOT NULL,
                gender TEXT DEFAULT 'male',
                notes TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                author_name TEXT NOT NULL,
                author_role TEXT NOT NULL,
                channel TEXT DEFAULT 'web',
                category TEXT NOT NULL, -- MEAL, HEALTH, MILESTONE, SLEEP, DIAPER, NOTE
                raw_message TEXT NOT NULL,
                parsed_data TEXT,
                ai_reply TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS growth (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                record_date TEXT NOT NULL,
                month_age REAL,
                weight_kg REAL,
                height_cm REAL,
                head_circ_cm REAL,
                notes TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS milestones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                achieved_date TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL, -- motor, language, cognitive, social, feeding
                description TEXT,
                photo_url TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS vaccines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                vaccine_name TEXT NOT NULL,
                recommended_age TEXT NOT NULL,
                target_disease TEXT,
                status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, SKIPPED
                given_date TEXT,
                notes TEXT
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS who_standards (
                month_age INTEGER PRIMARY KEY,
                weight_min_kg REAL,
                weight_med_kg REAL,
                weight_max_kg REAL,
                height_min_cm REAL,
                height_med_cm REAL,
                height_max_cm REAL
            )
        """)

        # Check if profile exists, if not insert
        async with db.execute("SELECT COUNT(*) FROM baby_profile") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                await db.execute(
                    "INSERT INTO baby_profile (name, nickname, dob, gender, notes) VALUES (?, ?, ?, ?, ?)",
                    (BABY_INFO["name"], BABY_INFO["nickname"], BABY_INFO["dob"], BABY_INFO["gender"], "Bé yêu của Bố Thắng & Mẹ Chi")
                )

        # Populate & Sync Vaccines
        for v in INITIAL_VACCINES:
            async with db.execute("SELECT COUNT(*) FROM vaccines WHERE vaccine_name = ?", (v[0],)) as cursor:
                exists = (await cursor.fetchone())[0]
                if exists == 0:
                    await db.execute(
                        "INSERT INTO vaccines (vaccine_name, recommended_age, target_disease, status, given_date) VALUES (?, ?, ?, ?, ?)",
                        v
                    )

        # Sync WHO standards (up to 36 months)
        for w in WHO_STANDARDS_BOYS:
            await db.execute(
                "INSERT OR REPLACE INTO who_standards VALUES (?, ?, ?, ?, ?, ?, ?)",
                w
            )

        # Seed initial sample growth & milestone for Dino
        async with db.execute("SELECT COUNT(*) FROM growth") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                # Initial growth records
                records = [
                    ("2026-02-14", 0.0, 3.4, 50.0, 34.5, "Lúc mới sinh tại bệnh viện"),
                    ("2026-05-14", 3.0, 6.3, 61.5, 40.0, "Cột mốc 3 tháng tuổi"),
                    ("2026-08-14", 6.0, 8.0, 67.5, 43.0, "Cột mốc 6 tháng bắt đầu ăn dặm"),
                    ("2026-09-23", 7.3, 8.5, 69.5, 43.8, "Khảo sát chỉ số hiện tại")
                ]
                await db.executemany(
                    "INSERT INTO growth (record_date, month_age, weight_kg, height_cm, head_circ_cm, notes) VALUES (?, ?, ?, ?, ?, ?)",
                    records
                )

        async with db.execute("SELECT COUNT(*) FROM milestones") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                sample_milestones = [
                    ("2026-05-20", "Lẫy tròn trịa", "motor", "Dino tự lẫy từ ngửa sang sấp rất khéo léo"),
                    ("2026-08-01", "Bữa ăn dặm đầu tiên", "feeding", "Dino bắt đầu nếm thử quả bơ và cháo rây yến mạch"),
                    ("2026-09-10", "Tập ngồi vững vàng", "motor", "Dino có thể tự ngồi chơi đồ chơi trong 5-10 phút"),
                    ("2026-09-20", "Bập bẹ gọi ba ba, ma ma", "language", "Dino phát âm 'ba ba' ríu rít khi thấy bố Thắng đi làm về")
                ]
                await db.executemany(
                    "INSERT INTO milestones (achieved_date, title, category, description) VALUES (?, ?, ?, ?)",
                    sample_milestones
                )

        await db.commit()

async def add_log(author_name: str, author_role: str, channel: str, category: str, raw_message: str, parsed_data: dict, ai_reply: str):
    async with aiosqlite.connect(DB_PATH) as db:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor = await db.execute(
            """INSERT INTO logs (timestamp, author_name, author_role, channel, category, raw_message, parsed_data, ai_reply)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (now_str, author_name, author_role, channel, category, raw_message, json.dumps(parsed_data, ensure_ascii=False), ai_reply)
        )
        await db.commit()
        return cursor.lastrowid

async def get_recent_logs(limit: int = 30):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM logs ORDER BY id DESC LIMIT ?", (limit,)) as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_growth_records():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM growth ORDER BY record_date ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def add_growth_record(record_date: str, month_age: float, weight_kg: float = None, height_cm: float = None, head_circ_cm: float = None, notes: str = None):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO growth (record_date, month_age, weight_kg, height_cm, head_circ_cm, notes)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (record_date, month_age, weight_kg, height_cm, head_circ_cm, notes)
        )
        await db.commit()
        return cursor.lastrowid

async def get_who_standards():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM who_standards ORDER BY month_age ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def get_milestones():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM milestones ORDER BY achieved_date DESC") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def add_milestone(achieved_date: str, title: str, category: str, description: str):
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO milestones (achieved_date, title, category, description)
               VALUES (?, ?, ?, ?)""",
            (achieved_date, title, category, description)
        )
        await db.commit()
        return cursor.lastrowid

async def get_vaccines():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM vaccines ORDER BY id ASC") as cursor:
            rows = await cursor.fetchall()
            return [dict(row) for row in rows]

async def update_vaccine_status(vaccine_id: int, status: str, given_date: str = None):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "UPDATE vaccines SET status = ?, given_date = ? WHERE id = ?",
            (status, given_date, vaccine_id)
        )
        await db.commit()
