let currentRole = "Bố";
let currentAuthorName = "Lê Quốc Thắng";
let growthChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  fetchInfo();
  loadVaccines();
  loadGrowthData();
  
  // Set default growth form date to today
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("growthDate");
  if (dateInput) dateInput.value = today;

  // Display actual current host in Zalo webhook guide
  const host = window.location.host || "localhost:8000";
  const protocol = window.location.protocol || "http:";
  const webhookUrlDisplay = document.getElementById("webhookUrlDisplay");
  if (webhookUrlDisplay) {
    webhookUrlDisplay.textContent = `${protocol}//${host}/api/zalo/webhook`;
  }
});

function setRole(role, name) {
  currentRole = role;
  currentAuthorName = name;
  document.getElementById("roleFatherBtn").classList.toggle("active", role === "Bố");
  document.getElementById("roleMotherBtn").classList.toggle("active", role === "Mẹ");
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  
  const targetContent = document.getElementById(`tab-${tabId}`);
  if (targetContent) targetContent.classList.add("active");

  const tabIndexMap = { chat: 0, timeline: 1, growth: 2, vaccine: 3, zalo: 4 };
  const allBtns = document.querySelectorAll(".tab-nav .tab-btn");
  if (allBtns[tabIndexMap[tabId]]) {
    allBtns[tabIndexMap[tabId]].classList.add("active");
  }

  if (tabId === "timeline") loadTimeline();
  if (tabId === "growth") loadGrowthData();
  if (tabId === "vaccine") loadVaccines();
}

async function fetchInfo() {
  try {
    const res = await fetch("/api/info");
    const data = await res.json();
    if (data.baby && data.baby.age) {
      document.getElementById("babyAgeText").textContent = 
        `Sinh ngày 14/02/2026 • Hiện ${data.baby.age.age_str}`;
    }
  } catch (err) {
    console.error("Lỗi khi tải thông tin bé:", err);
  }
}

function quickSend(text) {
  document.getElementById("chatInput").value = text;
  handleChatSubmit();
}

async function handleChatSubmit(e) {
  if (e) e.preventDefault();
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  appendUserMessage(text, currentRole, currentAuthorName);

  const container = document.getElementById("chatMessages");
  const loadingId = "loading-" + Date.now();
  const loadingDiv = document.createElement("div");
  loadingDiv.className = "msg-box bot";
  loadingDiv.id = loadingId;
  loadingDiv.innerHTML = `<div class="msg-bubble"><p>🦖 <i>Dino AI đang suy nghĩ...</i></p></div>`;
  container.appendChild(loadingDiv);
  container.scrollTop = container.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        author_role: currentRole,
        author_name: currentAuthorName
      })
    });
    const data = await res.json();
    const loader = document.getElementById(loadingId);
    if (loader) loader.remove();

    appendBotMessage(data.reply, data.category);
  } catch (err) {
    const loader = document.getElementById(loadingId);
    if (loader) loader.remove();
    appendBotMessage("Xin lỗi Bố Mẹ, Dino AI gặp chút sự cố kết nối. Vui lòng thử lại nhé!");
  }
}

function appendUserMessage(text, role, name) {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "msg-box user";
  div.innerHTML = `
    <div class="msg-header">${role} • ${name}</div>
    <div class="msg-bubble">${escapeHtml(text)}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendBotMessage(reply, category) {
  const container = document.getElementById("chatMessages");
  const div = document.createElement("div");
  div.className = "msg-box bot";
  
  let catBadge = "";
  if (category) {
    catBadge = `<span class="cat-badge cat-${category}">${category}</span><br/>`;
  }

  div.innerHTML = `
    <div class="msg-header">🦖 Dino AI</div>
    <div class="msg-bubble">
      ${catBadge}
      ${reply.replace(/\n/g, "<br/>")}
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

async function loadTimeline() {
  const container = document.getElementById("timelineContainer");
  container.innerHTML = "<p class='empty-state'>Đang tải dữ liệu...</p>";

  try {
    const res = await fetch("/api/logs?limit=30");
    const logs = await res.json();

    if (logs.length === 0) {
      container.innerHTML = "<p class='empty-state'>Chưa có ghi chép nào. Bố mẹ hãy nhắn tin vào phần Trò Chuyện nhé!</p>";
      return;
    }

    container.innerHTML = logs.map(log => `
      <div class="timeline-item">
        <div class="tl-time">${log.timestamp} • Kênh ${log.channel.toUpperCase()}</div>
        <div class="tl-author">${log.author_role} ${log.author_name} • <span class="cat-badge cat-${log.category}">${log.category}</span></div>
        <div class="tl-msg">"${escapeHtml(log.raw_message)}"</div>
        ${log.ai_reply ? `<div class="tl-reply"><b>Dino AI:</b> ${escapeHtml(log.ai_reply)}</div>` : ''}
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = "<p class='empty-state'>Lỗi khi tải nhật ký.</p>";
  }
}

async function loadGrowthData() {
  try {
    const res = await fetch("/api/growth");
    const data = await res.json();
    renderGrowthChart(data.who_standards, data.records);
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu tăng trưởng:", err);
  }
}

function renderGrowthChart(whoStandards, records) {
  const ctx = document.getElementById("growthChart");
  if (!ctx) return;

  const months = whoStandards.map(w => `${w.month_age}T`);
  const whoMin = whoStandards.map(w => w.weight_min_kg);
  const whoMed = whoStandards.map(w => w.weight_med_kg);
  const whoMax = whoStandards.map(w => w.weight_max_kg);

  // Map dino's actual records
  const dinoWeights = whoStandards.map(w => {
    const rec = records.find(r => Math.round(r.month_age) === w.month_age);
    return rec ? rec.weight_kg : null;
  });

  if (growthChartInstance) {
    growthChartInstance.destroy();
  }

  growthChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Bé Dino (kg)",
          data: dinoWeights,
          borderColor: "#2e6f40",
          backgroundColor: "#2e6f40",
          borderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          spanGaps: true
        },
        {
          label: "WHO Trung bình",
          data: whoMed,
          borderColor: "#3498db",
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: "WHO Chuẩn Trên (+2SD)",
          data: whoMax,
          borderColor: "#bdc3c7",
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0
        },
        {
          label: "WHO Chuẩn Dưới (-2SD)",
          data: whoMin,
          borderColor: "#bdc3c7",
          borderDash: [2, 2],
          fill: false,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      },
      scales: {
        y: {
          title: { display: true, text: "Cân nặng (kg)" },
          min: 2,
          max: 16
        }
      }
    }
  });
}

async function handleGrowthSubmit(e) {
  e.preventDefault();
  const date = document.getElementById("growthDate").value;
  const weight = parseFloat(document.getElementById("growthWeight").value);
  const height = parseFloat(document.getElementById("growthHeight").value) || null;
  const notes = document.getElementById("growthNote").value;

  try {
    await fetch("/api/growth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ record_date: date, weight_kg: weight, height_cm: height, notes: notes })
    });
    alert("Đã lưu chỉ số tăng trưởng của Dino thành công!");
    document.getElementById("growthWeight").value = "";
    document.getElementById("growthHeight").value = "";
    document.getElementById("growthNote").value = "";
    loadGrowthData();
  } catch (err) {
    alert("Có lỗi khi lưu chỉ số: " + err);
  }
}

let currentVaccineFilter = "all";
let cachedVaccines = [];

async function loadVaccines() {
  const container = document.getElementById("vaccineList");
  try {
    const res = await fetch("/api/vaccines");
    cachedVaccines = await res.json();
    renderVaccineList();
  } catch (err) {
    container.innerHTML = "<p class='empty-state'>Lỗi khi tải danh sách tiêm chủng.</p>";
  }
}

function setVaccineFilter(filter) {
  currentVaccineFilter = filter;
  renderVaccineList();
}

function renderVaccineList() {
  const container = document.getElementById("vaccineList");
  if (!cachedVaccines || cachedVaccines.length === 0) {
    container.innerHTML = "<p class='empty-state'>Chưa có dữ liệu vắc xin.</p>";
    return;
  }

  const completed = cachedVaccines.filter(v => v.status === "COMPLETED").length;
  const total = cachedVaccines.length;
  const percent = Math.round((completed / total) * 100);

  const filtered = cachedVaccines.filter(v => {
    if (currentVaccineFilter === "pending") return v.status === "PENDING";
    if (currentVaccineFilter === "completed") return v.status === "COMPLETED";
    return true;
  });

  let html = `
    <div class="vaccine-summary-card">
      <div class="vac-progress-header">
        <span>Tiến độ tiêm chủng (0 - 3 tuổi): <b>${completed}/${total} mũi (${percent}%)</b></span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" style="width: ${percent}%;"></div>
      </div>
      <div class="vac-filter-buttons">
        <button class="filter-btn ${currentVaccineFilter === 'all' ? 'active' : ''}" onclick="setVaccineFilter('all')">Tất cả (${total})</button>
        <button class="filter-btn ${currentVaccineFilter === 'pending' ? 'active' : ''}" onclick="setVaccineFilter('pending')">Cần tiêm (${total - completed})</button>
        <button class="filter-btn ${currentVaccineFilter === 'completed' ? 'active' : ''}" onclick="setVaccineFilter('completed')">Đã tiêm (${completed})</button>
      </div>
    </div>
  `;

  html += filtered.map(v => {
    const isDone = v.status === "COMPLETED";
    return `
      <div class="vaccine-card ${isDone ? 'completed' : 'pending'}">
        <div class="vac-info">
          <div class="vac-title">${v.vaccine_name}</div>
          <div class="vac-age">📅 Khuyến nghị: <b>${v.recommended_age}</b></div>
          <div class="sub-text">${v.target_disease || ''}</div>
          ${isDone && v.given_date ? `<div class="vac-done-date">✓ Đã tiêm ngày: ${v.given_date}</div>` : ''}
        </div>
        <button 
          class="vac-btn ${isDone ? 'done' : 'wait'}"
          onclick="toggleVaccine(${v.id}, '${isDone ? 'PENDING' : 'COMPLETED'}')">
          ${isDone ? '✓ Đã tiêm' : '⏳ Cần tiêm'}
        </button>
      </div>
    `;
  }).join("");

  container.innerHTML = html;
}

async function toggleVaccine(id, newStatus) {
  try {
    const givenDate = newStatus === "COMPLETED" ? new Date().toISOString().split("T")[0] : null;
    await fetch(`/api/vaccines/${id}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, given_date: givenDate })
    });
    loadVaccines();
  } catch (err) {
    alert("Lỗi khi cập nhật trạng thái vắc xin.");
  }
}

async function simulateZaloWebhook() {
  const senderType = document.getElementById("simSender").value;
  const msg = document.getElementById("simMessage").value.trim();
  const resBox = document.getElementById("simResult");

  if (!msg) {
    alert("Vui lòng nhập nội dung tin nhắn mô phỏng.");
    return;
  }

  const senderId = senderType === "father" ? "zalo_father_test_id" : "zalo_mother_test_id";
  const authorPrefix = senderType === "father" ? "Bố Thắng: " : "Mẹ Chi: ";

  resBox.classList.remove("hidden");
  resBox.innerHTML = "Đang gửi webhook mô phỏng đến server...";

  try {
    const payload = {
      event_name: "user_send_text",
      app_id: "test_app_id",
      sender: { id: senderId },
      message: {
        text: authorPrefix + msg,
        msg_id: "msg_" + Date.now()
      }
    };

    const res = await fetch("/api/zalo/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json();

    resBox.innerHTML = `
      <b>✅ Webhook xử lý thành công!</b><br/>
      <b>Người gửi:</b> ${result.author || 'Gia đình'}<br/>
      <b>Phân loại AI:</b> <span class="cat-badge cat-${result.category}">${result.category}</span><br/>
      <b>Phản hồi gửi về Zalo:</b><br/>
      <div style="background:#e8f5e9; padding:8px; border-radius:6px; margin-top:4px;">
        ${escapeHtml(result.reply || '')}
      </div>
    `;
    document.getElementById("simMessage").value = "";
  } catch (err) {
    resBox.innerHTML = `<span style="color:red">Lỗi mô phỏng: ${err}</span>`;
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
