/**
 * DINO MATH AI - Fourier Epicycles Lab
 * Interactive 2D Parametric Fourier Series Simulation
 * 
 * Equations:
 * x(t) = a0 + \sum_{k=1}^N ( a_k * cos(kt) + b_k * sin(kt) )
 * y(t) = c0 + \sum_{k=1}^N ( c_k * cos(kt) + d_k * sin(kt) )
 */

(function () {
  'use strict';

  // Fourier State
  const fState = {
    shape: 'dino', // 'dino', 'heart', 'star', 'butterfly', 'infinity', 'draw'
    N: 25, // Number of harmonics
    speed: 1.0,
    t: 0,
    isPlaying: true,
    showEpicycles: true,
    showArms: true,
    showTrace: true,
    showAxes: true,
    scale: 18, // pixels per unit
    offsetX: 0,
    offsetY: 0,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    
    // User drawing state
    isUserDrawing: false,
    userRawPoints: [],

    // Fourier Coefficients
    a0: 0,
    c0: 0,
    harmonics: [], // array of { k, ak, bk, ck, dk, Rk }
    
    // History path
    trail: []
  };

  // Pre-calculated Shape Generator Functions
  function generateDinoPoints(count = 150) {
    const raw = [
      [0, 10], [2, 11], [5, 11], [7, 10], [8, 8], [7, 6], [5, 5],
      [3, 4], [2, 2], [2, 0],
      [4, 0], [5, -1], [4, -1], [2, -1],
      [2, -3], [1, -5],
      [2, -6], [3, -9], [5, -9], [2, -9.5], [1, -9.5], [0, -7],
      [-1, -6], [-2, -6], [-2.5, -9], [-1.5, -9.5], [-3, -9.5], [-4, -7],
      [-4, -5], [-6, -4], [-9, -3], [-12, -1], [-14, 0],
      [-16, 2], [-13, 2], [-10, 3], [-7, 4], [-4, 5],
      [-2, 6], [-1, 7], [0, 9]
    ];
    return resamplePolygon(raw, count);
  }

  function generateHeartPoints(count = 150) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = (2 * Math.PI * i) / count;
      const x = 16 * Math.pow(Math.sin(u), 3);
      const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
      pts.push([x * 0.7, y * 0.7]);
    }
    return pts;
  }

  function generateStarPoints(count = 150) {
    const raw = [];
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = (i % 2 === 0) ? 12 : 5;
      raw.push([r * Math.cos(angle), -r * Math.sin(angle)]);
    }
    return resamplePolygon(raw, count);
  }

  function generateButterflyPoints(count = 150) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = (2 * Math.PI * i) / count;
      const r = Math.exp(Math.cos(u)) - 2 * Math.cos(4 * u) - Math.pow(Math.sin(u / 12), 5);
      const x = Math.sin(u) * r * 3.5;
      const y = Math.cos(u) * r * 3.5;
      pts.push([x, y]);
    }
    return pts;
  }

  function generateInfinityPoints(count = 150) {
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = (2 * Math.PI * i) / count;
      const denom = 1 + Math.pow(Math.sin(u), 2);
      const x = (14 * Math.cos(u)) / denom;
      const y = (14 * Math.sin(u) * Math.cos(u)) / denom;
      pts.push([x, y]);
    }
    return pts;
  }

  function resamplePolygon(verts, count) {
    const n = verts.length;
    const lengths = [0];
    for (let i = 0; i < n; i++) {
      const p1 = verts[i];
      const p2 = verts[(i + 1) % n];
      const d = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      lengths.push(lengths[lengths.length - 1] + d);
    }
    const totalLen = lengths[lengths.length - 1];
    const res = [];
    for (let s = 0; s < count; s++) {
      const target = (s * totalLen) / count;
      for (let i = 0; i < n; i++) {
        if (lengths[i] <= target && target <= lengths[i + 1]) {
          const frac = (target - lengths[i]) / (lengths[i + 1] - lengths[i] + 1e-9);
          const p1 = verts[i];
          const p2 = verts[(i + 1) % n];
          res.push([
            p1[0] + frac * (p2[0] - p1[0]),
            p1[1] + frac * (p2[1] - p1[1])
          ]);
          break;
        }
      }
    }
    return res;
  }

  // Discrete Fourier Transform (DFT) calculating exact (a_k, b_k, c_k, d_k)
  function computeFourierCoefficients(pts, maxHarmonics = 60) {
    const M = pts.length;
    if (M === 0) return;

    let sumX = 0, sumY = 0;
    for (let j = 0; j < M; j++) {
      sumX += pts[j][0];
      sumY += pts[j][1];
    }
    fState.a0 = sumX / M;
    fState.c0 = sumY / M;

    const list = [];
    const limit = Math.min(maxHarmonics, Math.floor(M / 2));

    for (let k = 1; k <= limit; k++) {
      let ak = 0, bk = 0, ck = 0, dk = 0;
      for (let j = 0; j < M; j++) {
        const phi = (2 * Math.PI * k * j) / M;
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);
        ak += pts[j][0] * cosP;
        bk += pts[j][0] * sinP;
        ck += pts[j][1] * cosP;
        dk += pts[j][1] * sinP;
      }
      ak = (2 / M) * ak;
      bk = (2 / M) * bk;
      ck = (2 / M) * ck;
      dk = (2 / M) * dk;

      const Rk = Math.sqrt((ak * ak + bk * bk + ck * ck + dk * dk) / 2);
      list.push({ k, ak, bk, ck, dk, Rk });
    }

    fState.harmonics = list;
    fState.trail = [];
    fState.t = 0;
    updateCoefficientsTable();
  }

  // Update Coefficients Table in DOM
  function updateCoefficientsTable() {
    const tbody = document.getElementById('fourierCoeffsTableBody');
    if (!tbody) return;

    const topItems = fState.harmonics.slice(0, Math.min(fState.N, 15));
    if (topItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Chưa có dữ liệu hệ số.</td></tr>';
      return;
    }

    tbody.innerHTML = topItems.map(item => `
      <tr>
        <td style="font-weight:700; color:#CBD5E1;">${item.k}</td>
        <td style="color:#7DD3FC;">${item.ak.toFixed(2)}</td>
        <td style="color:#7DD3FC;">${item.bk.toFixed(2)}</td>
        <td style="color:#FCD34D;">${item.ck.toFixed(2)}</td>
        <td style="color:#FCD34D;">${item.dk.toFixed(2)}</td>
        <td style="color:#10B981; font-weight:700;">${item.Rk.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  // Load Shape
  function loadShape(shapeName) {
    fState.shape = shapeName;
    const drawGuide = document.getElementById('drawGuideBox');
    const btnClear = document.getElementById('btnFourierClear');

    if (shapeName === 'draw') {
      if (drawGuide) drawGuide.style.display = 'flex';
      if (btnClear) btnClear.style.display = 'inline-flex';
      document.getElementById('kpiFourierShape').textContent = 'Tự Vẽ Bằng Tay ✏️';
      document.getElementById('fourierHintText').textContent = 'Dùng chuột hoặc ngón tay vẽ một nét lên bảng bên phải!';
      fState.harmonics = [];
      fState.trail = [];
      updateCoefficientsTable();
      return;
    }

    if (drawGuide) drawGuide.style.display = 'none';
    if (btnClear) btnClear.style.display = 'none';

    let pts = [];
    let title = 'Khủng Long Dino 🦖';
    let hint = 'Mỗi vòng tròn xoay nối tiếp nhau đưa đầu bút vẽ nên hình chú khủng long Dino!';

    if (shapeName === 'dino') {
      pts = generateDinoPoints(160);
      fState.scale = 18;
      fState.offsetX = 0;
      fState.offsetY = 0;
    } else if (shapeName === 'heart') {
      pts = generateHeartPoints(160);
      title = 'Trái Tim Yêu Thương ❤️';
      hint = 'Hệ phương trình lượng giác vẽ trái tim tròn trịa tuyệt đẹp!';
      fState.scale = 18;
      fState.offsetX = 0;
      fState.offsetY = 0;
    } else if (shapeName === 'star') {
      pts = generateStarPoints(160);
      title = 'Ngôi Sao 5 Cánh ⭐';
      hint = 'Chuỗi Fourier tạo nên 5 đỉnh nhọn đối xứng hoàn hảo!';
      fState.scale = 16;
      fState.offsetX = 0;
      fState.offsetY = 0;
    } else if (shapeName === 'butterfly') {
      pts = generateButterflyPoints(160);
      title = 'Cánh Bướm Kỳ Diệu 🦋';
      hint = 'Đường cong cánh bướm siêu thực được vẽ bằng tổng sóng sin, cos!';
      fState.scale = 16;
      fState.offsetX = 0;
      fState.offsetY = 0;
    } else if (shapeName === 'infinity') {
      pts = generateInfinityPoints(160);
      title = 'Đường Vô Cực ♾️';
      hint = 'Đường Lemniscate vô cực vẽ uốn lượn liên tục qua gốc toạ độ!';
      fState.scale = 18;
      fState.offsetX = 0;
      fState.offsetY = 0;
    }

    document.getElementById('kpiFourierShape').textContent = title;
    document.getElementById('fourierHintText').textContent = hint;

    computeFourierCoefficients(pts, 60);
  }

  // DOM Canvas & Setup
  const canvas = document.getElementById('fourierCanvas');
  const container = document.getElementById('fourierCanvasContainer');
  let ctx = null;

  function resizeCanvas() {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
  }


  function getCenter() {
    const rect = container.getBoundingClientRect();
    return {
      x: rect.width / 2 + fState.offsetX,
      y: rect.height / 2 + fState.offsetY
    };
  }

  function mathToScreen(x, y) {
    const center = getCenter();
    return {
      x: center.x + x * fState.scale,
      y: center.y - y * fState.scale // Y points upwards in math
    };
  }

  function screenToMath(screenX, screenY) {
    const center = getCenter();
    return {
      x: (screenX - center.x) / fState.scale,
      y: (center.y - screenY) / fState.scale
    };
  }

  // Main Render Loop
  function renderFrame() {
    // Only render if view is visible
    const view = document.getElementById('view-fourier');
    if (!view || view.style.display === 'none') {
      requestAnimationFrame(renderFrame);
      return;
    }

    if (!container || !canvas) {
      requestAnimationFrame(renderFrame);
      return;
    }

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      requestAnimationFrame(renderFrame);
      return;
    }

    if (!ctx || canvas.width === 0) {
      resizeCanvas();
    }
    if (!ctx) {
      requestAnimationFrame(renderFrame);
      return;
    }

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw coordinate axes
    if (fState.showAxes) {
      drawAxes(rect);
    }

    // Freehand drawing mode live stroke
    if (fState.isUserDrawing && fState.userRawPoints.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const p0 = mathToScreen(fState.userRawPoints[0][0], fState.userRawPoints[0][1]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < fState.userRawPoints.length; i++) {
        const p = mathToScreen(fState.userRawPoints[i][0], fState.userRawPoints[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // Fourier simulation
    if (fState.harmonics.length > 0) {
      let currentX = fState.a0;
      let currentY = fState.c0;
      const count = Math.min(fState.N, fState.harmonics.length);

      // Draw Epicycles
      for (let i = 0; i < count; i++) {
        const h = fState.harmonics[i];
        const prevScreen = mathToScreen(currentX, currentY);

        // Term calculations: x_k(t) = ak*cos(kt) + bk*sin(kt)
        const kt = h.k * fState.t;
        const deltaX = h.ak * Math.cos(kt) + h.bk * Math.sin(kt);
        const deltaY = h.ck * Math.cos(kt) + h.dk * Math.sin(kt);

        currentX += deltaX;
        currentY += deltaY;

        const nextScreen = mathToScreen(currentX, currentY);
        const radiusScreen = h.Rk * fState.scale;

        // Draw Circle
        if (fState.showEpicycles && radiusScreen > 1) {
          ctx.beginPath();
          ctx.arc(prevScreen.x, prevScreen.y, radiusScreen, 0, 2 * Math.PI);
          ctx.strokeStyle = i === 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw Arm Vector
        if (fState.showArms) {
          ctx.beginPath();
          ctx.moveTo(prevScreen.x, prevScreen.y);
          ctx.lineTo(nextScreen.x, nextScreen.y);
          ctx.strokeStyle = i === 0 ? '#38BDF8' : 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = i === 0 ? 2 : 1;
          ctx.stroke();

          // Small tip dot
          ctx.beginPath();
          ctx.arc(nextScreen.x, nextScreen.y, 2, 0, 2 * Math.PI);
          ctx.fillStyle = '#38BDF8';
          ctx.fill();
        }
      }

      // Final Pen tip
      const finalScreen = mathToScreen(currentX, currentY);

      // Record to trail
      if (fState.isPlaying) {
        fState.trail.push([currentX, currentY]);
        if (fState.trail.length > 500) {
          fState.trail.shift();
        }
      }

      // Draw Trace Path
      if (fState.showTrace && fState.trail.length > 1) {
        ctx.beginPath();
        const start = mathToScreen(fState.trail[0][0], fState.trail[0][1]);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < fState.trail.length; i++) {
          const pt = mathToScreen(fState.trail[i][0], fState.trail[i][1]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Glowing Pen Tip
      ctx.beginPath();
      ctx.arc(finalScreen.x, finalScreen.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#10B981';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Update Overlays
      const overlay = document.getElementById('fourierPointOverlay');
      if (overlay) {
        overlay.textContent = `(x: ${currentX.toFixed(2)}, y: ${currentY.toFixed(2)})`;
      }
      const kpiT = document.getElementById('kpiFourierT');
      if (kpiT) {
        kpiT.textContent = `${fState.t.toFixed(2)} rad`;
      }
      const kpiProg = document.getElementById('kpiFourierProgress');
      if (kpiProg) {
        const percent = Math.round((fState.t / (2 * Math.PI)) * 100);
        kpiProg.textContent = `${percent}% chu kỳ 2π`;
      }

      // Advance Time
      if (fState.isPlaying) {
        const dt = (2 * Math.PI) / (300 / fState.speed);
        fState.t += dt;
        if (fState.t > 2 * Math.PI) {
          fState.t = 0;
          fState.trail = []; // reset trail to re-draw loop seamlessly
        }
      }
    }

    requestAnimationFrame(renderFrame);
  }

  function drawAxes(rect) {
    const center = getCenter();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1;

    // X axis
    ctx.beginPath();
    ctx.moveTo(0, center.y);
    ctx.lineTo(rect.width, center.y);
    ctx.stroke();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(center.x, 0);
    ctx.lineTo(center.x, rect.height);
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('x', rect.width - 15, center.y - 6);
    ctx.fillText('y', center.x + 8, 16);
    ctx.fillText('O', center.x - 14, center.y + 14);
  }

  // Event Listeners
  function setupEvents() {
    window.addEventListener('resize', resizeCanvas);

    // Shape chips
    document.querySelectorAll('.fourier-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.fourier-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const shape = chip.getAttribute('data-shape');
        loadShape(shape);
      });
    });

    // Slider N
    const sliderN = document.getElementById('sliderFourierN');
    const badgeN = document.getElementById('valBadgeN');
    const kpiN = document.getElementById('kpiFourierN');

    function updateN(val) {
      val = Math.max(1, Math.min(60, parseInt(val, 10)));
      fState.N = val;
      if (sliderN) sliderN.value = val;
      if (badgeN) badgeN.textContent = val;
      if (kpiN) kpiN.textContent = val;
      fState.trail = [];
      updateCoefficientsTable();
    }

    if (sliderN) {
      sliderN.addEventListener('input', (e) => updateN(e.target.value));
    }

    // Stepper buttons for N
    const btnN1 = document.getElementById('btnN1');
    if (btnN1) btnN1.addEventListener('click', () => updateN(1));
    const btnN10 = document.getElementById('btnN10');
    if (btnN10) btnN10.addEventListener('click', () => updateN(10));
    const btnNMax = document.getElementById('btnNMax');
    if (btnNMax) btnNMax.addEventListener('click', () => updateN(50));
    const btnNMinus5 = document.getElementById('btnNMinus5');
    if (btnNMinus5) btnNMinus5.addEventListener('click', () => updateN(fState.N - 5));
    const btnNPlus5 = document.getElementById('btnNPlus5');
    if (btnNPlus5) btnNPlus5.addEventListener('click', () => updateN(fState.N + 5));

    // Slider Speed
    const sliderSpeed = document.getElementById('sliderFourierSpeed');
    const badgeSpeed = document.getElementById('valBadgeSpeed');
    if (sliderSpeed) {
      sliderSpeed.addEventListener('input', (e) => {
        fState.speed = parseFloat(e.target.value);
        if (badgeSpeed) badgeSpeed.textContent = `${fState.speed.toFixed(1)}x`;
      });
    }

    // Play / Pause
    const btnPlay = document.getElementById('btnFourierPlayPause');
    const iconPlay = document.getElementById('fourierPlayIcon');
    const textPlay = document.getElementById('fourierPlayText');
    const statusKpi = document.getElementById('kpiFourierStatus');

    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        fState.isPlaying = !fState.isPlaying;
        if (iconPlay) iconPlay.textContent = fState.isPlaying ? '⏸' : '▶';
        if (textPlay) textPlay.textContent = fState.isPlaying ? 'Tạm Dừng' : 'Tiếp Tục';
        if (statusKpi) {
          statusKpi.textContent = fState.isPlaying ? 'Đang vẽ...' : 'Tạm dừng';
          statusKpi.style.color = fState.isPlaying ? '#10B981' : '#F59E0B';
        }
      });
    }

    // Reset button
    const btnReset = document.getElementById('btnFourierReset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        fState.t = 0;
        fState.trail = [];
      });
    }

    // Clear button (for draw mode)
    const btnClear = document.getElementById('btnFourierClear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        fState.userRawPoints = [];
        fState.harmonics = [];
        fState.trail = [];
        fState.t = 0;
        updateCoefficientsTable();
      });
    }

    // Toggles
    const toggleEpi = document.getElementById('toggleEpicycles');
    if (toggleEpi) toggleEpi.addEventListener('change', (e) => fState.showEpicycles = e.target.checked);

    const toggleArms = document.getElementById('toggleArms');
    if (toggleArms) toggleArms.addEventListener('change', (e) => fState.showArms = e.target.checked);

    const toggleTrace = document.getElementById('toggleTrace');
    if (toggleTrace) toggleTrace.addEventListener('change', (e) => fState.showTrace = e.target.checked);

    const toggleAxes = document.getElementById('toggleFourierAxes');
    if (toggleAxes) toggleAxes.addEventListener('change', (e) => fState.showAxes = e.target.checked);

    // Zoom & Reset Toolbar
    document.getElementById('btnFourierZoomIn')?.addEventListener('click', () => {
      fState.scale = Math.min(60, fState.scale * 1.25);
    });
    document.getElementById('btnFourierZoomOut')?.addEventListener('click', () => {
      fState.scale = Math.max(5, fState.scale / 1.25);
    });
    document.getElementById('btnFourierResetView')?.addEventListener('click', () => {
      fState.scale = 18;
      fState.offsetX = 0;
      fState.offsetY = 0;
    });

    // Mouse & Touch events on canvas
    if (canvas) {
      canvas.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          const t = e.touches[0];
          onPointerDown({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() });
        }
      }, { passive: false });

      window.addEventListener('touchmove', (e) => {
        if (fState.isUserDrawing && e.touches.length === 1) {
          const t = e.touches[0];
          onPointerMove({ clientX: t.clientX, clientY: t.clientY });
        }
      });

      window.addEventListener('touchend', onPointerUp);
    }
  }

  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (fState.shape === 'draw') {
      fState.isUserDrawing = true;
      fState.userRawPoints = [];
      const mathPt = screenToMath(mouseX, mouseY);
      fState.userRawPoints.push([mathPt.x, mathPt.y]);
      return;
    }

    // Otherwise pan
    fState.isPanning = true;
    fState.panStart = { x: e.clientX - fState.offsetX, y: e.clientY - fState.offsetY };
  }

  function onPointerMove(e) {
    if (fState.isUserDrawing) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const mathPt = screenToMath(mouseX, mouseY);
      fState.userRawPoints.push([mathPt.x, mathPt.y]);
      return;
    }

    if (fState.isPanning) {
      fState.offsetX = e.clientX - fState.panStart.x;
      fState.offsetY = e.clientY - fState.panStart.y;
    }
  }

  function onPointerUp() {
    if (fState.isUserDrawing) {
      fState.isUserDrawing = false;
      if (fState.userRawPoints.length > 10) {
        const smooth = resamplePolygon(fState.userRawPoints, 160);
        computeFourierCoefficients(smooth, 60);
      }
      return;
    }
    fState.isPanning = false;
  }

  // Initialize
  function initFourier() {
    resizeCanvas();
    setupEvents();
    loadShape('dino');
    requestAnimationFrame(renderFrame);
  }

  // Expose
  window.DinoFourier = {
    state: fState,
    loadShape,
    resize: resizeCanvas
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFourier);
  } else {
    initFourier();
  }
})();
