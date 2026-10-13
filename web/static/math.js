/**
 * DINO MATH PROGRESS - Algebra & Geometry Lab
 * Interactive 2D Cartesian Coordinate System & Linear Function Visualizer
 * Inspired by BIM AI Progress UI & Pedagogical Interactive Systems
 */

(function () {
  'use strict';

  // State Management
  const state = {
    pointA: { x: 2, y: 1, name: 'A' },
    showProjections: true,
    showLine: true,
    showGrid: true,
    showAngle: false,
    snapToGrid: true,
    onlySegment: false, // true = chỉ nối từ (0,0) đến A
    scale: 50, // pixels per unit
    offsetX: 0, // canvas center offset
    offsetY: 0,
    theme: 'dark',
    isDragging: false,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    mouseCoord: { x: 0, y: 0 },
    animation: {
      isPlaying: false,
      progress: 1, // 0 to 1
      step: 5, // 0 to 5
      timer: null
    }
  };

  // DOM Elements
  const canvas = document.getElementById('graphCanvas');
  const ctx = canvas.getContext('2d');
  const container = document.getElementById('canvasContainer');

  // Input Elements
  const inputX = document.getElementById('coordX');
  const inputY = document.getElementById('coordY');
  const sliderX = document.getElementById('sliderX');
  const sliderY = document.getElementById('sliderY');
  const valBadgeX = document.getElementById('valBadgeX');
  const valBadgeY = document.getElementById('valBadgeY');

  // KPI Elements
  const kpiPointA = document.getElementById('kpiPointA');
  const kpiEquation = document.getElementById('kpiEquation');
  const kpiSlope = document.getElementById('kpiSlope');
  const kpiSlopeSub = document.getElementById('kpiSlopeSub');
  const cardSlope = document.getElementById('cardSlope');
  const kpiQuadrant = document.getElementById('kpiQuadrant');
  const kpiQuadrantSub = document.getElementById('kpiQuadrantSub');

  // Toggles & Line Mode
  const toggleProjections = document.getElementById('toggleProjections');
  const toggleLine = document.getElementById('toggleLine');
  const toggleSegmentOnly = document.getElementById('toggleSegmentOnly');
  const btnModeFull = document.getElementById('btnModeFull');
  const btnModeSegment = document.getElementById('btnModeSegment');
  const lineModeStatusBadge = document.getElementById('lineModeStatusBadge');
  const toggleGrid = document.getElementById('toggleGrid');
  const toggleAngle = document.getElementById('toggleAngle');
  const toggleSnap = document.getElementById('toggleSnap');

  // Overlays
  const mouseCoordOverlay = document.getElementById('mouseCoordOverlay');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const animProgressFill = document.getElementById('animProgressFill');
  const animStatusText = document.getElementById('animStatusText');

  // Fractions Helper
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  function toFractionString(numerator, denominator) {
    if (denominator === 0) return 'Không xác định';
    if (numerator === 0) return '0';
    const sign = (numerator * denominator < 0) ? '-' : '';
    let num = Math.abs(numerator);
    let den = Math.abs(denominator);

    // If both are decimals, multiply to integer
    while (!Number.isInteger(num) || !Number.isInteger(den)) {
      num *= 10;
      den *= 10;
    }
    num = Math.round(num);
    den = Math.round(den);

    const div = gcd(num, den);
    num /= div;
    den /= div;

    if (den === 1) return `${sign}${num}`;
    return `${sign}${num}/${den}`;
  }

  // Canvas Resize Handler
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);
    render();
  }

  // Coordinate Transformations
  function getCenter() {
    const rect = container.getBoundingClientRect();
    return {
      x: rect.width / 2 + state.offsetX,
      y: rect.height / 2 + state.offsetY
    };
  }

  function mathToScreen(x, y) {
    const center = getCenter();
    return {
      x: center.x + x * state.scale,
      y: center.y - y * state.scale
    };
  }

  function screenToMath(screenX, screenY) {
    const center = getCenter();
    return {
      x: (screenX - center.x) / state.scale,
      y: (center.y - screenY) / state.scale
    };
  }

  // Render Pipeline
  function render() {
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const center = getCenter();

    // Clear
    ctx.clearRect(0, 0, width, height);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(226, 214, 217, 0.08)' : 'rgba(78, 20, 32, 0.07)';
    const gridBoldColor = isDark ? 'rgba(226, 214, 217, 0.16)' : 'rgba(78, 20, 32, 0.14)';
    const axisColor = isDark ? '#FFFFFF' : '#1E070D';
    const textMuted = isDark ? '#A38C93' : '#795F65';

    // 1. Draw Grid
    if (state.showGrid) {
      ctx.lineWidth = 1;

      // Vertical grid lines
      const leftBound = -center.x / state.scale;
      const rightBound = (width - center.x) / state.scale;
      const startX = Math.floor(leftBound);
      const endX = Math.ceil(rightBound);

      for (let x = startX; x <= endX; x++) {
        if (x === 0) continue;
        const sx = center.x + x * state.scale;
        ctx.beginPath();
        ctx.strokeStyle = (x % 5 === 0) ? gridBoldColor : gridColor;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      const topBound = (center.y) / state.scale;
      const bottomBound = (center.y - height) / state.scale;
      const startY = Math.floor(bottomBound);
      const endY = Math.ceil(topBound);

      for (let y = startY; y <= endY; y++) {
        if (y === 0) continue;
        const sy = center.y - y * state.scale;
        ctx.beginPath();
        ctx.strokeStyle = (y % 5 === 0) ? gridBoldColor : gridColor;
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();
      }
    }

    // 2. Draw Axes (Ox and Oy)
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1.8;

    // X-Axis
    ctx.beginPath();
    ctx.moveTo(0, center.y);
    ctx.lineTo(width, center.y);
    ctx.stroke();

    // Arrow on X-Axis
    drawArrowHead(ctx, width - 8, center.y, width, center.y, axisColor);
    ctx.fillStyle = axisColor;
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText('x', width - 20, center.y + 22);

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(center.x, height);
    ctx.lineTo(center.x, 0);
    ctx.stroke();

    // Arrow on Y-Axis
    drawArrowHead(ctx, center.x, 8, center.x, 0, axisColor);
    ctx.fillText('y', center.x + 14, 18);

    // Origin Label "O"
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = axisColor;
    ctx.fillText('O', center.x - 16, center.y + 18);

    // 3. Draw Axis Ticks and Numbers (Just like in textbook image)
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tickSize = 5;

    // X Ticks
    const leftLimit = Math.floor(-center.x / state.scale);
    const rightLimit = Math.ceil((width - center.x) / state.scale);
    for (let x = leftLimit; x <= rightLimit; x++) {
      if (x === 0) continue;
      const sx = center.x + x * state.scale;
      // Tick mark
      ctx.beginPath();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1.2;
      ctx.moveTo(sx, center.y - tickSize);
      ctx.lineTo(sx, center.y + tickSize);
      ctx.stroke();

      // Number
      ctx.fillText(x.toString(), sx, center.y + 16);
    }

    // Y Ticks
    const bottomLimit = Math.floor((center.y - height) / state.scale);
    const topLimit = Math.ceil(center.y / state.scale);
    for (let y = bottomLimit; y <= topLimit; y++) {
      if (y === 0) continue;
      const sy = center.y - y * state.scale;
      // Tick mark
      ctx.beginPath();
      ctx.strokeStyle = axisColor;
      ctx.lineWidth = 1.2;
      ctx.moveTo(center.x - tickSize, sy);
      ctx.lineTo(center.x + tickSize, sy);
      ctx.stroke();

      // Number
      ctx.textAlign = 'right';
      ctx.fillText(y.toString(), center.x - 10, sy);
    }
    ctx.textAlign = 'center';

    const pt = state.pointA;
    const ptScreen = mathToScreen(pt.x, pt.y);
    const ptXAxis = mathToScreen(pt.x, 0);
    const ptYAxis = mathToScreen(0, pt.y);
    const originScreen = mathToScreen(0, 0);

    // 4. Draw Angle arc if enabled
    if (state.showAngle && (pt.x !== 0 || pt.y !== 0)) {
      const angleRad = Math.atan2(pt.y, pt.x);
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.lineWidth = 2;
      ctx.arc(originScreen.x, originScreen.y, 35, 0, -angleRad, angleRad < 0);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Projections (Dashed lines to axes)
    if (state.showProjections && state.animation.progress >= 0.4) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = '#EC4899';
      ctx.lineWidth = 1.6;

      // Vertical projection: from A to X-axis
      ctx.beginPath();
      ctx.moveTo(ptScreen.x, ptScreen.y);
      ctx.lineTo(ptXAxis.x, ptXAxis.y);
      ctx.stroke();

      // Horizontal projection: from A to Y-axis
      ctx.beginPath();
      ctx.moveTo(ptScreen.x, ptScreen.y);
      ctx.lineTo(ptYAxis.x, ptYAxis.y);
      ctx.stroke();

      ctx.restore();
    }

    // 6. Draw Line (Connecting 0,0 to A or Full Extended Line)
    if (state.showLine && state.animation.progress >= 0.7) {
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
      ctx.shadowBlur = 6;

      if (pt.x === 0 && pt.y === 0) {
        // Just origin point
      } else if (state.onlySegment) {
        // === CHỈ HIỆN ĐOẠN THẲNG NỐI TỪ GỐC O(0,0) ĐẾN ĐIỂM A ===
        const pOrigin = mathToScreen(0, 0);
        const pTarget = mathToScreen(pt.x, pt.y);

        ctx.beginPath();
        ctx.moveTo(pOrigin.x, pOrigin.y);
        ctx.lineTo(pTarget.x, pTarget.y);
        ctx.stroke();

        // Điểm nhấn tại Gốc tọa độ O(0,0)
        ctx.save();
        ctx.beginPath();
        ctx.arc(pOrigin.x, pOrigin.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
        ctx.restore();

        // Nhãn độ dài đoạn thẳng OA đặt ở giữa đoạn
        const midX = (pOrigin.x + pTarget.x) / 2;
        const midY = (pOrigin.y + pTarget.y) / 2;
        const dx = pTarget.x - pOrigin.x;
        const dy = pTarget.y - pOrigin.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const labelX = midX + nx * 16;
        const labelY = midY + ny * 16;

        ctx.save();
        ctx.font = 'bold 12.5px var(--font-mono)';
        ctx.fillStyle = '#38BDF8';
        ctx.textAlign = 'center';
        const dist = Math.hypot(pt.x, pt.y).toFixed(2);
        ctx.fillText(`OA = ${dist}`, labelX, labelY);
        ctx.restore();
      } else if (pt.x === 0) {
        // Đường thẳng đứng x = 0 (Trục Oy)
        ctx.beginPath();
        ctx.moveTo(center.x, 0);
        ctx.lineTo(center.x, height);
        ctx.stroke();
      } else {
        // Đường thẳng kéo dài toàn màn hình y = a * x
        const a = pt.y / pt.x;
        const xMinMath = -center.x / state.scale;
        const xMaxMath = (width - center.x) / state.scale;

        const p1 = mathToScreen(xMinMath, a * xMinMath);
        const p2 = mathToScreen(xMaxMath, a * xMaxMath);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Equation label on the line
        const labelX = (pt.x >= 0) ? Math.min(width - 80, ptScreen.x + 35) : Math.max(80, ptScreen.x - 35);
        const labelMathX = screenToMath(labelX, 0).x;
        const labelY = mathToScreen(0, a * labelMathX).y;

        ctx.save();
        ctx.font = 'bold 13px var(--font-mono)';
        ctx.fillStyle = '#38BDF8';
        const fracA = toFractionString(pt.y, pt.x);
        const eqStr = (fracA === '1') ? 'y = x' : (fracA === '-1') ? 'y = -x' : (fracA === '0') ? 'y = 0' : `y = ${fracA}x`;
        ctx.fillText(eqStr, labelX, labelY - 14);
        ctx.restore();
      }
      ctx.restore();
    }

    // 7. Draw Point A
    if (state.animation.progress >= 0.6) {
      ctx.save();
      // Outer Glow
      ctx.beginPath();
      ctx.arc(ptScreen.x, ptScreen.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fill();

      // Main Point
      ctx.beginPath();
      ctx.arc(ptScreen.x, ptScreen.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Point Label "A" (with offset)
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      const labelOffsetX = (pt.x >= 0) ? 14 : -22;
      const labelOffsetY = (pt.y >= 0) ? 16 : -10;
      ctx.fillText(pt.name, ptScreen.x + labelOffsetX, ptScreen.y + labelOffsetY);
      ctx.restore();
    }
  }

  function drawArrowHead(context, fromX, fromY, toX, toY, color) {
    const headLength = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    context.save();
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    context.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    context.closePath();
    context.fill();
    context.stroke();
    context.restore();
  }

  // Update State & UI
  function updatePoint(x, y, updateInputs = true) {
    if (state.snapToGrid) {
      x = Math.round(x * 2) / 2; // snap to 0.5 steps
      y = Math.round(y * 2) / 2;
    } else {
      x = Math.round(x * 100) / 100;
      y = Math.round(y * 100) / 100;
    }

    state.pointA.x = x;
    state.pointA.y = y;

    if (updateInputs) {
      inputX.value = x;
      inputY.value = y;
      sliderX.value = x;
      sliderY.value = y;
      valBadgeX.textContent = x;
      valBadgeY.textContent = y;
    }

    updateKPIsAndPedagogy();
    render();
  }

  function updateKPIsAndPedagogy() {
    const x = state.pointA.x;
    const y = state.pointA.y;

    // 1. Point KPI
    kpiPointA.textContent = `A(${x}, ${y})`;

    // 2. Equation & Slope
    let eqText = '';
    let slopeText = '';
    let fracA = '';
    let slopeNature = '';
    let isPositive = false;
    let isNegative = false;

    if (x === 0 && y === 0) {
      eqText = 'Gốc O(0, 0)';
      slopeText = 'Tùy ý';
      slopeNature = 'Điểm gốc (0,0)';
    } else if (x === 0) {
      eqText = 'x = 0 (Trục Oy)';
      slopeText = '∞ (Thẳng đứng)';
      slopeNature = 'Trục thẳng đứng';
    } else {
      const a = y / x;
      fracA = toFractionString(y, x);
      if (fracA === '1') eqText = 'y = x';
      else if (fracA === '-1') eqText = 'y = -x';
      else if (fracA === '0') eqText = 'y = 0';
      else eqText = `y = ${fracA}x`;

      const roundedA = Math.round(a * 100) / 100;
      slopeText = `${fracA} (${roundedA})`;

      if (a > 0) {
        slopeNature = 'Đồng biến (dốc lên)';
        isPositive = true;
      } else if (a < 0) {
        slopeNature = 'Nghịch biến (dốc xuống)';
        isNegative = true;
      } else {
        slopeNature = 'Hàm hằng (nằm ngang)';
      }
    }
    kpiEquation.textContent = eqText;
    kpiSlope.textContent = slopeText;

    if (kpiSlopeSub) {
      kpiSlopeSub.textContent = slopeNature;
      if (isPositive) {
        kpiSlopeSub.style.color = '#10B981';
      } else if (isNegative) {
        kpiSlopeSub.style.color = '#EF4444';
      } else {
        kpiSlopeSub.style.color = 'var(--text-muted)';
      }
    }

    if (cardSlope) {
      cardSlope.classList.toggle('slope-positive', isPositive);
      cardSlope.classList.toggle('slope-negative', isNegative);
    }

    // 3. Quadrant
    let quad = '';
    let quadSub = '';
    if (x === 0 && y === 0) {
      quad = 'Gốc O';
      quadSub = 'x = 0, y = 0';
    } else if (x === 0) {
      quad = 'Trục Oy';
      quadSub = `x = 0, y = ${y}`;
    } else if (y === 0) {
      quad = 'Trục Ox';
      quadSub = `x = ${x}, y = 0`;
    } else if (x > 0 && y > 0) {
      quad = 'Phần tư I (+, +)';
      quadSub = 'x > 0, y > 0';
    } else if (x < 0 && y > 0) {
      quad = 'Phần tư II (-, +)';
      quadSub = 'x < 0, y > 0';
    } else if (x < 0 && y < 0) {
      quad = 'Phần tư III (-, -)';
      quadSub = 'x < 0, y < 0';
    } else {
      quad = 'Phần tư IV (+, -)';
      quadSub = 'x > 0, y < 0';
    }
    kpiQuadrant.textContent = quad;
    if (kpiQuadrantSub) {
      kpiQuadrantSub.textContent = quadSub;
    }

    // 4. Update Pedagogical Steps
    const dist = Math.sqrt(x * x + y * y).toFixed(2);
    let angleDeg = 0;
    if (x !== 0 || y !== 0) {
      angleDeg = ((Math.atan2(y, x) * 180) / Math.PI).toFixed(1);
    }

    const step1El = document.getElementById('pedagogyStep1');
    const step2El = document.getElementById('pedagogyStep2');
    const step3El = document.getElementById('pedagogyStep3');
    const step4El = document.getElementById('pedagogyStep4');

    if (step1El) {
      step1El.innerHTML = `
        <div class="guide-step-title">📍 Bước 1: Tìm hoành độ X = ${x} trên trục Ox</div>
        <div class="guide-step-body">
          Từ gốc tọa độ <b>O(0,0)</b>, ${x >= 0 ? `tiến sang bên phải` : `lùi sang bên trái`} đúng <b>${Math.abs(x)}</b> đơn vị trên trục nằm ngang <b>Ox</b>.
        </div>
      `;
    }

    if (step2El) {
      step2El.innerHTML = `
        <div class="guide-step-title">📍 Bước 2: Tìm tung độ Y = ${y} trên trục Oy</div>
        <div class="guide-step-body">
          Từ gốc tọa độ <b>O(0,0)</b>, ${y >= 0 ? `đi lên phía trên` : `đi xuống phía dưới`} đúng <b>${Math.abs(y)}</b> đơn vị trên trục thẳng đứng <b>Oy</b>.
        </div>
      `;
    }

    if (step3El) {
      step3El.innerHTML = `
        <div class="guide-step-title">✂️ Bước 3: Dựng đường vuông góc nét đứt xác định điểm A</div>
        <div class="guide-step-body">
          Từ vạch <b>${x}</b> trên trục <b>Ox</b> kẻ đường thẳng đứng, từ vạch <b>${y}</b> trên trục <b>Oy</b> kẻ đường nằm ngang. Giao điểm của hai đường nét đứt màu hồng chính là vị trí điểm <b>A(${x}, ${y})</b>!
        </div>
      `;
    }

    if (step4El) {
      let functionAnalysis = '';
      if (state.onlySegment) {
        functionAnalysis = `
          <div class="guide-formula" style="color: #38BDF8; border-color: #38BDF8;">
            Độ dài đoạn thẳng OA: OA = √(${x}² + ${y}²) = <b>${dist}</b> đơn vị
          </div>
          <div>• Nằm trên đường thẳng: <b>${eqText}</b> (Hệ số góc a = ${fracA})</div>
          <div>• Điểm đầu: Gốc tọa độ <b>O(0,0)</b>; Điểm cuối: Điểm <b>A(${x}, ${y})</b></div>
          <div>• Góc nghiêng so với trục Ox: <b>α ≈ ${angleDeg}°</b></div>
        `;
        step4El.innerHTML = `
          <div class="guide-step-title">📏 Bước 4: Đoạn thẳng nối từ O(0,0) đến A(${x}, ${y})</div>
          <div class="guide-step-body">${functionAnalysis}</div>
        `;
      } else {
        if (x !== 0) {
          const a = y / x;
          const nature = a > 0 ? 'Đồng biến (dốc lên từ trái sang phải)' : (a < 0 ? 'Nghịch biến (dốc xuống từ trái sang phải)' : 'Hàm hằng (nằm ngang)');
          functionAnalysis = `
            <div class="guide-formula">Hàm số bậc nhất: ${eqText} (Hệ số góc a = ${fracA})</div>
            <div>• Tính chất: <b>${nature}</b></div>
            <div>• Khoảng cách từ gốc O đến A: <b>OA = √(${x}² + ${y}²) = ${dist}</b></div>
            <div>• Góc nghiêng so với trục Ox: <b>α ≈ ${angleDeg}°</b></div>
          `;
        } else {
          functionAnalysis = `<div>• Đường thẳng trùng hoặc song song với trục tung Oy.</div>`;
        }

        step4El.innerHTML = `
          <div class="guide-step-title">📐 Bước 4: Đồ thị hàm số đi qua gốc O(0,0) và A(${x}, ${y})</div>
          <div class="guide-step-body">${functionAnalysis}</div>
        `;
      }
    }
  }

  // Animation: "Dino Teacher Mode" (Vẽ từng bước cho bé Dino xem)
  function playPedagogicalAnimation() {
    if (state.animation.isPlaying) return;

    state.animation.isPlaying = true;
    state.animation.progress = 0;
    if (animStatusText) animStatusText.textContent = 'Đang vẽ đồ thị: Bước 1/4...';
    if (animProgressFill) animProgressFill.style.width = '0%';

    const steps = [
      { p: 0.25, msg: 'Bước 1: Chiếu hoành độ X trên trục Ox' },
      { p: 0.50, msg: 'Bước 2: Chiếu tung độ Y trên trục Oy' },
      { p: 0.75, msg: 'Bước 3: Giao điểm tạo thành A(x, y)' },
      { p: 1.00, msg: 'Bước 4: Vẽ đường thẳng đồ thị hàm số y = ax' }
    ];

    let current = 0;
    const interval = setInterval(() => {
      current += 0.04;
      state.animation.progress = Math.min(1, current);
      if (animProgressFill) animProgressFill.style.width = `${state.animation.progress * 100}%`;

      if (animStatusText) {
        for (let s of steps) {
          if (state.animation.progress <= s.p) {
            animStatusText.textContent = s.msg;
            break;
          }
        }
      }

      render();

      if (current >= 1) {
        clearInterval(interval);
        state.animation.isPlaying = false;
        if (animStatusText) animStatusText.textContent = 'Hoàn tất vẽ đồ thị!';
      }
    }, 40);
  }

  // Event Listeners for Controls
  function setupEventListeners() {
    // Window Resize
    window.addEventListener('resize', resizeCanvas);

    // Number Inputs
    inputX.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      updatePoint(val, state.pointA.y, false);
      sliderX.value = val;
      valBadgeX.textContent = val;
    });

    inputY.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value) || 0;
      updatePoint(state.pointA.x, val, false);
      sliderY.value = val;
      valBadgeY.textContent = val;
    });

    // Sliders
    sliderX.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      inputX.value = val;
      valBadgeX.textContent = val;
      updatePoint(val, state.pointA.y, false);
    });

    sliderY.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      inputY.value = val;
      valBadgeY.textContent = val;
      updatePoint(state.pointA.x, val, false);
    });

    // Toggles & Line Mode
    toggleProjections.addEventListener('change', (e) => {
      state.showProjections = e.target.checked;
      render();
    });

    toggleLine.addEventListener('change', (e) => {
      state.showLine = e.target.checked;
      render();
    });

    function setLineMode(onlySegment) {
      state.onlySegment = onlySegment;
      if (toggleSegmentOnly) toggleSegmentOnly.checked = onlySegment;
      if (btnModeFull) {
        btnModeFull.classList.toggle('active', !onlySegment);
      }
      if (btnModeSegment) {
        btnModeSegment.classList.toggle('active', onlySegment);
      }
      if (lineModeStatusBadge) {
        lineModeStatusBadge.textContent = onlySegment ? 'Đoạn thẳng OA' : 'Toàn màn hình';
        lineModeStatusBadge.style.color = onlySegment ? '#38BDF8' : '#A38C93';
      }
      updateKPIsAndPedagogy();
      render();
    }

    if (btnModeFull) {
      btnModeFull.addEventListener('click', () => setLineMode(false));
    }
    if (btnModeSegment) {
      btnModeSegment.addEventListener('click', () => setLineMode(true));
    }
    if (toggleSegmentOnly) {
      toggleSegmentOnly.addEventListener('change', (e) => setLineMode(e.target.checked));
    }

    toggleGrid.addEventListener('change', (e) => {
      state.showGrid = e.target.checked;
      render();
    });

    toggleAngle.addEventListener('change', (e) => {
      state.showAngle = e.target.checked;
      render();
    });

    toggleSnap.addEventListener('change', (e) => {
      state.snapToGrid = e.target.checked;
    });

    // Mouse / Touch Canvas Interaction (Drag Point A or Click to Set)
    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.button === 1 || e.shiftKey) {
        // Middle button or Shift + Left click -> Pan
        state.isPanning = true;
        state.panStart = { x: mouseX - state.offsetX, y: mouseY - state.offsetY };
        canvas.style.cursor = 'grab';
        return;
      }

      const ptScreen = mathToScreen(state.pointA.x, state.pointA.y);
      const dist = Math.hypot(mouseX - ptScreen.x, mouseY - ptScreen.y);

      if (dist < 18) {
        state.isDragging = true;
        canvas.style.cursor = 'grabbing';
      } else {
        // Click to place
        const mathCoord = screenToMath(mouseX, mouseY);
        updatePoint(mathCoord.x, mathCoord.y, true);
        state.isDragging = true;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const viewLinear = document.getElementById('view-linear');
      if (viewLinear && viewLinear.style.display === 'none') return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height) {
        const math = screenToMath(mouseX, mouseY);
        state.mouseCoord = math;
        mouseCoordOverlay.textContent = `(x: ${math.x.toFixed(2)}, y: ${math.y.toFixed(2)})`;
      }

      if (state.isPanning) {
        state.offsetX = mouseX - state.panStart.x;
        state.offsetY = mouseY - state.panStart.y;
        render();
        return;
      }

      if (state.isDragging) {
        const mathCoord = screenToMath(mouseX, mouseY);
        updatePoint(mathCoord.x, mathCoord.y, true);
      } else {
        // Hover cursor effect
        const ptScreen = mathToScreen(state.pointA.x, state.pointA.y);
        const dist = Math.hypot(mouseX - ptScreen.x, mouseY - ptScreen.y);
        if (dist < 18) {
          canvas.style.cursor = 'grab';
        } else {
          canvas.style.cursor = 'crosshair';
        }
      }
    });

    window.addEventListener('mouseup', () => {
      state.isDragging = false;
      state.isPanning = false;
      canvas.style.cursor = 'crosshair';
    });

    // Zoom via Scroll
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      state.scale = Math.max(20, Math.min(140, state.scale * zoomFactor));
      render();
    }, { passive: false });

    // Preset buttons
    document.querySelectorAll('.preset-chip').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.preset-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const x = parseFloat(btn.dataset.x);
        const y = parseFloat(btn.dataset.y);
        updatePoint(x, y, true);
        playPedagogicalAnimation();
      });
    });

    // Toolbar Buttons
    document.getElementById('btnZoomIn').addEventListener('click', () => {
      state.scale = Math.min(140, state.scale * 1.2);
      render();
    });

    document.getElementById('btnZoomOut').addEventListener('click', () => {
      state.scale = Math.max(20, state.scale / 1.2);
      render();
    });

    document.getElementById('btnResetView').addEventListener('click', () => {
      state.scale = 50;
      state.offsetX = 0;
      state.offsetY = 0;
      render();
    });

    const btnPlayAnim = document.getElementById('btnPlayAnim');
    if (btnPlayAnim) {
      btnPlayAnim.addEventListener('click', () => {
        playPedagogicalAnimation();
      });
    }

    const btnExport = document.getElementById('btnExportPNG');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        exportGraphImage();
      });
    }

    // View Switcher Navigation
    const navLinear = document.getElementById('navLinear');
    const navFourier = document.getElementById('navFourier');
    const topicSelect = document.getElementById('topicSelect');

    if (navLinear) {
      navLinear.addEventListener('click', () => switchView('linear'));
    }
    if (navFourier) {
      navFourier.addEventListener('click', () => switchView('fourier'));
    }
    if (topicSelect) {
      topicSelect.addEventListener('change', (e) => {
        if (e.target.value === '4') {
          switchView('fourier');
        } else {
          switchView('linear');
          if (e.target.value === '2') {
            updatePoint(3, 3, true);
          } else if (e.target.value === '3') {
            updatePoint(-2, 4, true);
          }
        }
      });
    }

    // Theme Toggle
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const curTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const nextTheme = curTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        render();
      });
    }
  }

  // Switch Subview (Linear Oxy vs Fourier Epicycles)
  function switchView(viewName) {
    const viewLinear = document.getElementById('view-linear');
    const viewFourier = document.getElementById('view-fourier');
    const navLinear = document.getElementById('navLinear');
    const navFourier = document.getElementById('navFourier');
    const topicSelect = document.getElementById('topicSelect');

    if (viewName === 'fourier') {
      if (viewLinear) viewLinear.style.display = 'none';
      if (viewFourier) viewFourier.style.display = 'flex';
      if (navLinear) navLinear.classList.remove('active');
      if (navFourier) navFourier.classList.add('active');
      if (topicSelect) topicSelect.value = '4';
      if (window.DinoFourier && window.DinoFourier.resize) {
        window.DinoFourier.resize();
      }
    } else {
      if (viewLinear) viewLinear.style.display = 'flex';
      if (viewFourier) viewFourier.style.display = 'none';
      if (navLinear) navLinear.classList.add('active');
      if (navFourier) navFourier.classList.remove('active');
      if (topicSelect && topicSelect.value === '4') {
        topicSelect.value = '1';
      }
      resizeCanvas();
      render();
    }
  }

  // Export Canvas Image (PNG)
  function exportGraphImage() {
    const viewFourier = document.getElementById('view-fourier');
    if (viewFourier && viewFourier.style.display !== 'none') {
      const fCanvas = document.getElementById('fourierCanvas');
      if (fCanvas) {
        const link = document.createElement('a');
        link.download = `dino_math_chuoi_fourier_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = fCanvas.toDataURL('image/png');
        link.click();
        return;
      }
    }
    const link = document.createElement('a');
    link.download = `dino_math_do_thi_A_${state.pointA.x}_${state.pointA.y}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Initialize
  function init() {
    resizeCanvas();
    setupEventListeners();
    const initX = parseFloat(inputX ? inputX.value : -7);
    const initY = parseFloat(inputY ? inputY.value : 3);
    updatePoint(isNaN(initX) ? -7 : initX, isNaN(initY) ? 3 : initY, true);

    // Auto-select view based on URL params or hash
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('topic') === '4' || window.location.hash === '#fourier' || window.location.hash === '#view-fourier') {
      switchView('fourier');
    } else {
      switchView('linear');
    }
  }

  // Expose to window for testing
  window.DinoMath = {
    state,
    updatePoint,
    playPedagogicalAnimation,
    switchView,
    resize: resizeCanvas,
    render,
    reset: () => updatePoint(2, 1, true)
  };

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
