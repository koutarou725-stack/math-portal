// ==========================================
// // SVG動的作図エンジン (関数 & 図形)

function generateLinearSvg(a, b, showPoints = true, showLine = true, width = 240, height = 240) {
  const halfW = width / 2;
  const halfH = height / 2;
  const range = 5;
  const step = (width - 30) / (range * 2);

  let gridLines = '';
  for (let i = -range; i <= range; i++) {
    const x = halfW + i * step;
    const y = halfH - i * step;
    gridLines += `<line x1="${x}" y1="15" x2="${x}" y2="${height - 15}" stroke="#e2e8f0" stroke-width="1" />`;
    gridLines += `<line x1="15" y1="${y}" x2="${width - 15}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />`;
  }

  const axisLines = `
    <line x1="10" y1="${halfH}" x2="${width - 10}" y2="${halfH}" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="${width - 12}" y="${halfH + 14}" font-size="11" font-family="serif" font-style="italic">x</text>
    <line x1="${halfW}" y1="${height - 10}" x2="${halfW}" y2="10" stroke="#000" stroke-width="1.5" marker-end="url(#arrow)" />
    <text x="${halfW - 14}" y="14" font-size="11" font-family="serif" font-style="italic">y</text>
    <text x="${halfW - 12}" y="${halfH + 12}" font-size="10" font-family="serif" font-style="italic">O</text>
  `;

  let lineSvg = '';
  if (showLine) {
    const xMin = -range;
    const xMax = range;
    const y1 = a * xMin + b;
    const y2 = a * xMax + b;
    const px1 = halfW + xMin * step;
    const py1 = halfH - y1 * step;
    const px2 = halfW + xMax * step;
    const py2 = halfH - y2 * step;

    lineSvg = `<line x1="${px1}" y1="${py1}" x2="${px2}" y2="${py2}" stroke="#2563eb" stroke-width="2" stroke-linecap="round" />`;
  }

  let pointsSvg = '';
  if (showPoints) {
    const interceptPx = halfW;
    const interceptPy = halfH - b * step;
    pointsSvg += `<circle cx="${interceptPx}" cy="${interceptPy}" r="3.5" fill="#dc2626" />`;
    pointsSvg += `<text x="${interceptPx + 5}" y="${interceptPy - 4}" font-size="10" fill="#dc2626" font-weight="bold">${b}</text>`;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#000"/>
        </marker>
      </defs>
      ${gridLines}
      ${axisLines}
      ${lineSvg}
      ${pointsSvg}
    </svg>
  `;
}

function renderLinearGraph() {
  const a = parseFloat(document.getElementById('funcA').value) || 1;
  const b = parseFloat(document.getElementById('funcB').value) || 0;
  const showPoints = document.getElementById('showPointsCheck').checked;
  const showLine = document.getElementById('showLineCheck').checked;

  state.linearFunc = { a, b, showPoints, showLine };

  const sign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  document.getElementById('linearEqPreview').textContent = `y = ${aStr}x ${sign}`;

  const container = document.getElementById('linearGraphContainer');
  if (container) {
    container.innerHTML = generateLinearSvg(a, b, showPoints, showLine, 260, 260);
  }
}

function randomizeLinear() {
  const aList = [-3, -2, -1, 1, 2, 3, 0.5, -0.5];
  const bList = [-3, -2, -1, 0, 1, 2, 3];
  const newA = aList[Math.floor(Math.random() * aList.length)];
  const newB = bList[Math.floor(Math.random() * bList.length)];

  document.getElementById('funcA').value = newA;
  document.getElementById('funcB').value = newB;
  renderLinearGraph();
}

function insertGraphToWorksheet() {
  const { a, b } = state.linearFunc;
  const sign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
  const aStr = a === 1 ? '' : a === -1 ? '-' : a;
  const formula = `y = ${aStr}x ${sign}`;

  addBlock('graph-block', {
    text: `右の図は、一次関数 <strong>${formula}</strong> のグラフである。<br>① 直線の傾きと切片をそれぞれ答えなさい。<br>② xの変域が -1 ≦ x ≦ 2 のときのyの変域を求めなさい。`,
    answer: `① 傾き: ${a} , 切片: ${b}　② ${Math.min(a*(-1)+b, a*2+b)} ≦ y ≦ ${Math.max(a*(-1)+b, a*2+b)}`,
    svgHtml: generateLinearSvg(a, b, true, true, 200, 200)
  });

  switchTab('worksheet');
}

function generateParallelChevronSvg(a1, a2, width = 240, height = 180) {
  const lY = 35;
  const mY = height - 35;
  const p1 = { x: 50, y: lY };
  const v = { x: 140, y: (lY + mY) / 2 };
  const p2 = { x: 60, y: mY };

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="${lY}" x2="${width - 20}" y2="${lY}" stroke="#000" stroke-width="2" />
      <text x="${width - 15}" y="${lY + 4}" font-size="12" font-style="italic">l</text>
      <line x1="20" y1="${mY}" x2="${width - 20}" y2="${mY}" stroke="#000" stroke-width="2" />
      <text x="${width - 15}" y="${mY + 4}" font-size="12" font-style="italic">m</text>
      <text x="25" y="${(lY + mY)/2}" font-size="11" fill="#666">l // m</text>
      <polyline points="${p1.x},${p1.y} ${v.x},${v.y} ${p2.x},${p2.y}" fill="none" stroke="#2563eb" stroke-width="2.5" />
      <circle cx="${v.x}" cy="${v.y}" r="3" fill="#2563eb" />
      <text x="${p1.x + 15}" y="${p1.y + 18}" font-size="12" font-weight="bold">${a1}°</text>
      <text x="${v.x - 28}" y="${v.y + 4}" font-size="13" font-weight="bold" fill="#dc2626">x</text>
      <text x="${p2.x + 15}" y="${p2.y - 8}" font-size="12" font-weight="bold">${a2}°</text>
    </svg>
  `;
}

function generateTriangleExteriorSvg(a1, a2, width = 240, height = 180) {
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,140 100,40 180,140" fill="none" stroke="#2563eb" stroke-width="2" />
      <line x1="180" y1="140" x2="230" y2="140" stroke="#2563eb" stroke-width="2" />
      <text x="${55}" y="132" font-size="12" font-weight="bold">${a1}°</text>
      <text x="96" y="65" font-size="12" font-weight="bold">${a2}°</text>
      <text x="188" y="130" font-size="14" font-weight="bold" fill="#dc2626">x</text>
    </svg>
  `;
}

function generateInscribedAngleSvg(a1, width = 240, height = 200) {
  const cx = width / 2;
  const cy = height / 2 + 10;
  const r = 70;
  
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#333" stroke-width="1.8" />
      <circle cx="${cx}" cy="${cy}" r="3" fill="#000" />
      <text x="${cx + 5}" y="${cy - 5}" font-size="11" font-style="italic">O</text>
      <polyline points="${cx - 50},${cy + 49} ${cx},${cy - 70} ${cx + 50},${cy + 49}" fill="none" stroke="#2563eb" stroke-width="2" />
      <polyline points="${cx - 50},${cy + 49} ${cx},${cy} ${cx + 50},${cy + 49}" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3" />
      <text x="${cx - 5}" y="${cy - 48}" font-size="14" font-weight="bold" fill="#dc2626">x</text>
      <text x="${cx - 10}" y="${cy + 25}" font-size="12" font-weight="bold">${a1 * 2}°</text>
    </svg>
  `;
}

function renderGeometryFig() {
  const pattern = document.getElementById('geometryPattern').value;
  const a1 = parseInt(document.getElementById('geoAngle1').value) || 45;
  const a2 = parseInt(document.getElementById('geoAngle2').value) || 35;
  const container = document.getElementById('geometryContainer');
  const ansDisplay = document.getElementById('geoAnswerDisplay');

  let answerText = '';
  let svg = '';

  if (pattern === 'parallel_chevron') {
    svg = generateParallelChevronSvg(a1, a2, 260, 200);
    answerText = `${a1 + a2}°`;
  } else if (pattern === 'triangle_exterior') {
    svg = generateTriangleExteriorSvg(a1, a2, 260, 200);
    answerText = `${a1 + a2}°`;
  } else if (pattern === 'inscribed_angle') {
    svg = generateInscribedAngleSvg(a1, 260, 200);
    answerText = `${a1}°`;
  }

  if (container) container.innerHTML = svg;
  if (ansDisplay) ansDisplay.textContent = answerText;
  state.geometry = { pattern, angle1: a1, angle2: a2, answer: answerText };
}

function insertGeometryToWorksheet() {
  const { pattern, angle1, angle2, answer } = state.geometry;
  let text = '';
  let svg = '';

  if (pattern === 'parallel_chevron') {
    text = `右の図で、直線 l // m であるとき、∠x の大きさを求めなさい。`;
    svg = generateParallelChevronSvg(angle1, angle2, 200, 150);
  } else if (pattern === 'triangle_exterior') {
    text = `右の図の三角形において、外角 ∠x の大きさを求めなさい。`;
    svg = generateTriangleExteriorSvg(angle1, angle2, 200, 150);
  } else if (pattern === 'inscribed_angle') {
    text = `右の図で、点Oを中心とする円において、円周角 ∠x の大きさを求めなさい。`;
    svg = generateInscribedAngleSvg(angle1, 200, 160);
  }

  addBlock('geometry-block', {
    text: text,
    answer: `∠x = ${answer}`,
    svgHtml: svg
  });

  switchTab('worksheet');
}

// ==========================================
// // 練習プリント専用 インライン図・表作図エンジン

// ==========================================
// // 1. 一次関数グラフ問題用 SVG (軸・格子点・直線をコンパクトに描画)
function generateLinearGraphProblemSvg(a, b, width = 190, height = 150) {
  const halfW = width / 2;
  const halfH = height / 2;
  const range = 5;
  const stepX = (width - 30) / (range * 2);
  const stepY = (height - 24) / (range * 2);

  let grid = '';
  for (let i = -range; i <= range; i++) {
    const x = halfW + i * stepX;
    const y = halfH - i * stepY;
    grid += `<line x1="${x}" y1="10" x2="${x}" y2="${height - 10}" stroke="#e2e8f0" stroke-width="1"/>`;
    grid += `<line x1="10" y1="${y}" x2="${width - 10}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
  }

  // 軸
  const axes = `
    <line x1="8" y1="${halfH}" x2="${width - 8}" y2="${halfH}" stroke="#334155" stroke-width="1.5"/>
    <text x="${width - 12}" y="${halfH + 13}" font-size="11" font-style="italic" font-family="serif">x</text>
    <line x1="${halfW}" y1="${height - 8}" x2="${halfW}" y2="8" stroke="#334155" stroke-width="1.5"/>
    <text x="${halfW - 13}" y="14" font-size="11" font-style="italic" font-family="serif">y</text>
    <text x="${halfW - 11}" y="${halfH + 12}" font-size="10" font-style="italic" font-family="serif">O</text>
  `;

  // 直線
  const x1 = -range, x2 = range;
  const y1 = a * x1 + b, y2 = a * x2 + b;
  const px1 = halfW + x1 * stepX, py1 = halfH - y1 * stepY;
  const px2 = halfW + x2 * stepX, py2 = halfH - y2 * stepY;
  const line = `<line x1="${px1}" y1="${py1}" x2="${px2}" y2="${py2}" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round"/>`;

  // 切片と整数通過点プロット
  const intPy = halfH - b * stepY;
  let points = `<circle cx="${halfW}" cy="${intPy}" r="3.2" fill="#dc2626"/>`;
  if (b !== 0) {
    points += `<text x="${halfW + 4}" y="${intPy - 3}" font-size="10" font-weight="bold" fill="#dc2626">${b}</text>`;
  }
  // もう1点 (x=1 or x=2)
  const xPt = (a > 0 ? 1 : (a < 0 ? -1 : 2));
  const yPt = a * xPt + b;
  if (Math.abs(yPt) <= range) {
    const ptX = halfW + xPt * stepX;
    const ptY = halfH - yPt * stepY;
    points += `<circle cx="${ptX}" cy="${ptY}" r="3" fill="#2563eb"/>`;
    points += `<text x="${ptX + 4}" y="${ptY - 3}" font-size="9" fill="#1e3a8a">(${xPt},${yPt})</text>`;
  }

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #cbd5e1;background:#fff;border-radius:4px;">${grid}${axes}${line}${points}</svg>`;
}

// 2. 相似な三角形 (ピラミッド型 DE // BC)
function generateSimilarityTriangleSvg(ad, db, ae, ec, de, bc, unknownVar = 'x', width = 180, height = 130) {
  const topX = width / 2, topY = 16;
  const leftX = 25, leftY = height - 16;
  const rightX = width - 25, rightY = height - 16;
  const ratio = ad / (ad + db);
  const midLeftX = topX + (leftX - topX) * ratio;
  const midLeftY = topY + (leftY - topY) * ratio;
  const midRightX = topX + (rightX - topX) * ratio;
  const midRightY = topY + (rightY - topY) * ratio;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;">
      <polygon points="${topX},${topY} ${leftX},${leftY} ${rightX},${rightY}" fill="none" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="${midLeftX}" y1="${midLeftY}" x2="${midRightX}" y2="${midRightY}" stroke="#2563eb" stroke-width="2"/>
      <!-- 平行マーク -->
      <polygon points="${(midLeftX+midRightX)/2 - 4},${midLeftY - 3} ${(midLeftX+midRightX)/2 + 2},${midLeftY} ${(midLeftX+midRightX)/2 - 4},${midLeftY + 3}" fill="#2563eb"/>
      <polygon points="${(leftX+rightX)/2 - 4},${leftY - 3} ${(leftX+rightX)/2 + 2},${leftY} ${(leftX+rightX)/2 - 4},${leftY + 3}" fill="#1e293b"/>
      <!-- 頂点ラベル -->
      <text x="${topX - 4}" y="${topY - 4}" font-size="11" font-weight="bold">A</text>
      <text x="${leftX - 12}" y="${leftY + 12}" font-size="11" font-weight="bold">B</text>
      <text x="${rightX + 4}" y="${rightY + 12}" font-size="11" font-weight="bold">C</text>
      <text x="${midLeftX - 14}" y="${midLeftY + 4}" font-size="10" font-weight="bold" fill="#2563eb">D</text>
      <text x="${midRightX + 4}" y="${midRightY + 4}" font-size="10" font-weight="bold" fill="#2563eb">E</text>
      <!-- 長さラベル -->
      <text x="${(topX + midLeftX)/2 - 14}" y="${(topY + midLeftY)/2 + 2}" font-size="10" fill="#0f172a">${ad}</text>
      <text x="${(midLeftX + leftX)/2 - 14}" y="${(midLeftY + leftY)/2 + 2}" font-size="10" fill="#0f172a">${db}</text>
      <text x="${(midLeftX + midRightX)/2 - 4}" y="${midLeftY - 5}" font-size="10" font-weight="bold" fill="#dc2626">${de === 'x' ? 'x' : de}</text>
      <text x="${(leftX + rightX)/2 - 4}" y="${leftY + 13}" font-size="10" font-weight="bold" fill="#0f172a">${bc === 'x' ? 'x' : bc}</text>
    </svg>
  `;
}

// 3. 直角三角形 (三平方の定理用 SVG)
function generatePythagorasTriangleSvg(a, b, c, unknownSide = 'c', width = 160, height = 120) {
  const oX = 35, oY = height - 25;
  const bX = width - 25, bY = oY;
  const aX = oX, aY = 20;

  const aLabel = unknownSide === 'a' ? 'x' : a;
  const bLabel = unknownSide === 'b' ? 'x' : b;
  const cLabel = unknownSide === 'c' ? 'x' : c;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;">
      <polygon points="${oX},${oY} ${bX},${bY} ${aX},${aY}" fill="none" stroke="#1e293b" stroke-width="1.8"/>
      <!-- 直角記号 -->
      <polyline points="${oX},${oY - 12} ${oX + 12},${oY - 12} ${oX + 12},${oY}" fill="none" stroke="#1e293b" stroke-width="1.2"/>
      <!-- 辺の長さラベル -->
      <text x="${oX - 16}" y="${(oY + aY)/2 + 4}" font-size="11" font-weight="bold" fill="${unknownSide === 'a' ? '#dc2626' : '#0f172a'}">${aLabel}</text>
      <text x="${(oX + bX)/2 - 4}" y="${oY + 15}" font-size="11" font-weight="bold" fill="${unknownSide === 'b' ? '#dc2626' : '#0f172a'}">${bLabel}</text>
      <text x="${(aX + bX)/2 + 4}" y="${(aY + bY)/2 - 4}" font-size="11" font-weight="bold" fill="${unknownSide === 'c' ? '#dc2626' : '#0f172a'}">${cLabel}</text>
    </svg>
  `;
}

// 4. 箱ひげ図 SVG (2クラス比較)
function generateBoxplotCompareSvg(labelA, qA, labelB, qB, minVal, maxVal, width = 220, height = 100) {
  const padL = 35, padR = 15;
  const plotW = width - padL - padR;
  const toX = (val) => padL + ((val - minVal) / (maxVal - minVal)) * plotW;

  const drawBox = (y, q, color) => {
    const xMin = toX(q[0]), xQ1 = toX(q[1]), xMed = toX(q[2]), xQ3 = toX(q[3]), xMax = toX(q[4]);
    return `
      <!-- ひげ -->
      <line x1="${xMin}" y1="${y}" x2="${xQ1}" y2="${y}" stroke="${color}" stroke-width="1.5"/>
      <line x1="${xQ3}" y1="${y}" x2="${xMax}" y2="${y}" stroke="${color}" stroke-width="1.5"/>
      <line x1="${xMin}" y1="${y-6}" x2="${xMin}" y2="${y+6}" stroke="${color}" stroke-width="1.5"/>
      <line x1="${xMax}" y1="${y-6}" x2="${xMax}" y2="${y+6}" stroke="${color}" stroke-width="1.5"/>
      <!-- 箱 -->
      <rect x="${xQ1}" y="${y-10}" width="${xQ3 - xQ1}" height="20" fill="none" stroke="${color}" stroke-width="1.8"/>
      <!-- 中央値 -->
      <line x1="${xMed}" y1="${y-10}" x2="${xMed}" y2="${y+10}" stroke="#dc2626" stroke-width="2"/>
    `;
  };

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff;border:1px solid #e2e8f0;border-radius:4px;">
      <!-- ラベル -->
      <text x="6" y="28" font-size="10" font-weight="bold">${labelA}</text>
      <text x="6" y="62" font-size="10" font-weight="bold">${labelB}</text>
      ${drawBox(25, qA, '#2563eb')}
      ${drawBox(59, qB, '#059669')}
      <!-- 目盛り軸 -->
      <line x1="${padL}" y1="80" x2="${width - padR}" y2="80" stroke="#64748b" stroke-width="1"/>
      <text x="${toX(minVal) - 4}" y="93" font-size="9" fill="#64748b">${minVal}</text>
      <text x="${toX((minVal+maxVal)/2) - 6}" y="93" font-size="9" fill="#64748b">${Math.round((minVal+maxVal)/2)}</text>
      <text x="${toX(maxVal) - 6}" y="93" font-size="9" fill="#64748b">${maxVal}</text>
    </svg>
  `;
}

// 5. 度数分布表 HTML テーブル生成
function generateFrequencyTableHtml(classes, freqs, total) {
  let rows = '';
  for (let i = 0; i < classes.length; i++) {
    rows += `<tr><td>${classes[i]}</td><td>${freqs[i]}</td></tr>`;
  }
  return `
    <table class="math-freq-table">
      <thead>
        <tr><th>階級 (cm)</th><th>度数 (人)</th></tr>
      </thead>
      <tbody>
        ${rows}
        <tr><td>合計</td><td>${total}</td></tr>
      </tbody>
    </table>
  `;
}

// 練習プリント・小テスト自動生成システム (全学年・全4領域対応)

const testCurriculum = {
  '1': [
    {
      id: 'g1_all',
      name: '【中1全範囲】総合テスト',
      subUnits: [
        { id: 'g1_all_mix', name: '中1の全領域からランダム総合出題' }
      ]
    },
    {
      id: 'g1_pos_neg',
      name: 'A 数と式: 正負の数',
      subUnits: [
        { id: 'g1_pos_neg_all', name: '【正負の数】全般から出題' },
        { id: 'g1_pos_neg_add_sub', name: '正負の加法・減法' },
        { id: 'g1_pos_neg_mul_div', name: '正負の乗法・除法' },
        { id: 'g1_pos_neg_mixed', name: '累乗を含む四則混合計算' }
      ]
    },
    {
      id: 'g1_letters',
      name: 'A 数と式: 文字と式',
      subUnits: [
        { id: 'g1_letters_all', name: '【文字と式】全般から出題' },
        { id: 'g1_letters_value', name: '文字への代入と式の値' },
        { id: 'g1_letters_calc', name: '一次式の加法・減法' },
        { id: 'g1_letters_expand', name: '一次式と数の乗除・かっこ' }
      ]
    },
    {
      id: 'g1_linear_eq',
      name: 'A 数と式: 一次方程式',
      subUnits: [
        { id: 'g1_eq_all', name: '【一次方程式】全般から出題' },
        { id: 'g1_eq_basic', name: '基本の移項と解き方' },
        { id: 'g1_eq_parentheses', name: 'かっこ・分数・小数を含む方程式' },
        { id: 'g1_eq_word', name: '一次方程式の文章題 (代金・個数)' }
      ]
    },
    {
      id: 'g1_functions',
      name: 'C 関数: 比例と反比例',
      subUnits: [
        { id: 'g1_func_all', name: '【比例・反比例】全般から出題' },
        { id: 'g1_prop_formula', name: '比例の式と変域 (y = ax)' },
        { id: 'g1_inv_formula', name: '反比例の式と変域 (y = a/x)' },
        { id: 'g1_func_coords', name: 'グラフの傾きと座標の計算' }
      ]
    },
    {
      id: 'g1_geometry_plane',
      name: 'B 図形: 平面図形',
      subUnits: [
        { id: 'g1_plane_all', name: '【平面図形】全般から出題' },
        { id: 'g1_plane_sector', name: 'おうぎ形の弧の長さと面積' },
        { id: 'g1_plane_angles', name: '角の二等分線・作図・角度' }
      ]
    },
    {
      id: 'g1_geometry_solid',
      name: 'B 図形: 空間図形',
      subUnits: [
        { id: 'g1_solid_all', name: '【空間図形】全般から出題' },
        { id: 'g1_solid_volume', name: '角柱・円柱・角錐・円錐の体積' },
        { id: 'g1_solid_surface', name: '角柱・円柱・球の表面積' }
      ]
    },
    {
      id: 'g1_data',
      name: 'D データの活用: データの分析',
      subUnits: [
        { id: 'g1_data_all', name: '【データの分析】全般から出題' },
        { id: 'g1_data_rep', name: '代表値 (平均値・中央値・最頻値・範囲)' },
        { id: 'g1_data_rel_freq', name: '度数分布表と相対度数の計算' }
      ]
    }
  ],
  '2': [
    {
      id: 'g2_all',
      name: '【中2全範囲】総合テスト',
      subUnits: [
        { id: 'g2_all_mix', name: '中2の全領域からランダム総合出題' }
      ]
    },
    {
      id: 'g2_poly_calc',
      name: 'A 数と式: 式の計算',
      subUnits: [
        { id: 'g2_poly_all', name: '【式の計算】全般から出題' },
        { id: 'g2_poly_add_sub', name: '同類項の整理と多項式の加減' },
        { id: 'g2_poly_mul_div', name: '単項式の乗法と除法' },
        { id: 'g2_poly_transform', name: '等式の変形' }
      ]
    },
    {
      id: 'g2_simul_eq',
      name: 'A 数と式: 連立方程式',
      subUnits: [
        { id: 'g2_simul_all', name: '【連立方程式】全般から出題' },
        { id: 'g2_simul_add_sub', name: '加減法による解き方' },
        { id: 'g2_simul_subst', name: '代入法による解き方' },
        { id: 'g2_simul_complex', name: 'かっこ・分数・小数を含む連立方程式' },
        { id: 'g2_simul_word', name: '連立方程式の文章題 (代金・速さ)' }
      ]
    },
    {
      id: 'g2_linear_func',
      name: 'C 関数: 一次関数',
      subUnits: [
        { id: 'g2_lfunc_all', name: '【一次関数】全般から出題' },
        { id: 'g2_lfunc_rate', name: '変化の割合と変域・増加量' },
        { id: 'g2_lfunc_graph', name: '傾き・切片とグラフ' },
        { id: 'g2_lfunc_find_eq', name: '直線の式の決定 (傾き・変化の割合・増減・平行線・2点)' },
        { id: 'g2_lfunc_intersect', name: '2直線の交点と連立方程式' }
      ]
    },
    {
      id: 'g2_geometry_angles',
      name: 'B 図形: 平行と合同・多角形の角',
      subUnits: [
        { id: 'g2_geom_all', name: '【図形の性質】全般から出題' },
        { id: 'g2_geom_parallel_angles', name: '平行線と同位角・錯角の計算' },
        { id: 'g2_geom_polygon_angles', name: '多角形の内角と外角' },
        { id: 'g2_geom_triangle_prop', name: '二等辺三角形・直角三角形の角' }
      ]
    },
    {
      id: 'g2_quadrilaterals',
      name: 'B 図形: 三角形と四角形',
      subUnits: [
        { id: 'g2_quad_all', name: '【四角形の性質】全般から出題' },
        { id: 'g2_quad_parallelogram', name: '平行四辺形の性質・角度計算' },
        { id: 'g2_quad_special', name: 'ひし形・長方形・正方形の性質' }
      ]
    },
    {
      id: 'g2_probability_data',
      name: 'D データの活用: 確率と箱ひげ図',
      subUnits: [
        { id: 'g2_prob_all', name: '【確率・データの比較】全般から出題' },
        { id: 'g2_prob_dice_coin', name: 'さいころ・コインの確率' },
        { id: 'g2_prob_balls', name: '玉を取り出す確率' },
        { id: 'g2_data_boxplot', name: '四分位数と箱ひげ図の分析' }
      ]
    }
  ],
  '3': [
    {
      id: 'g3_all',
      name: '【中3全範囲】総合テスト',
      subUnits: [
        { id: 'g3_all_mix', name: '中3の全領域からランダム総合出題' }
      ]
    },
    {
      id: 'g3_poly_expansion',
      name: 'A 数と式: 多項式の展開と因数分解',
      subUnits: [
        { id: 'g3_poly_all', name: '【展開・因数分解】全般から出題' },
        { id: 'g3_poly_expand_formula', name: '乗法公式による式の展開' },
        { id: 'g3_poly_common_factor', name: '共通因数のくくり出し' },
        { id: 'g3_poly_factor_formula', name: '乗法公式による因数分解' },
        { id: 'g3_poly_value_calc', name: '式の展開・因数分解の利用 (式の値)' }
      ]
    },
    {
      id: 'g3_square_root',
      name: 'A 数と式: 平方根',
      subUnits: [
        { id: 'g3_sqrt_all', name: '【平方根】全般から出題' },
        { id: 'g3_sqrt_basic', name: '平方根の意味と根号の簡単化 (a√b)' },
        { id: 'g3_sqrt_rationalize', name: '分母の有理化' },
        { id: 'g3_sqrt_mul_div', name: '根号を含む乗法と除法' },
        { id: 'g3_sqrt_add_sub', name: '根号を含む加法と減法・四則' }
      ]
    },
    {
      id: 'g3_quad_eq',
      name: 'A 数と式: 二次方程式',
      subUnits: [
        { id: 'g3_qeq_all', name: '【二次方程式】全般から出題' },
        { id: 'g3_qeq_sqrt_method', name: '平方根の考え方による解き方' },
        { id: 'g3_qeq_factor_method', name: '因数分解による解き方' },
        { id: 'g3_qeq_formula_method', name: '解の公式による解き方' },
        { id: 'g3_qeq_word', name: '二次方程式の文章題 (数・図形)' }
      ]
    },
    {
      id: 'g3_quad_func',
      name: 'C 関数: 関数 y = ax²',
      subUnits: [
        { id: 'g3_qfunc_all', name: '【関数 y=ax²】全般から出題' },
        { id: 'g3_qfunc_formula', name: '放物線の式を求める (y = ax²)' },
        { id: 'g3_qfunc_domain', name: '変域の求め方' },
        { id: 'g3_qfunc_rate', name: '変化の割合の計算' }
      ]
    },
    {
      id: 'g3_similarity',
      name: 'B 図形: 図形の相似',
      subUnits: [
        { id: 'g3_sim_all', name: '【図形の相似】全般から出題' },
        { id: 'g3_sim_ratio', name: '相似比と線分の長さ' },
        { id: 'g3_sim_midpoint', name: '平行線と線分の比・中点連結定理' },
        { id: 'g3_sim_area_volume', name: '相似な図形の面積比と体積比' }
      ]
    },
    {
      id: 'g3_circle_theorems',
      name: 'B 図形: 円の性質 (円周角の定理)',
      subUnits: [
        { id: 'g3_circle_all', name: '【円の性質】全般から出題' },
        { id: 'g3_circle_angle', name: '円周角と中心角の定理' },
        { id: 'g3_circle_tangent', name: '直径に対する円周角と接線' }
      ]
    },
    {
      id: 'g3_pythagoras',
      name: 'B 図形: 三平方の定理',
      subUnits: [
        { id: 'g3_pyth_all', name: '【三平方の定理】全般から出題' },
        { id: 'g3_pyth_calc', name: '直角三角形の斜辺・辺の長さ' },
        { id: 'g3_pyth_special_ratios', name: '特別な直角三角形 (45°, 30°-60°)' },
        { id: 'g3_pyth_plane_space', name: '平面・空間図形への利用' }
      ]
    },
    {
      id: 'g3_sample_survey',
      name: 'D データの活用: 標本調査',
      subUnits: [
        { id: 'g3_sample_all', name: '【標本調査】全般から出題' },
        { id: 'g3_sample_estimation', name: '標本調査と母集団の推定' }
      ]
    }
  ]
};

// 学年変更イベント: 大単元リストを更新
function onTestGradeChange() {
  const gradeSelect = document.getElementById('testGrade');
  const majorSelect = document.getElementById('testMajorUnit');
  if (!gradeSelect || !majorSelect) return;

  const grade = gradeSelect.value;
  const majorUnits = testCurriculum[grade] || [];

  majorSelect.innerHTML = majorUnits.map(mu => `<option value="${mu.id}">${mu.name}</option>`).join('');

  onTestMajorUnitChange();
}

// 大単元変更イベント: 小単元リストを更新
function onTestMajorUnitChange() {
  const gradeSelect = document.getElementById('testGrade');
  const majorSelect = document.getElementById('testMajorUnit');
  const subSelect = document.getElementById('testSubUnit');
  if (!gradeSelect || !majorSelect || !subSelect) return;

  const grade = gradeSelect.value;
  const majorId = majorSelect.value;
  const majorUnits = testCurriculum[grade] || [];
  const currentMajor = majorUnits.find(m => m.id === majorId) || majorUnits[0];

  if (currentMajor && currentMajor.subUnits) {
    subSelect.innerHTML = currentMajor.subUnits.map(su => `<option value="${su.id}">${su.name}</option>`).join('');
  } else {
    subSelect.innerHTML = `<option value="default">単元別問題</option>`;
  }

  generateQuickTest();
}

// 乱数ユーティリティ
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min, max) {
  let val = 0;
  while (val === 0) {
    val = randInt(min, max);
  }
  return val;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

function simplifyFraction(num, den) {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  num /= g;
  den /= g;
  if (den === 1) return `${num}`;
  return `${num}/${den}`;
}

// 数学用項フォーマッター (係数1の省略, 符号の適正化)
function formatTerm(coeff, variable = '', isFirst = false) {
  if (coeff === 0) return '';
  const isPos = coeff > 0;
  const abs = Math.abs(coeff);
  const coeffStr = (abs === 1 && variable !== '') ? '' : `${abs}`;
  
  if (isFirst) {
    const sign = isPos ? '' : '－';
    return `${sign}${coeffStr}${variable}`;
  } else {
    const sign = isPos ? '＋ ' : '－ ';
    return `${sign}${coeffStr}${variable}`;
  }
}

// 2項多項式フォーマッター (例: 4x － y, x ＋ 5)
function formatPoly2(c1, v1, c2, v2) {
  const t1 = formatTerm(c1, v1, true);
  if (!t1) {
    return formatTerm(c2, v2, true) || '0';
  }
  const t2 = formatTerm(c2, v2, false);
  return t2 ? `${t1} ${t2}` : t1;
}

// ----------------------------------------------------
// 各単元・小単元の問題ジェネレーター集
// ----------------------------------------------------
const problemGenerators = {
  // --- 中1 ---
  g1_pos_neg_add_sub: () => {
    const a = randInt(-12, 12);
    const b = randNonZero(-12, 12);
    const isSub = Math.random() > 0.5;
    const aStr = a < 0 ? `(${a})` : `${a}`;
    const bStr = b < 0 ? `(${b})` : `(+${b})`;
    if (isSub) {
      const ans = a - b;
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} － ${bStr}</span>`,
        ans: `${ans}`,
        steps: [
          `ひき算を加法に直す: ＝ ${aStr} ＋ (${-b < 0 ? -b : '+' + (-b)})`,
          `計算する: ＝ ${ans}`
        ],
        exp: `${aStr} ＋ (${-b < 0 ? -b : '+' + (-b)}) ＝ ${ans}`
      };
    } else {
      const ans = a + b;
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} ＋ ${bStr}</span>`,
        ans: `${ans}`,
        steps: [
          `同符号・異符号の規則に従って計算: ＝ ${ans}`
        ],
        exp: `同符号・異符号の規則に従って計算: ${ans}`
      };
    }
  },

  g1_pos_neg_mul_div: () => {
    const isDiv = Math.random() > 0.5;
    if (isDiv) {
      const b = randNonZero(-9, 9);
      const ans = randNonZero(-9, 9);
      const a = b * ans;
      const aStr = a < 0 ? `(${a})` : `(+${a})`;
      const bStr = b < 0 ? `(${b})` : `(+${b})`;
      const sign = (a < 0 ? 1 : 0) + (b < 0 ? 1 : 0);
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} ÷ ${bStr}</span>`,
        ans: `${ans >= 0 ? '+' : ''}${ans}`,
        steps: [
          `負の符号の個数を判定: ${sign}個 (${sign % 2 === 0 ? '偶数個のため ＋' : '奇数個のため －'})`,
          `絶対値を計算: ＝ ${ans >= 0 ? '+' : ''}${Math.abs(a)} ÷ ${Math.abs(b)} ＝ ${ans >= 0 ? '+' : ''}${ans}`
        ],
        exp: `負の符号の個数は ${sign} 個。答えは ${ans >= 0 ? '+' : ''}${ans}`
      };
    } else {
      const a = randNonZero(-9, 9);
      const b = randNonZero(-9, 9);
      const ans = a * b;
      const aStr = a < 0 ? `(${a})` : `(+${a})`;
      const bStr = b < 0 ? `(${b})` : `(+${b})`;
      const sign = (a < 0 ? 1 : 0) + (b < 0 ? 1 : 0);
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} × ${bStr}</span>`,
        ans: `${ans >= 0 ? '+' : ''}${ans}`,
        steps: [
          `負の符号の個数を判定: ${sign}個 (${sign % 2 === 0 ? '偶数個のため ＋' : '奇数個のため －'})`,
          `絶対値を計算: ＝ ${ans >= 0 ? '+' : ''}${Math.abs(a)} × ${Math.abs(b)} ＝ ${ans >= 0 ? '+' : ''}${ans}`
        ],
        exp: `負の符号の個数は ${sign} 個。答えは ${ans >= 0 ? '+' : ''}${ans}`
      };
    }
  },

  g1_pos_neg_mixed: () => {
    const base = randInt(-4, -2);
    const c = randNonZero(-6, 6);
    const d = randNonZero(-5, 5);
    const term1 = base * base; // (-3)^2 = 9
    const term2 = c * d;
    const ans = term1 - term2;
    // 正の数にはカッコを付けず「5」、負の数のみ「(-3)」とする（教科書の標準表記）
    const cStr = c < 0 ? `(${c})` : `${c}`;
    const dStr = d < 0 ? `(${d})` : `${d}`;
    const term2Disp = term2 < 0 ? `(${term2})` : `${term2}`;
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">(${base})² － ${cStr} × ${dStr}</span>`,
      ans: `${ans}`,
      steps: [
        `累乗を計算: (${base})² ＝ ${term1}`,
        `乗法を計算: ${cStr} × ${dStr} ＝ ${term2Disp}`,
        `減法を計算: ${term1} － ${term2Disp} ＝ ${ans}`
      ],
      exp: `累乗・乗法を先に計算: (${base})²＝${term1}、${cStr}×${dStr}＝${term2Disp}。よって ${term1} － ${term2Disp} ＝ ${ans}`
    };
  },

  g1_letters_value: () => {
    const x = randInt(-4, 4);
    const a = randNonZero(-3, 3);
    const b = randNonZero(-6, 6);
    const ans = a * (x * x) + b * x;
    const expr = formatPoly2(a, 'x²', b, 'x');
    return {
      q: `x ＝ ${x} のとき、次の式の値を求めなさい。<br><span class="problem-body-math">${expr}</span>`,
      ans: `${ans}`,
      steps: [
        `x に ${x} を代入: ＝ ${a}×(${x})² ＋ (${b})×(${x})`,
        `累乗と各項を計算: ＝ ${a * (x * x)} ＋ (${b * x})`,
        `答: ＝ ${ans}`
      ],
      exp: `${expr} の x に ${x} を代入: ${a * (x * x)} ＋ (${b * x}) ＝ ${ans}`
    };
  },

  g1_letters_calc: () => {
    const a = randNonZero(-5, 5);
    const b = randInt(-9, 9);
    const c = randNonZero(-5, 5);
    const d = randInt(-9, 9);
    const p1 = formatPoly2(a, 'x', b, '');
    const p2 = formatPoly2(c, 'x', d, '');
    const ansPoly = formatPoly2(a + c, 'x', b + d, '');
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">(${p1}) ＋ (${p2})</span>`,
      ans: ansPoly,
      steps: [
        `かっこをはずす: ＝ ${p1} ＋ ${p2}`,
        `同類項をまとめる: ＝ (${a}＋${c})x ＋ (${b}＋${d})`,
        `答: ＝ ${ansPoly}`
      ],
      exp: `同類項をまとめる: (${a}＋${c})x ＋ (${b}＋${d}) ＝ ${ansPoly}`
    };
  },

  g1_letters_expand: () => {
    const k = randInt(2, 4);
    const a = randNonZero(-4, 4);
    const b = randInt(-6, 6);
    const inner = formatPoly2(a, 'x', b, '');
    const ansPoly = formatPoly2(k * a, 'x', k * b, '');
    return {
      q: `分配法則を使ってかっこをはずし、簡単にしなさい。<br><span class="problem-body-math">${k}(${inner})</span>`,
      ans: ansPoly,
      steps: [
        `分配法則でかっこの中の各項にかける: ＝ ${k}×(${formatTerm(a, 'x', true)}) ＋ ${k}×(${b})`,
        `答: ＝ ${ansPoly}`
      ],
      exp: `${k}×(${formatTerm(a, 'x', true)}) ＋ ${k}×(${b}) ＝ ${ansPoly}`
    };
  },

  g1_eq_basic: () => {
    const x = randInt(-8, 8);
    const a = randInt(2, 5);
    const c = randInt(1, a - 1);
    const b = randInt(-12, 12);
    const d = (a - c) * x + b;
    const left = formatPoly2(a, 'x', b, '');
    const right = formatPoly2(c, 'x', d, '');
    return {
      q: `次の方程式を解きなさい。<br><span class="problem-body-math">${left} ＝ ${right}</span>`,
      ans: `x ＝ ${x}`,
      steps: [
        `xの項を左辺へ、数の項を右辺へ移項: ${a}x － ${c}x ＝ ${d} － (${b})`,
        `同類項をまとめる: ${formatTerm(a - c, 'x', true)} ＝ ${(a - c) * x}`,
        `両辺を ${a - c} で割る: x ＝ ${x}`
      ],
      exp: `xの項を左辺へ、数の項を右辺へ移項: (${a}－${c})x ＝ ${d}－(${b}) → ${formatTerm(a - c, 'x', true)} ＝ ${(a - c) * x} → x ＝ ${x}`
    };
  },

  g1_eq_parentheses: () => {
    const x = randInt(-6, 6);
    const k = randInt(2, 4);
    const a = randInt(-5, 5);
    const rhsA = randInt(1, 3);
    const rhsB = k * (x + a) - rhsA * x;
    const inner = formatPoly2(1, 'x', a, '');
    const right = formatPoly2(rhsA, 'x', rhsB, '');
    return {
      q: `次の方程式を解きなさい。<br><span class="problem-body-math">${k}(${inner}) ＝ ${right}</span>`,
      ans: `x ＝ ${x}`,
      steps: [
        `かっこをはずす (分配法則): ${k}x ＋ (${k * a}) ＝ ${right}`,
        `移項して整理: (${k}－${rhsA})x ＝ ${rhsB} － (${k * a}) → ${formatTerm(k - rhsA, 'x', true)} ＝ ${(k - rhsA) * x}`,
        `両辺を ${k - rhsA} で割る: x ＝ ${x}`
      ],
      exp: `かっこを外して整理: ${formatTerm(k - rhsA, 'x', true)} ＝ ${(k - rhsA) * x} → x ＝ ${x}`
    };
  },

  g1_eq_word: () => {
    const applePrice = 120;
    const orangePrice = 80;
    const totalCount = randInt(10, 16);
    const appleCount = randInt(4, totalCount - 3);
    const orangeCount = totalCount - appleCount;
    const totalCost = applePrice * appleCount + orangePrice * orangeCount;
    return {
      q: `1個 ${applePrice}円のりんごと1個 ${orangePrice}円のみかんを合わせて ${totalCount}個 買ったところ、代金の合計は ${totalCost}円 でした。りんごは何個買いましたか。`,
      ans: `りんご ${appleCount} 個`,
      exp: `りんごを x 個とおくと、みかんは (${totalCount}－x) 個。方程式: ${applePrice}x ＋ ${orangePrice}(${totalCount}－x) ＝ ${totalCost} を解いて x ＝ ${appleCount}`
    };
  },

  g1_prop_formula: () => {
    const a = randNonZero(-6, 6);
    const x1 = randInt(2, 5);
    const y1 = a * x1;
    const x2 = randInt(-4, -1);
    const y2 = a * x2;
    return {
      q: `y は x に比例し、x ＝ ${x1} のとき y ＝ ${y1} です。<br>(1) y を x の式で表しなさい。<br>(2) x ＝ ${x2} のときの y の値を求めなさい。`,
      ans: `(1) y ＝ ${a}x ,  (2) y ＝ ${y2}`,
      exp: `y ＝ ax に x＝${x1}, y＝${y1} を代入して a ＝ ${a}。よって y ＝ ${a}x。これに x＝${x2} を代入すると y ＝ ${y2}`
    };
  },

  g1_inv_formula: () => {
    const a = pickRandom([12, 18, 24, 36, -12, -24]);
    const x1 = 3;
    const y1 = a / x1;
    const x2 = a > 0 ? -4 : 4;
    const y2 = a / x2;
    return {
      q: `y は x に反比例し、x ＝ ${x1} のとき y ＝ ${y1} です。<br>(1) y を x の式で表しなさい。<br>(2) x ＝ ${x2} のときの y の値を求めなさい。`,
      ans: `(1) y ＝ ${a}/x ,  (2) y ＝ ${y2}`,
      exp: `比例定数 a ＝ xy ＝ ${x1}×(${y1}) ＝ ${a}。よって y ＝ ${a}/x。x＝${x2} を代入して y ＝ ${y2}`
    };
  },

  g1_func_coords: () => {
    const a = randNonZero(-4, 4);
    const x = randInt(-5, 5);
    const y = a * x;
    return {
      q: `点 P(${x}, a) が比例のグラフ y ＝ ${a}x 上にあるとき、点Pの y 座標 a の値を求めなさい。`,
      ans: `a ＝ ${y}`,
      exp: `y ＝ ${a}x の x に ${x} を代入して a ＝ ${a}×(${x}) ＝ ${y}`
    };
  },

  g1_plane_sector: () => {
    const r = pickRandom([6, 9, 12]);
    const angle = pickRandom([60, 90, 120]);
    // 弧の長さ l = 2 * pi * r * (angle / 360)
    const arcLenNum = (2 * r * angle) / 360;
    // 面積 S = pi * r^2 * (angle / 360)
    const areaNum = (r * r * angle) / 360;
    return {
      q: `半径が ${r}cm、中心角が ${angle}° のおうぎ形について、次の問いに答えなさい。(円周率は π とする)<br>(1) 弧の長さを求めなさい。<br>(2) 面積を求めなさい。`,
      ans: `(1) ${arcLenNum}π cm ,  (2) ${areaNum}π cm²`,
      exp: `弧の長さ: 2π×${r}×(${angle}/360) ＝ ${arcLenNum}π cm<br>面積: π×${r}²×(${angle}/360) ＝ ${areaNum}π cm²`
    };
  },

  g1_plane_angles: () => {
    const angleA = randInt(35, 75);
    const ans = 180 - angleA;
    return {
      q: `直線上の点Oにおいて、∠AOB ＝ ${angleA}° のとき、その補角の大きさを求めなさい。`,
      ans: `${ans}°`,
      exp: `直線の角は 180° なので、180° － ${angleA}° ＝ ${ans}°`
    };
  },

  g1_solid_volume: () => {
    const r = randInt(3, 5);
    const h = randInt(6, 10);
    const v = r * r * h;
    return {
      q: `底面の半径が ${r}cm、高さが ${h}cm の円柱の体積を求めなさい。(円周率は π とする)`,
      ans: `${v}π cm³`,
      exp: `底面積 S ＝ π×${r}² ＝ ${r * r}π。<br>体積 V ＝ 底面積×高さ ＝ ${r * r}π×${h} ＝ ${v}π cm³`
    };
  },

  g1_solid_surface: () => {
    const r = pickRandom([3, 6]);
    const s = 4 * r * r;
    const v = (4 / 3) * r * r * r;
    return {
      q: `半径が ${r}cm の球の表面積を求めなさい。(円周率は π とする)`,
      ans: `${s}π cm²`,
      exp: `球の表面積の公式: S ＝ 4πr² ＝ 4π×${r}² ＝ ${s}π cm² (※体積なら V＝4/3πr³＝${v}π cm³)`
    };
  },

  g1_data_rep: () => {
    const data = [randInt(10, 15), randInt(16, 20), randInt(21, 25), randInt(26, 30), randInt(31, 38)].sort((a, b) => a - b);
    const median = data[2];
    const range = data[4] - data[0];
    return {
      q: `次の 5人の生徒のテストの得点データについて、中央値(メディアン)と範囲(レンジ)をそれぞれ求めなさい。<br><span class="problem-body-math">[ ${data.join(', ')} ] (点)</span>`,
      ans: `中央値: ${median} 点 ,  範囲: ${range} 点`,
      exp: `データを小さい順に並べた中央の値(3番目)は ${median}。範囲 ＝ 最大値(${data[4]}) － 最小値(${data[0]}) ＝ ${range}`
    };
  },

  g1_data_rel_freq: () => {
    const total = 40;
    const count = pickRandom([8, 12, 14, 16]);
    const rel = (count / total).toFixed(2);
    return {
      q: `生徒 40人のクラスで、通学時間が 20分以上30分未満 の生徒が ${count}人 いました。この階級の相対度数を小数第2位まで求めなさい。`,
      ans: `${rel}`,
      exp: `相対度数 ＝ その階級の度数 ÷ 度数の合計 ＝ ${count} ÷ ${total} ＝ ${rel}`
    };
  },

  // --- 中2 ---
  g2_poly_add_sub: () => {
    const a1 = randInt(2, 5);
    const b1 = randNonZero(-6, 6);
    const a2 = randInt(1, 4);
    const b2 = randNonZero(-6, 6);
    const ansA = a1 - a2;
    const ansB = b1 - b2;
    const p1 = formatPoly2(a1, 'x', b1, 'y');
    const p2 = formatPoly2(a2, 'x', b2, 'y');
    const ansPoly = formatPoly2(ansA, 'x', ansB, 'y');
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">(${p1}) － (${p2})</span>`,
      ans: ansPoly,
      steps: [
        `かっこをはずす (ひく式の符号を反転): ＝ ${p1} ${formatPoly2(-a2, 'x', -b2, 'y')}`,
        `同類項をまとめる: ＝ (${a1}－${a2})x ＋ (${b1}－(${b2}))y`,
        `答: ＝ ${ansPoly}`
      ],
      exp: `ひく式の各項の符号を変えて加える: (${a1}－${a2})x ＋ (${b1}－(${b2}))y ＝ ${ansPoly}`
    };
  },

  g2_poly_mul_div: () => {
    const a = randInt(2, 4);
    const b = randInt(2, 3);
    const product = a * b * 3;
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">${product}a²b ÷ (－${a}b)</span>`,
      ans: `－${b * 3}a²`,
      steps: [
        `全体の符号を決定 (正÷負は負): ＝ －(${product}a²b ÷ ${a}b)`,
        `数と文字をそれぞれ計算: ＝ －(${product}/${a} × a² × b/b)`,
        `答: ＝ －${b * 3}a²`
      ],
      exp: `符号は負。数: ${product}÷(－${a})＝－${b * 3}。文字: a²b÷b ＝ a²。よって －${b * 3}a²`
    };
  },

  g2_poly_transform: () => {
    const a = randInt(2, 4);
    const b = randInt(2, 5);
    const c = randInt(6, 18);
    const ans1 = `y ＝ (${c} － ${a}x) / ${b}`;
    const ans2 = `y ＝ －${simplifyFraction(a, b)}x ＋ ${simplifyFraction(c, b)}`;
    return {
      q: `等式 <span class="problem-body-math">${a}x ＋ ${b}y ＝ ${c}</span> を y について解きなさい。`,
      ans: ans1,
      steps: [
        `${a}x を右辺へ移項する: ${b}y ＝ ${c} － ${a}x`,
        `両辺を ${b} で割る: y ＝ (${c} － ${a}x) / ${b}`,
        `各項ごとに分ける場合: ${ans2}`
      ],
      exp: `${b}y ＝ ${c} － ${a}x より、両辺を ${b} で割って y ＝ (${c} － ${a}x)/${b}`
    };
  },

  g2_simul_add_sub: () => {
    const x = randInt(1, 6);
    const y = randInt(1, 5);
    const a1 = 2;
    const b1 = 1;
    const c1 = a1 * x + b1 * y;
    const a2 = 1;
    const b2 = -1;
    const c2 = a2 * x + b2 * y;
    return {
      q: `次の連立方程式を加減法で解きなさい。<br><span class="problem-body-math">\\begin{cases} 2x + y = ${c1} \\\\ x - y = ${c2} \\end{cases}</span>`,
      ans: `x = ${x},  y = ${y}`,
      steps: [
        `①式と②式を加えると y が消去される: (2x + y) + (x - y) = ${c1} + (${c2}) → 3x = ${c1 + c2}`,
        `両辺を 3 で割る: x = ${x}`,
        `x = ${x} を②式に代入: ${x} - y = ${c2} → -y = ${c2 - x} → y = ${y}`,
        `答: x = ${x},  y = ${y}`
      ],
      exp: `2つの式を足すと y が消去されて 3x = ${c1 + c2} → x = ${x}。代入して y = ${y}`
    };
  },

  g2_simul_subst: () => {
    const x = randInt(2, 5);
    const k = randInt(2, 3);
    const m = randInt(-3, 3);
    const y = k * x + m;
    const a2 = 3;
    const b2 = 2;
    const c2 = a2 * x + b2 * y;
    const mStr = m >= 0 ? `+ ${m}` : `- ${Math.abs(m)}`;
    return {
      q: `次の連立方程式を代入法で解きなさい。<br><span class="problem-body-math">\\begin{cases} y = ${k}x ${mStr} \\\\ 3x + 2y = ${c2} \\end{cases}</span>`,
      ans: `x = ${x},  y = ${y}`,
      steps: [
        `①式を②式の y に代入: 3x + 2(${k}x ${mStr}) = ${c2}`,
        `かっこをはずして整理: 3x + ${2 * k}x ${2 * m >= 0 ? '+ ' + 2 * m : '- ' + Math.abs(2 * m)} = ${c2} → ${3 + 2 * k}x = ${c2 - 2 * m}`,
        `両辺を ${3 + 2 * k} で割る: x = ${x}`,
        `x = ${x} を①式に代入: y = ${k} × (${x}) ${mStr} = ${y}`,
        `答: x = ${x},  y = ${y}`
      ],
      exp: `2つ目の式の y に (${k}x ${mStr}) を代入: 3x + 2(${k}x ${mStr}) = ${c2} を解いて x = ${x}, y = ${y}`
    };
  },

  g2_simul_complex: () => {
    const x = randInt(2, 4);
    const y = randInt(1, 4);
    const c1 = (0.3 * x + 0.2 * y).toFixed(1);
    const c2 = x - y;
    return {
      q: `次の連立方程式を解きなさい。<br><span class="problem-body-math">\\begin{cases} 0.3x + 0.2y = ${c1} \\\\ x - y = ${c2} \\end{cases}</span>`,
      ans: `x = ${x},  y = ${y}`,
      steps: [
        `①式の両辺を 10倍して小数をなくす: 3x + 2y = ${Math.round(c1 * 10)}`,
        `②式の両辺を 2倍して加減法: 2x - 2y = ${2 * c2}`,
        `2式を足して y を消去: 5x = ${Math.round(c1 * 10) + 2 * c2} → x = ${x}`,
        `x = ${x} を②式に代入: ${x} - y = ${c2} → y = ${y}`,
        `答: x = ${x},  y = ${y}`
      ],
      exp: `第1式の両辺を 10倍して 3x + 2y = ${Math.round(c1 * 10)}。これと第2式を連立させて解く。`
    };
  },

  g2_simul_word: () => {
    const adultPrice = 500;
    const childPrice = 300;
    const aCount = 2;
    const cCount = 3;
    const total1 = aCount * adultPrice + cCount * childPrice; // 1900
    return {
      q: `ある博物館の入館料は、大人2人と子ども3人で ${total1}円 です。また、大人1人の入館料は子ども1人の入館料より 200円 高いそうです。大人1人と子ども1人の入館料をそれぞれ求めなさい。`,
      ans: `大人: ${adultPrice} 円 ,  子ども: ${childPrice} 円`,
      steps: [
        `未知数を文字でおく: 大人1人を x円、子ども1人を y円とする`,
        `問題文から連立方程式を立式: { 2x ＋ 3y ＝ ${total1},  x ＝ y ＋ 200 }`,
        `代入法で解く: 2(y ＋ 200) ＋ 3y ＝ ${total1} → 5y ＋ 400 ＝ ${total1} → y ＝ ${childPrice}`,
        `x を求める: x ＝ ${childPrice} ＋ 200 ＝ ${adultPrice}`,
        `答: 大人: ${adultPrice} 円 ,  子ども: ${childPrice} 円`
      ],
      exp: `大人 x 円、子ども y 円とする。方程式 { 2x ＋ 3y ＝ ${total1}, x ＝ y ＋ 200 } を解く。`
    };
  },

  g2_lfunc_rate: () => {
    const subType = pickRandom([0, 1, 2, 3]);
    const a = randNonZero(-5, 5);
    const b = randInt(-8, 8);
    const aTerm = formatTerm(a, 'x', true);
    const bStr = b !== 0 ? (b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`) : '';
    const aDisp = a < 0 ? `－${Math.abs(a)}` : `${a}`;

    if (subType === 0) {
      // 変化の割合と増加量の標準型
      const x1 = randInt(-3, 1);
      const x2 = x1 + randInt(2, 4);
      const deltaY = a * (x2 - x1);
      const dyDisp = deltaY < 0 ? `－${Math.abs(deltaY)}` : `${deltaY}`;
      return {
        q: `一次関数 <span class="problem-body-math">y ＝ ${aTerm} ${bStr}</span> について、次の問いに答えなさい。<br>(1) この関数の変化の割合を答えなさい。<br>(2) x の値が ${x1} から ${x2} まで増加するときの y の増加量を求めなさい。`,
        ans: `(1) ${aDisp} ,  (2) ${dyDisp}`,
        steps: [
          `(1) 一次関数 y ＝ ax ＋ b の変化の割合は常に傾き a に等しい: ＝ ${aDisp}`,
          `(2) y の増加量 ＝ (変化の割合) × (xの増加量) ＝ ${aDisp} × (${x2} － (${x1})) ＝ ${aDisp} × ${x2 - x1} ＝ ${dyDisp}`,
          `答: (1) ${aDisp} ,  (2) ${dyDisp}`
        ],
        exp: `(1) 一次関数の変化の割合は傾き a に等しいので ${aDisp}。<br>(2) y の増加量 ＝ (変化の割合) × (xの増加量) ＝ ${aDisp} × (${x2 - x1}) ＝ ${dyDisp}`
      };
    } else if (subType === 1) {
      // 変化の割合の公式からの逆算
      const dx = pickRandom([2, 3, 4, 5]);
      const dy = a * dx;
      const dyDisp = dy < 0 ? `－${Math.abs(dy)}` : `${dy}`;
      return {
        q: `ある一次関数で、変化の割合が ${aDisp} であるとき、x の増加量が ${dx} のときの y の増加量を求めなさい。`,
        ans: `${dyDisp}`,
        steps: [
          `変化の割合の公式: (変化の割合) ＝ (y の増加量) ÷ (x の増加量)`,
          `(y の増加量) ＝ (変化の割合) × (x の増加量) ＝ ${aDisp} × ${dx} ＝ ${dyDisp}`,
          `答: ${dyDisp}`
        ],
        exp: `y の増加量 ＝ (変化の割合) × (xの増加量) ＝ ${aDisp} × ${dx} ＝ ${dyDisp}`
      };
    } else if (subType === 2) {
      // 変域の決定（傾きの正負による反転）
      const xMin = randInt(-4, 0);
      const xMax = xMin + randInt(2, 5);
      const yAtMin = a * xMin + b;
      const yAtMax = a * xMax + b;
      const yMin = Math.min(yAtMin, yAtMax);
      const yMax = Math.max(yAtMin, yAtMax);
      return {
        q: `一次関数 <span class="problem-body-math">y ＝ ${aTerm} ${bStr}</span> において、x の変域が <span class="problem-body-math">${xMin} ≦ x ≦ ${xMax}</span> のときの y の変域を求めなさい。`,
        ans: `${yMin} ≦ y ≦ ${yMax}`,
        steps: [
          `x ＝ ${xMin} のとき: y ＝ ${a}×(${xMin}) ${bStr} ＝ ${yAtMin}`,
          `x ＝ ${xMax} のとき: y ＝ ${a}×(${xMax}) ${bStr} ＝ ${yAtMax}`,
          a < 0 ? `傾きが負 (${aDisp}) のため、x が増加すると y は減少する（大小関係が逆転）` : `傾きが正 (${aDisp}) のため、x が増加すると y も増加する`,
          `答: ${yMin} ≦ y ≦ ${yMax}`
        ],
        exp: `x ＝ ${xMin} のとき y ＝ ${yAtMin}、x ＝ ${xMax} のとき y ＝ ${yAtMax}。よって ${yMin} ≦ y ≦ ${yMax}`
      };
    } else {
      // 2組の増減からの変化の割合計算
      const x1 = randInt(-2, 2);
      const x2 = x1 + pickRandom([2, 3, 4]);
      const y1 = a * x1 + b;
      const y2 = a * x2 + b;
      return {
        q: `一次関数において、x の値が ${x1} から ${x2} まで増加するとき、y の値が ${y1} から ${y2} まで増加します。この関数の変化の割合を求めなさい。`,
        ans: `${aDisp}`,
        steps: [
          `x の増加量 ＝ ${x2} － (${x1}) ＝ ${x2 - x1}`,
          `y の増加量 ＝ ${y2} － (${y1}) ＝ ${y2 - y1}`,
          `変化の割合 ＝ (y の増加量) ÷ (x の増加量) ＝ (${y2 - y1}) ÷ (${x2 - x1}) ＝ ${aDisp}`,
          `答: ${aDisp}`
        ],
        exp: `変化の割合 ＝ (y の増加量) ÷ (x の増加量) ＝ (${y2 - y1}) ÷ (${x2 - x1}) ＝ ${aDisp}`
      };
    }
  },

  g2_lfunc_graph: () => {
    const a = randNonZero(-4, 4);
    const b = randNonZero(-6, 6);
    const aTerm = formatTerm(a, 'x', true);
    const bStr = b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    const aDisp = a < 0 ? `－${Math.abs(a)}` : `${a}`;
    const bDisp = b < 0 ? `－${Math.abs(b)}` : `${b}`;
    return {
      q: `直線 <span class="problem-body-math">y ＝ ${aTerm} ${bStr}</span> の傾きと切片をそれぞれ答えなさい。`,
      ans: `傾き: ${aDisp} ,  切片: ${bDisp}`,
      steps: [
        `一次関数の基本形: y ＝ ax ＋ b において a が傾き、b が切片`,
        `答: 傾き ＝ ${aDisp} ,  切片 ＝ ${bDisp}`
      ],
      exp: `一次関数 y ＝ ax ＋ b において、a が傾き、b が切片です。`
    };
  },

  g2_lfunc_find_eq: () => {
    // 8種類の多様な問い方パターン（教科書・入試・問題集頻出）
    // 0: 傾きと1点を通る
    // 1: 変化の割合と1点を通る
    // 2: xが1増えたときのyの増減と1点を通る
    // 3: 平行な直線と1点を通る
    // 4: xの増加量とyの増加量、および1点を通る
    // 5: 切片と1点を通る
    // 6: y軸との交点と1点を通る
    // 7: 2点を通る直線
    const pattern = pickRandom([0, 1, 2, 3, 4, 5, 6, 7]);
    const a = randNonZero(-4, 4);
    const b = randInt(-6, 6);
    const aTerm = formatTerm(a, 'x', true);
    const bStr = b !== 0 ? (b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`) : '';
    const aDisp = a < 0 ? `－${Math.abs(a)}` : `${a}`;
    const ansEq = `y ＝ ${aTerm} ${bStr}`.trim();

    if (pattern === 0) {
      // パターン0: 傾きと1点
      const x1 = randInt(-3, 4);
      const y1 = a * x1 + b;
      return {
        q: `傾きが ${aDisp} で、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `傾きが ${aDisp} なので、求める直線の式を y ＝ ${aTerm} ＋ b とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → ${y1} ＝ ${a * x1} ＋ b`,
          `切片 b を解く: b ＝ ${b}`,
          `答: ${ansEq}`
        ],
        exp: `y ＝ ${aTerm} ＋ b とおき、x＝${x1}, y＝${y1} を代入して b＝${b} を求める。`
      };
    } else if (pattern === 1) {
      // パターン1: 変化の割合と1点
      const x1 = randInt(-3, 4);
      const y1 = a * x1 + b;
      return {
        q: `変化の割合が ${aDisp} で、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `一次関数の変化の割合は傾き a に等しいので、傾きは ${aDisp}`,
          `求める直線の式を y ＝ ${aTerm} ＋ b とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → b ＝ ${b}`,
          `答: ${ansEq}`
        ],
        exp: `一次関数において「変化の割合＝傾き」です。y ＝ ${aTerm} ＋ b とおき、点(${x1}, ${y1})を代入して解きます。`
      };
    } else if (pattern === 2) {
      // パターン2: xが1増えたときのyの増減と1点
      const x1 = randInt(-3, 4);
      const y1 = a * x1 + b;
      const changeText = a > 0 ? `y の値が ${a} 増加し` : `y の値が ${Math.abs(a)} 減少し`;
      return {
        q: `x の値が 1 増加するとき ${changeText}、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `「x が 1 増加するときの y の増加量」は傾き（変化の割合）を表すため、傾き a ＝ ${aDisp}`,
          `求める直線の式を y ＝ ${aTerm} ＋ b とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → b ＝ ${b}`,
          `答: ${ansEq}`
        ],
        exp: `「x が 1 増加するときの y の増加量」は傾き a ＝ ${aDisp} を意味します。y ＝ ${aTerm} ＋ b に代入して切片 b ＝ ${b} を求めます。`
      };
    } else if (pattern === 3) {
      // パターン3: 平行な直線と1点
      const x1 = randInt(-3, 4);
      const y1 = a * x1 + b;
      let bOther = randInt(-7, 7);
      if (bOther === b) bOther = b + 3;
      const bOtherStr = bOther >= 0 ? `＋ ${bOther}` : `－ ${Math.abs(bOther)}`;
      return {
        q: `直線 <span class="problem-body-math">y ＝ ${aTerm} ${bOtherStr}</span> に平行で、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `平行な2直線は「傾きが等しい」ので、求める直線の傾きは ${aDisp}`,
          `求める直線の式を y ＝ ${aTerm} ＋ b とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → b ＝ ${b}`,
          `答: ${ansEq}`
        ],
        exp: `平行な直線どうしは傾きが同じなので、求める直線の傾きは ${aDisp} です。点(${x1}, ${y1})を代入して切片 b ＝ ${b} を求めます。`
      };
    } else if (pattern === 4) {
      // パターン4: xの増加量とyの増加量
      const dx = pickRandom([2, 3]);
      const dy = a * dx;
      const x1 = randInt(-3, 3);
      const y1 = a * x1 + b;
      const dyText = dy > 0 ? `y の値が ${dy} 増加し` : `y の値が ${Math.abs(dy)} 減少し`;
      return {
        q: `x の値が ${dx} 増加するとき ${dyText}、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `変化の割合（傾き）＝ (y の増加量) ÷ (x の増加量) ＝ (${dy}) ÷ (${dx}) ＝ ${aDisp}`,
          `求める直線の式を y ＝ ${aTerm} ＋ b とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → b ＝ ${b}`,
          `答: ${ansEq}`
        ],
        exp: `変化の割合（傾き）＝ ${dy} ÷ ${dx} ＝ ${aDisp}。y ＝ ${aTerm} ＋ b に点(${x1}, ${y1})を代入して b ＝ ${b} を求めます。`
      };
    } else if (pattern === 5) {
      // パターン5: 切片と1点
      const x1 = pickRandom([-3, -2, -1, 1, 2, 3]);
      const y1 = a * x1 + b;
      const bDisp = b < 0 ? `－${Math.abs(b)}` : `${b}`;
      return {
        q: `切片が ${bDisp} で、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `切片が ${bDisp} なので、求める式を y ＝ ax ${bStr} とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ a×(${x1}) ${bStr}`,
          `傾き a について解く: ${x1}a ＝ ${y1 - b} → a ＝ ${aDisp}`,
          `答: ${ansEq}`
        ],
        exp: `切片が ${bDisp} なので y ＝ ax ${bStr} とおき、点(${x1}, ${y1})を代入して a ＝ ${aDisp} を求めます。`
      };
    } else if (pattern === 6) {
      // パターン6: y軸との交点と1点
      const x1 = pickRandom([-3, -2, -1, 1, 2, 3]);
      const y1 = a * x1 + b;
      return {
        q: `y 軸と点 (0, ${b}) で交わり、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `y 軸上の点 (0, ${b}) を通ることから、切片 b ＝ ${b}`,
          `求める式を y ＝ ax ${bStr} とおく`,
          `点 (${x1}, ${y1}) を代入: ${y1} ＝ a×(${x1}) ${bStr} → a ＝ ${aDisp}`,
          `答: ${ansEq}`
        ],
        exp: `y 軸との交点 (0, ${b}) は切片が ${b} であることを表します。点(${x1}, ${y1})を代入して a ＝ ${aDisp} を求めます。`
      };
    } else {
      // パターン7: 2点を通る直線
      const x1 = randInt(-3, 1);
      const x2 = x1 + randInt(2, 4);
      const y1 = a * x1 + b;
      const y2 = a * x2 + b;
      return {
        q: `2点 (${x1}, ${y1})、(${x2}, ${y2}) を通る直線の式を求めなさい。`,
        ans: ansEq,
        steps: [
          `傾き a ＝ (y₂ － y₁) ÷ (x₂ － x₁) ＝ (${y2} － (${y1})) ÷ (${x2} － (${x1})) ＝ ${y2 - y1} ÷ ${x2 - x1} ＝ ${aDisp}`,
          `求める式を y ＝ ${aTerm} ＋ b とおく`,
          `点 (${x1}, ${y1}) を代入して切片 b を求める: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → b ＝ ${b}`,
          `答: ${ansEq}`
        ],
        exp: `2点から傾き a ＝ (${y2}－(${y1})) ÷ (${x2}－(${x1})) ＝ ${aDisp} を求め、y ＝ ${aTerm} ＋ b に代入して b ＝ ${b} を求めます。`
      };
    }
  },
  g2_lfunc_intersect: () => {
    const x = randInt(1, 4);
    const y = randInt(1, 5);
    const a1 = 2;
    const b1 = y - a1 * x;
    const a2 = -1;
    const b2 = y - a2 * x;
    const b1Str = b1 >= 0 ? `＋ ${b1}` : `－ ${Math.abs(b1)}`;
    const b2Str = b2 >= 0 ? `＋ ${b2}` : `－ ${Math.abs(b2)}`;
    return {
      q: `2直線 <span class="problem-body-math">y ＝ 2x ${b1Str}</span> と <span class="problem-body-math">y ＝ －x ${b2Str}</span> の交点の座標を求めなさい。`,
      ans: `(${x}, ${y})`,
      steps: [
        `2直線の交点は連立方程式の解: 2x ${b1Str} ＝ －x ${b2Str}`,
        `移項して解く: 3x ＝ ${b2 - b1} → x ＝ ${x}`,
        `代入して y を求める: y ＝ 2×(${x}) ${b1Str} ＝ ${y}`,
        `答: (${x}, ${y})`
      ],
      exp: `連立方程式として解く: 2x ${b1Str} ＝ －x ${b2Str} → 3x ＝ ${b2 - b1} → x ＝ ${x}。代入して y ＝ ${y}`
    };
  },

  g2_geom_parallel_angles: () => {
    const a = randInt(40, 70);
    const b = randInt(30, 60);
    const ans = a + b;
    return {
      q: `平行な2直線 l, m があります。l と m の間に「くの字」に折れた角があり、上側の角が ${a}°、下側の角が ${b}° のとき、折れ曲がった角 ∠x の大きさを求めなさい。`,
      ans: `∠x ＝ ${ans}°`,
      steps: [
        `折れ曲がり点を通る補助線 (l, m に平行な直線) を引く`,
        `平行線の錯角は等しいので、上側の角は ${a}°、下側の角は ${b}°`,
        `2つの角を合わせる: ∠x ＝ ${a}° ＋ ${b}° ＝ ${ans}°`,
        `答: ∠x ＝ ${ans}°`
      ],
      exp: `折れ曲がり点を通る平行な補助線を引くと、錯角が等しいことから ∠x ＝ ${a}° ＋ ${b}° ＝ ${ans}°`
    };
  },

  g2_geom_polygon_angles: () => {
    const n = pickRandom([5, 6, 8, 10]);
    const nameMap = { 5: '五角形', 6: '六角形', 8: '八角形', 10: '十角形' };
    const ext = 360 / n;
    const intAngle = 180 - ext;
    return {
      q: `正${nameMap[n]}について、次の問いに答えなさい。<br>(1) 1つの外角の大きさを求めなさい。<br>(2) 1つの内角の大きさを求めなさい。`,
      ans: `(1) ${ext}° ,  (2) ${intAngle}°`,
      exp: `多角形の外角の和は常に 360° なので、1つの外角 ＝ 360° ÷ ${n} ＝ ${ext}°。<br>1つの内角 ＝ 180° － ${ext}° ＝ ${intAngle}°`
    };
  },

  g2_geom_triangle_prop: () => {
    const top = randInt(36, 80);
    const base = (180 - top) / 2;
    return {
      q: `AB ＝ AC の二等辺三角形ABCにおいて、頂角 ∠A ＝ ${top}° のとき、底角 ∠B の大きさを求めなさい。`,
      ans: `∠B ＝ ${base}°`,
      exp: `二等辺三角形の底角は等しいので、(180° － ${top}°) ÷ 2 ＝ ${base}°`
    };
  },

  g2_quad_parallelogram: () => {
    const angleA = randInt(65, 85);
    const angleB = 180 - angleA;
    return {
      q: `平行四辺形ABCDにおいて、∠A ＝ ${angleA}° のとき、隣り合う角 ∠B と対角 ∠C の大きさをそれぞれ求めなさい。`,
      ans: `∠B ＝ ${angleB}° ,  ∠C ＝ ${angleA}°`,
      exp: `平行四辺形の隣り合う内角の和は 180° なので ∠B ＝ 180°－${angleA}°＝${angleB}°。対角は等しいので ∠C ＝ ${angleA}°`
    };
  },

  g2_quad_special: () => {
    return {
      q: `四角形について、次の文の空欄に適する四角形の名称を答えなさい。<br>「平行四辺形のうち、4つの辺がすべて等しいものを ( ① ) といい、対角線が ( ② ) に交わる。」`,
      ans: `① ひし形 ,  ② 垂直`,
      exp: `ひし形は4辺が等しい平行四辺形で、対角線が垂直に交わります。`
    };
  },

  g2_prob_dice_coin: () => {
    const sum = pickRandom([5, 6, 7, 8, 9]);
    const outcomes = [];
    for (let d1 = 1; d1 <= 6; d1++) {
      for (let d2 = 1; d2 <= 6; d2++) {
        if (d1 + d2 === sum) outcomes.push([d1, d2]);
      }
    }
    const count = outcomes.length;
    const frac = simplifyFraction(count, 36);
    return {
      q: `大小2個のさいころを同時に投げるとき、出た目の数の和が ${sum} になる確率を求めなさい。`,
      ans: `${frac}`,
      exp: `すべての場合の数は 6×6 ＝ 36通り。和が ${sum} になる組み合わせは ${outcomes.map(o => `(${o[0]},${o[1]})`).join(', ')} の ${count}通り。よって ${count}/36 ＝ ${frac}`
    };
  },

  g2_prob_balls: () => {
    const r = 3;
    const w = 2;
    const total = r + w; // 5
    // 2個同時に取り出す: 5C2 = 10通り
    // 少なくとも1個赤 = 1 - 全て白(2C2 = 1) = 9/10
    return {
      q: `赤玉が 3個、白玉が 2個 入っている袋から、同時に 2個の玉を取り出すとき、少なくとも 1個は赤玉である確率を求めなさい。`,
      ans: `9/10`,
      exp: `取り出し方は全部で (5×4)÷2 ＝ 10通り。2個とも白玉になるのは 1通り。よって 1 － 1/10 ＝ 9/10`
    };
  },

  g2_data_boxplot: () => {
    return {
      q: `11人の生徒のハンドボール投げの記録(m)が以下の通りでした。第1四分位数(Q1)と第3四分位数(Q3)を求めなさい。<br><span class="problem-body-math">[ 12, 14, 15, 17, 19, 21, 23, 25, 26, 28, 30 ]</span>`,
      ans: `第1四分位数: 15 m ,  第3四分位数: 26 m`,
      exp: `中央値(第2四分位数)は 6番目の 21。下位グループ [12, 14, 15, 17, 19] の中央値は 15(Q1)。上位グループ [23, 25, 26, 28, 30] の中央値は 26(Q3)。`
    };
  },

  // --- 中3 ---
  g3_poly_expand_formula: () => {
    const a = randInt(2, 7);
    const b = randNonZero(-6, 6);
    const isSquare = Math.random() > 0.5;
    if (isSquare) {
      const sign = b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
      const mid = 2 * b;
      const last = b * b;
      const ansStr = `x² ${mid >= 0 ? '＋ ' + mid : '－ ' + Math.abs(mid)}x ＋ ${last}`;
      return {
        q: `次の式を展開しなさい。<br><span class="problem-body-math">(x ${sign})²</span>`,
        ans: ansStr,
        steps: [
          `乗法公式 (x＋a)² ＝ x² ＋ 2ax ＋ a² を利用`,
          `代入して計算: ＝ x² ＋ 2×(${b})x ＋ (${b})²`,
          `答: ＝ ${ansStr}`
        ],
        exp: `公式 (x＋a)² ＝ x² ＋ 2ax ＋ a² を利用: x² ＋ 2×(${b})x ＋ (${b})²`
      };
    } else {
      const aStr = a >= 0 ? `＋ ${a}` : `－ ${Math.abs(a)}`;
      const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
      const sum = a + b;
      const prod = a * b;
      const ansStr = `x² ${sum >= 0 ? '＋ ' + sum : '－ ' + Math.abs(sum)}x ${prod >= 0 ? '＋ ' + prod : '－ ' + Math.abs(prod)}`;
      return {
        q: `次の式を展開しなさい。<br><span class="problem-body-math">(x ${aStr})(x ${bStr})</span>`,
        ans: ansStr,
        steps: [
          `乗法公式 (x＋a)(x＋b) ＝ x² ＋ (a＋b)x ＋ ab を利用`,
          `和と積を計算: 和は ${a}＋(${b})＝${sum}、積は (${a})×(${b})＝${prod}`,
          `答: ＝ ${ansStr}`
        ],
        exp: `公式 (x＋a)(x＋b) ＝ x² ＋ (a＋b)x ＋ ab を利用: 和は ${sum}、積は ${prod}`
      };
    }
  },

  g3_poly_common_factor: () => {
    const m = randInt(2, 4);
    const a = randInt(2, 5);
    const ansStr = `${m}a(${a}x ＋ y)`;
    return {
      q: `次の式を因数分解しなさい。<br><span class="problem-body-math">${m * a}ax ＋ ${m}ay</span>`,
      ans: ansStr,
      steps: [
        `各項の共通因数を見つける: 両方の項に ${m}a が含まれる`,
        `共通因数 ${m}a でくくり出す: ＝ ${m}a(${a}x ＋ y)`,
        `答: ＝ ${ansStr}`
      ],
      exp: `共通因数 ${m}a をくくり出す: ${m}a(${a}x ＋ y)`
    };
  },

  g3_poly_factor_formula: () => {
    const a = randInt(1, 6);
    const b = randInt(1, 6);
    const sum = a + b;
    const prod = a * b;
    const isDiff = Math.random() > 0.5;
    if (isDiff) {
      const ansStr = `(x ＋ ${a})(x － ${a})`;
      return {
        q: `次の式を因数分解しなさい。<br><span class="problem-body-math">x² － ${a * a}</span>`,
        ans: ansStr,
        steps: [
          `公式 a² － b² ＝ (a＋b)(a－b) [平方の差] を利用`,
          `${a * a} ＝ ${a}² なので: x² － ${a}²`,
          `答: ＝ ${ansStr}`
        ],
        exp: `平方の差 a²－b² ＝ (a＋b)(a－b) の公式を利用`
      };
    } else {
      const ansStr = `(x ＋ ${a})(x ＋ ${b})`;
      return {
        q: `次の式を因数分解しなさい。<br><span class="problem-body-math">x² ＋ ${sum}x ＋ ${prod}</span>`,
        ans: ansStr,
        steps: [
          `足して ${sum}、かけて ${prod} になる2数を探す`,
          `該当する2数は ${a} と ${b} (${a}＋${b}＝${sum}, ${a}×${b}＝${prod})`,
          `答: ＝ ${ansStr}`
        ],
        exp: `足して ${sum}、かけて ${prod} になる2数は ${a} と ${b}`
      };
    }
  },

  g3_poly_value_calc: () => {
    const x = pickRandom([53, 64, 75]);
    const y = pickRandom([47, 36, 25]);
    const ans = (x + y) * (x - y);
    return {
      q: `x ＝ ${x}、y ＝ ${y} のとき、<span class="problem-body-math">x² － y²</span> の値を因数分解を利用して計算しなさい。`,
      ans: `${ans}`,
      steps: [
        `因数分解の公式を利用: x² － y² ＝ (x ＋ y)(x － y)`,
        `x＝${x}, y＝${y} を代入: (${x} ＋ ${y}) × (${x} － ${y})`,
        `計算する: ${x + y} × ${x - y} ＝ ${ans}`
      ],
      exp: `x² － y² ＝ (x ＋ y)(x － y) ＝ (${x} ＋ ${y})(${x} － ${y}) ＝ ${x + y} × ${x - y} ＝ ${ans}`
    };
  },

  g3_sqrt_basic: () => {
    const a = pickRandom([2, 3, 4, 5]);
    const b = pickRandom([2, 3, 5]);
    const inside = a * a * b;
    return {
      q: `根号の中をできるだけ簡単な自然数にしなさい。<br><span class="problem-body-math">√${inside}</span>`,
      ans: `${a}√${b}`,
      steps: [
        `${inside} を素因数分解する: ${inside} ＝ ${a * a} × ${b} ＝ ${a}² × ${b}`,
        `平方を根号の外に出す: √(${a}² × ${b}) ＝ ${a}√${b}`,
        `答: ＝ ${a}√${b}`
      ],
      exp: `√${inside} ＝ √(${a}² × ${b}) ＝ ${a}√${b}`
    };
  },

  g3_sqrt_rationalize: () => {
    const b = pickRandom([2, 3, 5]);
    const k = randInt(2, 4);
    const num = b * k;
    return {
      q: `次の数の分母を有理化しなさい。<br><span class="problem-body-math">${num} / √${b}</span>`,
      ans: `${k}√${b}`,
      steps: [
        `分母と分子に √${b} をかける: (${num} × √${b}) / (√${b} × √${b})`,
        `分母の根号を外す: ＝ ${num}√${b} / ${b}`,
        `約分する (${num}÷${b}＝${k}): ＝ ${k}√${b}`
      ],
      exp: `分母と分子に √${b} をかける: (${num} × √${b}) / (√${b} × √${b}) ＝ ${num}√${b} / ${b} ＝ ${k}√${b}`
    };
  },

  g3_sqrt_mul_div: () => {
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">√24 × √18</span>`,
      ans: `12√3`,
      steps: [
        `それぞれの根号を簡単にする: √24 ＝ 2√6、√18 ＝ 3√2`,
        `かけ合わせる: 2√6 × 3√2 ＝ 6√12`,
        `√12 ＝ 2√3 を代入して整理: 6 × 2√3 ＝ 12√3`
      ],
      exp: `2√6 × 3√2 ＝ 6√12 ＝ 6 × 2√3 ＝ 12√3`
    };
  },

  g3_sqrt_add_sub: () => {
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">3√5 ＋ √20 － √45</span>`,
      ans: `2√5`,
      steps: [
        `根号の中をできるだけ簡単にする: √20 ＝ 2√5、√45 ＝ 3√5`,
        `式を置き換える: 3√5 ＋ 2√5 － 3√5`,
        `同類項のように係数を計算: (3 ＋ 2 － 3)√5 ＝ 2√5`
      ],
      exp: `根号の中を簡単にする: 3√5 ＋ 2√5 － 3√5 ＝ 2√5`
    };
  },

  g3_qeq_sqrt_method: () => {
    const k = pickRandom([2, 3, 4, 5]);
    const m = randInt(1, 4);
    const x1 = m + k;
    const x2 = m - k;
    return {
      q: `次の方程式を解きなさい。<br><span class="problem-body-math">(x － ${m})² ＝ ${k * k}</span>`,
      ans: `x ＝ ${x1},  x ＝ ${x2}`,
      steps: [
        `両辺の平方根をとる: x － ${m} ＝ ±${k}`,
        `移項して整理: x ＝ ${m} ± ${k}`,
        `それぞれの値を計算: x ＝ ${m}＋${k} ＝ ${x1}、x ＝ ${m}－${k} ＝ ${x2}`,
        `答: x ＝ ${x1},  x ＝ ${x2}`
      ],
      exp: `平方根をとる: x － ${m} ＝ ±${k} → x ＝ ${m} ± ${k} → x ＝ ${x1}, ${x2}`
    };
  },

  g3_qeq_factor_method: () => {
    const a = randInt(1, 5);
    const b = randInt(a + 1, 7);
    const sum = a + b;
    const prod = a * b;
    return {
      q: `次の方程式を因数分解を利用して解きなさい。<br><span class="problem-body-math">x² － ${sum}x ＋ ${prod} ＝ 0</span>`,
      ans: `x ＝ ${a},  x ＝ ${b}`,
      steps: [
        `左辺を因数分解する: (x － ${a})(x － ${b}) ＝ 0`,
        `AB＝0 ならば A＝0 または B＝0: x － ${a} ＝ 0 または x － ${b} ＝ 0`,
        `答: x ＝ ${a},  x ＝ ${b}`
      ],
      exp: `因数分解して (x － ${a})(x － ${b}) ＝ 0 より x ＝ ${a}, ${b}`
    };
  },

  g3_qeq_formula_method: () => {
    return {
      q: `解の公式を用いて、次の方程式を解きなさい。<br><span class="problem-body-math">2x² ＋ 5x － 1 ＝ 0</span>`,
      ans: `x ＝ (－5 ± √33) / 4`,
      steps: [
        `二次方程式 ax² ＋ bx ＋ c ＝ 0 の解の公式: x ＝ (－b ± √(b² － 4ac)) / 2a`,
        `a＝2, b＝5, c＝－1 を代入: x ＝ (－5 ± √(5² － 4×2×(－1))) / (2×2)`,
        `根号の中を計算: 5² － 4×2×(－1) ＝ 25 ＋ 8 ＝ 33`,
        `答: x ＝ (－5 ± √33) / 4`
      ],
      exp: `解の公式 x ＝ (-b ± √(b²-4ac)) / 2a に a=2, b=5, c=-1 を代入: x ＝ (-5 ± √(25 - 4×2×(-1))) / 4 ＝ (-5 ± √33) / 4`
    };
  },

  g3_qeq_word: () => {
    return {
      q: `連続する2つの正の奇数があり、それらの積が 63 である。この2つの奇数を求めなさい。`,
      ans: `7 と 9`,
      steps: [
        `小さい奇数を x とおくと、もう一方は x ＋ 2`,
        `方程式を立式: x(x ＋ 2) ＝ 63 → x² ＋ 2x － 63 ＝ 0`,
        `因数分解して解く: (x ＋ 9)(x － 7) ＝ 0 → x ＝ －9, 7`,
        `正の奇数なので x ＞ 0 より x ＝ 7、もう一方は 7 ＋ 2 ＝ 9`,
        `答: 7 と 9`
      ],
      exp: `小さい奇数を x とおくと、もう一方は x＋2。方程式 x(x＋2) ＝ 63 → x²＋2x－63 ＝ 0 → (x＋9)(x－7) ＝ 0。x＞0 より x＝7。`
    };
  },

  g3_qfunc_formula: () => {
    const a = pickRandom([2, 3, -2, -3]);
    const x = 2;
    const y = a * x * x;
    return {
      q: `y は x の2乗に比例し、x ＝ ${x} のとき y ＝ ${y} です。<br>(1) y を x の式で表しなさい。<br>(2) x ＝ 3 のときの y の値を求めなさい。`,
      ans: `(1) y ＝ ${a}x² ,  (2) y ＝ ${a * 9}`,
      steps: [
        `(1) y ＝ ax² において x＝${x}, y＝${y} を代入: ${y} ＝ a×${x}² → ${y} ＝ ${x * x}a → a ＝ ${a}。よって y ＝ ${a}x²`,
        `(2) y ＝ ${a}x² に x＝3 を代入: y ＝ ${a}×3² ＝ ${a}×9 ＝ ${a * 9}`,
        `答: (1) y ＝ ${a}x² ,  (2) y ＝ ${a * 9}`
      ],
      exp: `y ＝ ax² に x＝${x}, y＝${y} を代入して ${y} ＝ ${x * x}a より a ＝ ${a}。よって y ＝ ${a}x²。x＝3 を代入して y ＝ ${a * 9}`
    };
  },

  g3_qfunc_domain: () => {
    const a = -2;
    return {
      q: `関数 <span class="problem-body-math">y ＝ －2x²</span> において、x の変域が <span class="problem-body-math">－3 ≦ x ≦ 2</span> のときの y の変域を求めなさい。`,
      ans: `－18 ≦ y ≦ 0`,
      steps: [
        `x の変域に 0 を含むか確認: －3 ≦ x ≦ 2 は 0 を含む`,
        `a ＝ －2 ＜ 0 (上に凸の放物線) なので、x＝0 のとき最大値 y＝0`,
        `原点から遠い端点 x＝－3 で最小値: y ＝ －2×(－3)² ＝ －2×9 ＝ －18`,
        `答: －18 ≦ y ≦ 0`
      ],
      exp: `a＜0 の放物線は原点(0, 0)が最大値となり y の最大値は 0。x＝－3 のとき y＝－2×9＝－18(最小値)。よって －18 ≦ y ≦ 0`
    };
  },

  g3_qfunc_rate: () => {
    const a = randInt(2, 4);
    const x1 = 1;
    const x2 = 4;
    const rate = a * (x1 + x2);
    return {
      q: `関数 <span class="problem-body-math">y ＝ ${a}x²</span> について、x の値が ${x1} から ${x2} まで増加するときの変化の割合を求めなさい。`,
      ans: `${rate}`,
      steps: [
        `変化の割合の公式: a(p ＋ q) を利用 (放物線 y ＝ ax² で x が p から q まで変化)`,
        `代入して計算: ＝ ${a} × (${x1} ＋ ${x2}) ＝ ${a} × ${x1 + x2}`,
        `答: ＝ ${rate}`
      ],
      exp: `変化の割合 ＝ a(p＋q) ＝ ${a} × (${x1} ＋ ${x2}) ＝ ${rate}`
    };
  },

  g3_sim_ratio: () => {
    return {
      q: `相似比が 2 : 3 である相似な2つの三角形 ABC と DEF があります。AB ＝ 6cm のとき、対応する辺 DE の長さを求めなさい。`,
      ans: `9 cm`,
      steps: [
        `相似な図形の対応する辺の比は等しい: AB : DE ＝ 2 : 3`,
        `比例式を解く: 6 : DE ＝ 2 : 3 → 2 × DE ＝ 6 × 3 → 2DE ＝ 18`,
        `両辺を 2 で割る: DE ＝ 9 cm`,
        `答: 9 cm`
      ],
      exp: `2 : 3 ＝ 6 : DE より 2DE ＝ 18 → DE ＝ 9 cm`
    };
  },

  g3_sim_area_volume: () => {
    return {
      q: `相似な2つの立体 P と Q があり、相似比は 2 : 3 です。<br>(1) P と Q の表面積の比を求めなさい。<br>(2) P と Q の体積の比を求めなさい。`,
      ans: `(1) 4 : 9 ,  (2) 8 : 27`,
      steps: [
        `(1) 相似比 m : n のとき、面積比は m² : n² ＝ 2² : 3² ＝ 4 : 9`,
        `(2) 相似比 m : n のとき、体積比は m³ : n³ ＝ 2³ : 3³ ＝ 8 : 27`,
        `答: (1) 4 : 9 ,  (2) 8 : 27`
      ],
      exp: `相似比が m : n のとき、面積比は m² : n² ＝ 2² : 3² ＝ 4 : 9、体積比は m³ : n³ ＝ 2³ : 3³ ＝ 8 : 27`
    };
  },

  g3_circle_angle: () => {
    const centerAngle = randInt(70, 130);
    const circumAngle = centerAngle / 2;
    return {
      q: `円Oの弧ABに対する中心角が ${centerAngle}° のとき、同じ弧に対する円周角の大きさを求めなさい。`,
      ans: `${circumAngle}°`,
      steps: [
        `円周角の定理: 1つの弧に対する円周角の大きさは中心角の半分 (1/2)`,
        `計算する: ＝ ${centerAngle}° ÷ 2 ＝ ${circumAngle}°`,
        `答: ＝ ${circumAngle}°`
      ],
      exp: `円周角の定理より、円周角の大きさは中心角の半分です: ${centerAngle}° ÷ 2 ＝ ${circumAngle}°`
    };
  },

  g3_pyth_calc: () => {
    const triples = [
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13]
    ];
    const [a, b, c] = pickRandom(triples);
    return {
      q: `直角をはさむ2辺の長さが ${a}cm, ${b}cm である直角三角形の斜辺の長さを求めなさい。`,
      ans: `${c} cm`,
      steps: [
        `三平方の定理 (ピタゴラスの定理): 斜辺 c² ＝ a² ＋ b²`,
        `代入して計算: c² ＝ ${a}² ＋ ${b}² ＝ ${a * a} ＋ ${b * b} ＝ ${c * c}`,
        `c ＞ 0 より平方根をとる: c ＝ ${c} cm`,
        `答: ${c} cm`
      ],
      exp: `三平方の定理 c² ＝ a² ＋ b² より、c² ＝ ${a}² ＋ ${b}² ＝ ${a * a} ＋ ${b * b} ＝ ${c * c} → c ＝ ${c} cm`
    };
  },

  g3_pyth_special_ratios: () => {
    return {
      q: `直角二等辺三角形の直角をはさむ1辺の長さが 4cm のとき、斜辺の長さを求めなさい。`,
      ans: `4√2 cm`,
      steps: [
        `特別な直角三角形の辺の比: 45°-45°-90° の直角二等辺三角形は 1 : 1 : √2`,
        `斜辺の長さを求める: 4 × √2 ＝ 4√2 cm`,
        `答: 4√2 cm`
      ],
      exp: `45°-45°-90° の直角三角形の辺の比は 1 : 1 : √2 なので、斜辺は 4 × √2 ＝ 4√2 cm`
    };
  },

  // --- 中1: データの活用 (度数分布表) ---
  g1_data_frequency_table: () => {
    const minVal = pickRandom([140, 145, 150]);
    const step = 5;
    const classes = [
      `${minVal} 以上 ${minVal + step} 未満`,
      `${minVal + step} 以上 ${minVal + step * 2} 未満`,
      `${minVal + step * 2} 以上 ${minVal + step * 3} 未満`,
      `${minVal + step * 3} 以上 ${minVal + step * 4} 未満`
    ];
    const f1 = randInt(3, 7);
    const f2 = randInt(8, 14); // 最頻値
    const f3 = randInt(6, 11);
    const f4 = randInt(2, 5);
    const freqs = [f1, f2, f3, f4];
    const total = f1 + f2 + f3 + f4;
    const modeClassMid = minVal + step + step / 2; // 階級値
    const tableHtml = generateFrequencyTableHtml(classes, freqs, total);

    return {
      level: 2,
      q: `右の度数分布表は、あるクラスの生徒の身長をまとめたものです。最も度数の多い階級の「階級値」を求めなさい。`,
      ans: `${modeClassMid} cm`,
      figureHtml: tableHtml,
      steps: [
        `度数が最も多い階級は「${classes[1]}」 (度数: ${f2}人)`,
        `階級値 ＝ (階級の下限 ＋ 上限) ÷ 2 ＝ (${minVal + step} ＋ ${minVal + step * 2}) ÷ 2 ＝ ${modeClassMid} cm`,
        `答: ${modeClassMid} cm`
      ],
      exp: `最頻値（モード）の階級は度数が最大（${f2}人）の「${classes[1]}」です。階級値はその中央の値なので ${modeClassMid} cm です。`
    };
  },

  // --- 中2: 連立方程式 文章題 (完全ランダム化) ---
  g2_simul_word: () => {
    const type = pickRandom(['fruits', 'speed']);
    if (type === 'fruits') {
      const priceA = pickRandom([120, 140, 150, 160, 180]); // りんご
      const priceB = pickRandom([60, 70, 80, 90, 100]);   // みかん
      const countA = randInt(2, 4);
      const countB = randInt(3, 5);
      const total1 = countA * priceA + countB * priceB;
      const countA2 = countA + 1;
      const countB2 = countB - 1;
      const total2 = countA2 * priceA + countB2 * priceB;

      return {
        level: 3,
        q: `りんご 1個とみかん 1個の値段をそれぞれ求めなさい。<br>・りんご ${countA}個とみかん ${countB}個を買うと代金は ${total1}円 です。<br>・りんご ${countA2}個とみかん ${countB2}個を買うと代金は ${total2}円 です。`,
        ans: `りんご: ${priceA} 円 ,  みかん: ${priceB} 円`,
        steps: [
          `りんご1個を x 円、みかん1個を y 円とおく`,
          `連立方程式: { ${countA}x ＋ ${countB}y ＝ ${total1},  ${countA2}x ＋ ${countB2}y ＝ ${total2} }`,
          `加減法で解く: x ＝ ${priceA}, y ＝ ${priceB}`,
          `答: りんご ${priceA} 円 ,  みかん ${priceB} 円`
        ],
        exp: `りんご x 円、みかん y 円として連立方程式を立てて解きます。`
      };
    } else {
      const dist = pickRandom([1800, 2400, 3000]); // m
      const speedWalk = 60; // m/min
      const speedRun = 150; // m/min
      const timeWalk = pickRandom([10, 15, 20]);
      const distWalk = speedWalk * timeWalk;
      const distRun = dist - distWalk;
      const timeRun = distRun / speedRun;
      const totalTime = timeWalk + timeRun;

      return {
        level: 4,
        q: `家から ${dist}m 離れた駅へ向かいました。初めは分速 ${speedWalk}m で歩き、途中から分速 ${speedRun}m で走ったところ、全体で ${totalTime}分 かかりました。歩いた時間と走った時間をそれぞれ求めなさい。`,
        ans: `歩いた時間: ${timeWalk} 分 ,  走った時間: ${timeRun} 分`,
        steps: [
          `歩いた時間を x 分、走った時間を y 分とおく`,
          `時間の関係式: x ＋ y ＝ ${totalTime}`,
          `道のりの関係式: ${speedWalk}x ＋ ${speedRun}y ＝ ${dist}`,
          `連立方程式を解いて: x ＝ ${timeWalk}, y ＝ ${timeRun}`,
          `答: 歩いた時間 ${timeWalk} 分 ,  走った時間 ${timeRun} 分`
        ],
        exp: `時間の方程式と道のりの方程式を連立させて解きます。`
      };
    }
  },

  // --- 中2: 一次関数 グラフ読み取り (SVG図つき) ---
  g2_lfunc_graph_read: () => {
    const a = randNonZero(-3, 3);
    const b = randInt(-3, 3);
    const svg = generateLinearGraphProblemSvg(a, b, 190, 150);
    const aTerm = formatTerm(a, 'x', true);
    const bStr = b !== 0 ? (b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`) : '';
    const ansEq = `y ＝ ${aTerm} ${bStr}`.trim();

    return {
      level: 2,
      q: `右の図の直線について、その直線の式を求めなさい。`,
      ans: ansEq,
      figureHtml: svg,
      steps: [
        `y 軸との交点より、切片は b ＝ ${b}`,
        `グラフから直線の傾き a ＝ (yの増加量)/(xの増加量) を読み取ると a ＝ ${a}`,
        `よって直線の式は y ＝ ${aTerm} ${bStr}`,
        `答: ${ansEq}`
      ],
      exp: `グラフの y 軸との交点から切片 ${b} を読み取り、通る点の座標から傾き ${a} を求めます。`
    };
  },

  // --- 中2: 平行線と角 (SVG図つき) ---
  g2_geom_parallel_chevron: () => {
    const a1 = randInt(35, 65);
    const a2 = randInt(25, 55);
    const ans = a1 + a2;
    const svg = generateParallelChevronSvg(a1, a2, 190, 140);
    return {
      level: 2,
      q: `右の図において、直線 l // m のとき、折れ曲がった角 ∠x の大きさを求めなさい。`,
      ans: `∠x ＝ ${ans}°`,
      figureHtml: svg,
      steps: [
        `折れ曲がり点を通る、l, m に平行な補助線を引く`,
        `平行線の錯角は等しいので、上側の角は ${a1}°、下側の角は ${a2}°`,
        `2つの角を合わせて: ∠x ＝ ${a1}° ＋ ${a2}° ＝ ${ans}°`,
        `答: ∠x ＝ ${ans}°`
      ],
      exp: `平行線の錯角を利用して、∠x ＝ ${a1}° ＋ ${a2}° ＝ ${ans}° となります。`
    };
  },

  // --- 中2: 三角形の外角 (SVG図つき) ---
  g2_geom_triangle_fig: () => {
    const a1 = randInt(40, 65);
    const a2 = randInt(45, 75);
    const ext = a1 + a2;
    const svg = generateTriangleExteriorSvg(a1, a2, 190, 140);
    return {
      level: 1,
      q: `右の図の三角形において、外角 ∠x の大きさを求めなさい。`,
      ans: `∠x ＝ ${ext}°`,
      figureHtml: svg,
      steps: [
        `三角形の外角の性質: 1つの外角の大きさは、それと隣り合わない2つの内角の和に等しい`,
        `∠x ＝ ${a1}° ＋ ${a2}° ＝ ${ext}°`,
        `答: ∠x ＝ ${ext}°`
      ],
      exp: `外角の定理より、∠x ＝ ${a1}° ＋ ${a2}° ＝ ${ext}° です。`
    };
  },

  // --- 中2: 特別な四角形 (完全ランダム化) ---
  g2_quad_special: () => {
    const p = pickRandom([0, 1, 2]);
    if (p === 0) {
      return {
        level: 1,
        q: `四角形について、次の文の空欄に適する四角形の名称を答えなさい。<br>「平行四辺形のうち、4つの辺がすべて等しいものを ( ① ) といい、対角線が ( ② ) に交わる。」`,
        ans: `① ひし形 ,  ② 垂直`,
        steps: [
          `4辺が等しい平行四辺形の定義 ＝ ひし形`,
          `ひし形の対角線の性質 ＝ 垂直に交わる`,
          `答: ① ひし形 ,  ② 垂直`
        ],
        exp: `ひし形は4辺が等しい四角形で、対角線が垂直に交わります。`
      };
    } else if (p === 1) {
      return {
        level: 1,
        q: `四角形について、次の文の空欄に適する語句・四角形の名称を答えなさい。<br>「平行四辺形のうち、4つの角がすべて等しいものを ( ① ) といい、2本の対角線の ( ② ) が等しい。」`,
        ans: `① 長方形 ,  ② 長さ`,
        steps: [
          `4つの角が等しい平行四辺形 ＝ 長方形`,
          `長方形の対角線の性質 ＝ 長さが等しい`,
          `答: ① 長方形 ,  ② 長さ`
        ],
        exp: `長方形は4つの角がすべて直角（90°）の四角形で、対角線の長さが等しいです。`
      };
    } else {
      return {
        level: 2,
        q: `ひし形の性質と長方形の性質をあわせもち、4つの辺がすべて等しく、4つの角もすべて等しい四角形の名称を答えなさい。`,
        ans: `正方形`,
        steps: [
          `4辺が等しく(ひし形の条件)、4角が等しい(長方形の条件)四角形 ＝ 正方形`,
          `答: 正方形`
        ],
        exp: `正方形はひし形と長方形の両方の性質を持ちます。`
      };
    }
  },

  // --- 中2: 確率 (玉の取り出し・完全ランダム化) ---
  g2_prob_balls: () => {
    const red = pickRandom([3, 4]);
    const white = pickRandom([2, 3]);
    const total = red + white;
    const totalPairs = (total * (total - 1)) / 2;
    const whitePairs = (white * (white - 1)) / 2;
    const atLeastOneRed = totalPairs - whitePairs;
    const frac = simplifyFraction(atLeastOneRed, totalPairs);

    return {
      level: 3,
      q: `赤玉が ${red}個、白玉が ${white}個 入っている袋から、同時に 2個の玉を取り出すとき、少なくとも 1個は赤玉である確率を求めなさい。`,
      ans: `${frac}`,
      steps: [
        `すべての取り出し方: ${total}個から2個選ぶ ＝ (${total}×${total-1})÷2 ＝ ${totalPairs} 通り`,
        `2個とも白玉になる取り出し方: (${white}×${white-1})÷2 ＝ ${whitePairs} 通り`,
        `少なくとも1個赤 ＝ 1 － (2個とも白の確率) ＝ 1 － ${whitePairs}/${totalPairs} ＝ ${atLeastOneRed}/${totalPairs} ＝ ${frac}`,
        `答: ${frac}`
      ],
      exp: `余事象（2個とも白玉）を全体の1から引いて求めます: 1 － (${whitePairs}/${totalPairs}) ＝ ${frac}`
    };
  },

  // --- 中2: 箱ひげ図分析 (SVG図つき完全ランダム化) ---
  g2_data_boxplot_svg: () => {
    const medA = randInt(22, 28);
    const qA = [medA - 12, medA - 6, medA, medA + 7, medA + 16];
    const medB = medA + pickRandom([-4, 4]);
    const qB = [medB - 10, medB - 5, medB, medB + 6, medB + 14];
    const minVal = Math.min(qA[0], qB[0]) - 2;
    const maxVal = Math.max(qA[4], qB[4]) + 2;

    const svg = generateBoxplotCompareSvg('A組', qA, 'B組', qB, minVal, maxVal, 220, 100);
    const ansGroup = medA > medB ? 'A組' : 'B組';

    return {
      level: 2,
      q: `右の図は、A組とB組のハンドボール投げの記録を表した箱ひげ図です。中央値（第2四分位数）が大きいのはどちらの組ですか。また、A組の第3四分位数を答えなさい。`,
      ans: `中央値が大きい組: ${ansGroup} ,  A組の第3四分位数: ${qA[3]} m`,
      figureHtml: svg,
      steps: [
        `箱の中の仕切り線（赤線）が中央値を表す: A組 ＝ ${medA}m, B組 ＝ ${medB}m → ${ansGroup} の方が大きい`,
        `箱の右端の線が第3四分位数(Q3)を表す: A組 ＝ ${qA[3]}m`,
        `答: 中央値が大きい組: ${ansGroup} ,  A組の第3四分位数: ${qA[3]} m`
      ],
      exp: `箱ひげ図の中央線が中央値、箱の右端が第3四分位数を示します。`
    };
  },

  // --- 中3: 平方根の乗除 (完全ランダム化) ---
  g3_sqrt_mul_div: () => {
    const p = pickRandom([0, 1]);
    if (p === 0) {
      const base = pickRandom([2, 3, 5]);
      const c = pickRandom([2, 3]);
      const a = base * c;
      const b = base;
      return {
        level: 2,
        q: `次の計算をしなさい。<br><span class="problem-body-math">√${a} × √${b}</span>`,
        ans: `${base}√${c}`,
        steps: [
          `√${a} × √${b} ＝ √(${a} × ${b}) ＝ √(${a * b})`,
          `根号の中を素因数分解: ${a * b} ＝ ${base}² × ${c}`,
          `＝ ${base}√${c}`,
          `答: ${base}√${c}`
        ],
        exp: `√${a} × √${b} ＝ √${a * b} ＝ ${base}√${c}`
      };
    } else {
      const b = pickRandom([2, 3, 5]);
      const k = pickRandom([2, 3, 4]);
      const a = k * b;
      return {
        level: 2,
        q: `次の数の分母を有理化しなさい。<br><span class="problem-body-math">${a} / √${b}</span>`,
        ans: `${k}√${b}`,
        steps: [
          `分母と分子に √${b} をかける: (${a} × √${b}) / (√${b} × √${b})`,
          `＝ (${a}√${b}) / ${b}`,
          `約分する: ＝ ${k}√${b}`,
          `答: ${k}√${b}`
        ],
        exp: `分母と分子に √${b} をかけて有理化します: ${a}/√${b} ＝ ${k}√${b}`
      };
    }
  },

  // --- 中3: 平方根の加減・展開 (完全ランダム化) ---
  g3_sqrt_add_sub: () => {
    const p = pickRandom([0, 1]);
    if (p === 0) {
      const base = pickRandom([2, 3]);
      const c1 = randInt(2, 4);
      const c2 = randInt(1, 3);
      const val1 = c1 * c1 * base;
      const sumCoeff = c1 + c2;
      return {
        level: 2,
        q: `次の計算をしなさい。<br><span class="problem-body-math">√${val1} ＋ ${c2}√${base}</span>`,
        ans: `${sumCoeff}√${base}`,
        steps: [
          `√${val1} を a√b の形に変形: √${val1} ＝ ${c1}√${base}`,
          `同類項をまとめる: ${c1}√${base} ＋ ${c2}√${base} ＝ (${c1} ＋ ${c2})√${base} ＝ ${sumCoeff}√${base}`,
          `答: ${sumCoeff}√${base}`
        ],
        exp: `√${val1} ＝ ${c1}√${base} に変形して加算します。`
      };
    } else {
      const a = pickRandom([5, 6, 7]);
      const b = randInt(1, 3);
      const ans = a - b * b;
      return {
        level: 3,
        q: `次の式を展開して計算しなさい。<br><span class="problem-body-math">(√${a} ＋ ${b})(√${a} － ${b})</span>`,
        ans: `${ans}`,
        steps: [
          `公式 (x＋y)(x－y) ＝ x² － y² を利用`,
          `＝ (√${a})² － ${b}²`,
          `＝ ${a} － ${b * b} ＝ ${ans}`,
          `答: ${ans}`
        ],
        exp: `(√${a}＋${b})(√${a}－${b}) ＝ (√${a})² － ${b}² ＝ ${a} － ${b*b} ＝ ${ans}`
      };
    }
  },

  // --- 中3: 二次方程式 解の公式 (完全ランダム化) ---
  g3_qeq_formula_method: () => {
    const list = [
      { a: 1, b: 3, c: -1, d: 13 },
      { a: 1, b: 5, c: 1, d: 21 },
      { a: 1, b: -3, c: -2, d: 17 },
      { a: 2, b: 5, c: 1, d: 17 },
      { a: 2, b: 3, c: -1, d: 17 },
      { a: 3, b: -1, c: -1, d: 13 }
    ];
    const item = pickRandom(list);
    const a = item.a, b = item.b, c = item.c, d = item.d;
    const aTerm = a === 1 ? 'x²' : `${a}x²`;
    const bTerm = b > 0 ? `＋ ${b}x` : `－ ${Math.abs(b)}x`;
    const cTerm = c > 0 ? `＋ ${c}` : `－ ${Math.abs(c)}`;
    const negB = -b;
    const den = 2 * a;
    const ansStr = den === 2 ? `(${negB} ± √${d}) / 2` : `(${negB} ± √${d}) / ${den}`;

    return {
      level: 3,
      q: `二次方程式 <span class="problem-body-math">${aTerm} ${bTerm} ${cTerm} ＝ 0</span> を解きなさい。`,
      ans: `x ＝ ${ansStr}`,
      steps: [
        `解の公式 x ＝ (-b ± √(b² - 4ac)) / 2a を適用`,
        `a ＝ ${a}, b ＝ ${b}, c ＝ ${c} を代入`,
        `x ＝ (-(${b}) ± √((${b})² - 4×${a}×(${c}))) / (2×${a})`,
        `＝ (${negB} ± √(${b*b} ＋ ${-4*a*c})) / ${den} ＝ (${negB} ± √${d}) / ${den}`,
        `答: x ＝ ${ansStr}`
      ],
      exp: `解の公式 x ＝ (-b ± √(b²-4ac))/(2a) に代入して計算します。`
    };
  },

  // --- 中3: 二次方程式 文章題 (完全ランダム化) ---
  g3_qeq_word: () => {
    const n = randInt(4, 9);
    const prod = n * (n + 1);
    return {
      level: 4,
      q: `連続する2つの正の整数があります。この2つの整数の積が ${prod} であるとき、この2つの整数を求めなさい。`,
      ans: `${n} と ${n + 1}`,
      steps: [
        `小さい方の整数を x とおくと、大きい方は x ＋ 1`,
        `方程式: x(x ＋ 1) ＝ ${prod} → x² ＋ x － ${prod} ＝ 0`,
        `因数分解: (x － ${n})(x ＋ ${n + 1}) ＝ 0`,
        `x > 0 より x ＝ ${n}`,
        `答: ${n} と ${n + 1}`
      ],
      exp: `x(x+1) ＝ ${prod} を解いて正の整数 x ＝ ${n} を求めます。`
    };
  },

  // --- 中3: 二次関数 変域 (完全ランダム化・0挟み) ---
  g3_qfunc_domain: () => {
    const a = randNonZero(-3, 3);
    const xMin = -randInt(2, 4);
    const xMax = randInt(1, 3);
    const yAtMin = a * xMin * xMin;
    const yAtMax = a * xMax * xMax;

    let yMin, yMax;
    if (a > 0) {
      yMin = 0;
      yMax = Math.max(yAtMin, yAtMax);
    } else {
      yMin = Math.min(yAtMin, yAtMax);
      yMax = 0;
    }

    const aStr = a === 1 ? '' : a === -1 ? '-' : ('' + a);

    return {
      level: 3,
      q: `関数 <span class="problem-body-math">y ＝ ${aStr}x²</span> において、x の変域が <span class="problem-body-math">${xMin} ≦ x ≦ ${xMax}</span> のときの y の変域を求めなさい。`,
      ans: `${yMin} ≦ y ≦ ${yMax}`,
      steps: [
        `放物線の頂点 (0, 0) を x の変域が含んでいることに注目！`,
        a > 0 ? `a > 0 なので、x ＝ 0 のとき最小値 0` : `a < 0 なので、x ＝ 0 のとき最大値 0`,
        `x ＝ ${xMin} のとき y ＝ ${a}×(${xMin})² ＝ ${yAtMin}`,
        `x ＝ ${xMax} のとき y ＝ ${a}×(${xMax})² ＝ ${yAtMax}`,
        `答: ${yMin} ≦ y ≦ ${yMax}`
      ],
      exp: `xの変域が0を挟むため、${a > 0 ? '最小値は0' : '最大値は0'}となります。`
    };
  },

  // --- 中3: 相似比と線分 (完全ランダム化) ---
  g3_sim_ratio: () => {
    const m = pickRandom([2, 3, 4]);
    let n = pickRandom([3, 5]);
    if (m === n) n = m + 1;
    const mult = randInt(2, 4);
    const ab = m * mult;
    const de = n * mult;

    return {
      level: 1,
      q: `相似比が ${m} : ${n} である相似な2つの三角形 ABC と DEF があります。AB ＝ ${ab}cm のとき、対応する辺 DE の長さを求めなさい。`,
      ans: `${de} cm`,
      steps: [
        `対応する辺の比は相似比に等しい: AB : DE ＝ ${m} : ${n}`,
        `比例式: ${ab} : DE ＝ ${m} : ${n}`,
        `${m} × DE ＝ ${ab} × ${n} → DE ＝ ${de} cm`,
        `答: ${de} cm`
      ],
      exp: `${m} : ${n} ＝ ${ab} : DE より DE ＝ ${de} cm です。`
    };
  },

  // --- 中3: 相似な三角形 (ピラミッド型SVG図つき) ---
  g3_sim_triangle_fig: () => {
    // AD, DB, DE をランダム化して毎回異なる問題を生成
    const adVal = pickRandom([3, 4, 5, 6]);
    const dbVal = pickRandom([1, 2, 3]);
    const deVal = pickRandom([4, 6, 8, 9, 10, 12]);
    // AD : AB = DE : BC → BC = DE * AB / AD
    const ab = adVal + dbVal;
    const bcVal = Math.round((deVal * ab / adVal) * 10) / 10;
    const svg = generateSimilarityTriangleSvg(adVal, dbVal, 'c', 'd', deVal, 'x', 'x', 180, 130);

    return {
      level: 2,
      q: `右の図において、DE // BC のとき、線分 BC の長さを求めなさい。（AD＝${adVal}, DB＝${dbVal}, DE＝${deVal}）`,
      ans: `BC ＝ ${bcVal} cm`,
      figureHtml: svg,
      steps: [
        `DE // BC より △ADE ∽ △ABC (2組の角がそれぞれ等しい)`,
        `対応する辺の比: AD : AB ＝ DE : BC`,
        `AD ＝ ${adVal}, AB ＝ ${adVal} ＋ ${dbVal} ＝ ${ab}`,
        `${adVal} : ${ab} ＝ ${deVal} : x → x ＝ ${deVal} × ${ab} ÷ ${adVal} ＝ ${bcVal}`,
        `答: BC ＝ ${bcVal} cm`
      ],
      exp: `△ADE ∽ △ABC より AD : AB ＝ DE : BC を解いて ${bcVal} cm を求めます。`
    };
  },

  // --- 中3: 相似 面積比・体積比 (完全ランダム化) ---
  g3_sim_area_volume: () => {
    const m = pickRandom([1, 2, 3]);
    const n = m + pickRandom([1, 2]);
    const areaM = m * m, areaN = n * n;
    const volM = m * m * m, volN = n * n * n;

    return {
      level: 2,
      q: `相似な2つの立体 P と Q があり、その相似比は ${m} : ${n} です。<br>(1) P と Q の表面積の比を求めなさい。<br>(2) P と Q の体積の比を求めなさい。`,
      ans: `(1) ${areaM} : ${areaN} ,  (2) ${volM} : ${volN}`,
      steps: [
        `(1) 相似比 m : n のとき、面積比は m² : n² ＝ ${m}² : ${n}² ＝ ${areaM} : ${areaN}`,
        `(2) 相似比 m : n のとき、体積比は m³ : n³ ＝ ${m}³ : ${n}³ ＝ ${volM} : ${volN}`,
        `答: (1) ${areaM} : ${areaN} ,  (2) ${volM} : ${volN}`
      ],
      exp: `相似比 m:n に対し、面積比は m²:n²、体積比は m³:n³ となります。`
    };
  },

  // --- 中3: 円周角 (SVG図つき) ---
  g3_circle_angle_fig: () => {
    const ans = randInt(35, 65);
    const center = ans * 2;
    const svg = generateInscribedAngleSvg(ans, 180, 160);
    return {
      level: 2,
      q: `右の図において、円Oの円周角 ∠x の大きさを求めなさい。`,
      ans: `∠x ＝ ${ans}°`,
      figureHtml: svg,
      steps: [
        `円周角の定理: 1つの弧に対する円周角の大きさは中心角の半分`,
        `∠x ＝ ${center}° ÷ 2 ＝ ${ans}°`,
        `答: ∠x ＝ ${ans}°`
      ],
      exp: `円周角は中心角の半分なので ${center}° ÷ 2 ＝ ${ans}° です。`
    };
  },

  // --- 中3: 三平方の定理 (SVG図つき完全ランダム化) ---
  g3_pyth_triangle_fig: () => {
    const triplets = [
      { a: 3, b: 4, c: 5 },
      { a: 6, b: 8, c: 10 },
      { a: 5, b: 12, c: 13 }
    ];
    const item = pickRandom(triplets);
    const unknown = pickRandom(['c', 'b']);
    const svg = generatePythagorasTriangleSvg(item.a, item.b, item.c, unknown, 160, 120);
    const ansVal = unknown === 'c' ? item.c : item.b;

    return {
      level: 2,
      q: `右の直角三角形において、辺 x の長さを求めなさい。`,
      ans: `x ＝ ${ansVal} cm`,
      figureHtml: svg,
      steps: [
        `三平方の定理: a² ＋ b² ＝ c² (直角をはさむ2辺の平方の和は斜辺の平方に等しい)`,
        unknown === 'c' ? `x² ＝ ${item.a}² ＋ ${item.b}² ＝ ${item.a*item.a} ＋ ${item.b*item.b} ＝ ${ansVal*ansVal} → x ＝ ${ansVal}` : `x² ＝ ${item.c}² － ${item.a}² ＝ ${item.c*item.c} － ${item.a*item.a} ＝ ${ansVal*ansVal} → x ＝ ${ansVal}`,
        `答: x ＝ ${ansVal} cm`
      ],
      exp: `三平方の定理より x ＝ ${ansVal} cm です。`
    };
  },

  // --- 中3: 特別な直角三角形の比 (完全ランダム化) ---
  g3_pyth_special_ratios: () => {
    const p = pickRandom([0, 1]);
    if (p === 0) {
      const a = randInt(2, 6);
      return {
        level: 2,
        q: `直角二等辺三角形の直角をはさむ2辺の長さがともに ${a}cm のとき、斜辺の長さを求めなさい。`,
        ans: `${a}√2 cm`,
        steps: [
          `45°, 45°, 90° の直角二等辺三角形の辺の比は 1 : 1 : √2`,
          `斜辺 ＝ ${a} × √2 ＝ ${a}√2 cm`,
          `答: ${a}√2 cm`
        ],
        exp: `1 : 1 : √2 の比を利用して斜辺 ${a}√2 cm を求めます。`
      };
    } else {
      const a = randInt(2, 5);
      const hyp = 2 * a;
      return {
        level: 2,
        q: `3つの内角が 30°, 60°, 90° の直角三角形において、最も短い辺が ${a}cm のとき、斜辺の長さを求めなさい。`,
        ans: `${hyp} cm`,
        steps: [
          `30°, 60°, 90° の直角三角形の辺の比は 1 : 2 : √3 (斜辺は最も短い辺の2倍)`,
          `斜辺 ＝ ${a} × 2 ＝ ${hyp} cm`,
          `答: ${hyp} cm`
        ],
        exp: `1 : 2 : √3 の比より、斜辺は最短辺の2倍の ${hyp} cm です。`
      };
    }
  },

  // --- 中3: 標本調査 (完全ランダム化) ---
  g3_sample_estimation: () => {
    const black = pickRandom([100, 200, 300]);
    const sampled = pickRandom([50, 60, 80]);
    const sampleBlack = pickRandom([5, 8, 10]);
    const totalEst = Math.round((black * sampled) / sampleBlack);
    const whiteEst = totalEst - black;

    return {
      level: 3,
      q: `白の碁石がたくさん入っている袋の中に、黒の碁石を ${black}個 入れてよくかき混ぜました。そこから無作為に ${sampled}個 の碁石を取り出したところ、黒の碁石が ${sampleBlack}個 含まれていました。最初に入っていた白の碁石はおよそ何個と推定されますか。四捨五入して百の位までの概数で答えなさい。`,
      ans: `約 ${Math.round(whiteEst / 100) * 100} 個`,
      steps: [
        `全体の碁石の総数を N個 とする`,
        `標本と母集団の比率: N : ${black} ＝ ${sampled} : ${sampleBlack}`,
        `${sampleBlack}N ＝ ${black} × ${sampled} → N ＝ ${totalEst} 個`,
        `白の碁石の数 ＝ ${totalEst} － ${black} ＝ ${whiteEst} ≒ 約 ${Math.round(whiteEst / 100) * 100} 個`,
        `答: 約 ${Math.round(whiteEst / 100) * 100} 個`
      ],
      exp: `標本調査の比例式より、最初に入っていた白碁石は約 ${Math.round(whiteEst / 100) * 100} 個と推定されます。`
    };
  }
};

// サブユニットIDから該当する問題ジェネレーター関数を取得

// ==========================================
// // 単元別ジェネレーター厳密マッピングテーブル
// （他単元の誤混入を100%防止）

const subUnitGeneratorMap = {
  // --- 中1 ---
  'g1_all_mix': ['g1_pos_neg_add_sub', 'g1_pos_neg_mul_div', 'g1_pos_neg_mixed', 'g1_letters_value', 'g1_letters_calc', 'g1_letters_expand', 'g1_eq_basic', 'g1_eq_parentheses', 'g1_eq_word', 'g1_prop_formula', 'g1_inv_formula', 'g1_func_coords', 'g1_plane_sector', 'g1_plane_angles', 'g1_solid_volume', 'g1_solid_surface', 'g1_data_rep', 'g1_data_rel_freq', 'g1_data_frequency_table'],
  'g1_pos_neg_all': ['g1_pos_neg_add_sub', 'g1_pos_neg_mul_div', 'g1_pos_neg_mixed'],
  'g1_pos_neg_add_sub': ['g1_pos_neg_add_sub'],
  'g1_pos_neg_mul_div': ['g1_pos_neg_mul_div'],
  'g1_pos_neg_mixed': ['g1_pos_neg_mixed'],
  'g1_letters_all': ['g1_letters_value', 'g1_letters_calc', 'g1_letters_expand'],
  'g1_letters_value': ['g1_letters_value'],
  'g1_letters_calc': ['g1_letters_calc'],
  'g1_letters_expand': ['g1_letters_expand'],
  'g1_eq_all': ['g1_eq_basic', 'g1_eq_parentheses', 'g1_eq_word'],
  'g1_eq_basic': ['g1_eq_basic'],
  'g1_eq_parentheses': ['g1_eq_parentheses'],
  'g1_eq_word': ['g1_eq_word'],
  'g1_func_all': ['g1_prop_formula', 'g1_inv_formula', 'g1_func_coords'],
  'g1_prop_all': ['g1_prop_formula', 'g1_inv_formula', 'g1_func_coords'],
  'g1_prop_formula': ['g1_prop_formula'],
  'g1_inv_formula': ['g1_inv_formula'],
  'g1_func_coords': ['g1_func_coords'],
  'g1_plane_all': ['g1_plane_sector', 'g1_plane_angles'],
  'g1_plane_sector': ['g1_plane_sector'],
  'g1_plane_angles': ['g1_plane_angles'],
  'g1_solid_all': ['g1_solid_volume', 'g1_solid_surface'],
  'g1_solid_volume': ['g1_solid_volume'],
  'g1_solid_surface': ['g1_solid_surface'],
  'g1_data_all': ['g1_data_rep', 'g1_data_rel_freq', 'g1_data_frequency_table'],
  'g1_data_rep': ['g1_data_rep'],
  'g1_data_rel_freq': ['g1_data_rel_freq', 'g1_data_frequency_table'],

  // --- 中2 ---
  'g2_all_mix': ['g2_poly_add_sub', 'g2_poly_mul_div', 'g2_poly_transform', 'g2_simul_add_sub', 'g2_simul_subst', 'g2_simul_complex', 'g2_simul_word', 'g2_lfunc_rate', 'g2_lfunc_graph', 'g2_lfunc_find_eq', 'g2_lfunc_graph_read', 'g2_lfunc_intersect', 'g2_geom_parallel_angles', 'g2_geom_parallel_chevron', 'g2_geom_polygon_angles', 'g2_geom_triangle_prop', 'g2_geom_triangle_fig', 'g2_quad_parallelogram', 'g2_quad_special', 'g2_prob_dice_coin', 'g2_prob_balls', 'g2_data_boxplot', 'g2_data_boxplot_svg'],
  'g2_poly_all': ['g2_poly_add_sub', 'g2_poly_mul_div', 'g2_poly_transform'],
  'g2_poly_add_sub': ['g2_poly_add_sub'],
  'g2_poly_mul_div': ['g2_poly_mul_div'],
  'g2_poly_transform': ['g2_poly_transform'],
  'g2_simul_all': ['g2_simul_add_sub', 'g2_simul_subst', 'g2_simul_complex', 'g2_simul_word'],
  'g2_simul_add_sub': ['g2_simul_add_sub'],
  'g2_simul_subst': ['g2_simul_subst'],
  'g2_simul_complex': ['g2_simul_complex'],
  'g2_simul_word': ['g2_simul_word'],
  'g2_lfunc_all': ['g2_lfunc_rate', 'g2_lfunc_graph', 'g2_lfunc_find_eq', 'g2_lfunc_graph_read', 'g2_lfunc_intersect'],
  'g2_lfunc_rate': ['g2_lfunc_rate'],
  'g2_lfunc_graph': ['g2_lfunc_graph', 'g2_lfunc_graph_read'],
  'g2_lfunc_find_eq': ['g2_lfunc_find_eq'],
  'g2_lfunc_intersect': ['g2_lfunc_intersect'],
  'g2_geom_all': ['g2_geom_parallel_angles', 'g2_geom_parallel_chevron', 'g2_geom_polygon_angles', 'g2_geom_triangle_prop', 'g2_geom_triangle_fig'],
  'g2_geom_parallel_angles': ['g2_geom_parallel_angles', 'g2_geom_parallel_chevron'],
  'g2_geom_polygon_angles': ['g2_geom_polygon_angles'],
  'g2_geom_triangle_prop': ['g2_geom_triangle_prop', 'g2_geom_triangle_fig'],
  'g2_quad_all': ['g2_quad_parallelogram', 'g2_quad_special'],
  'g2_quad_parallelogram': ['g2_quad_parallelogram'],
  'g2_quad_special': ['g2_quad_special'],
  'g2_prob_all': ['g2_prob_dice_coin', 'g2_prob_balls', 'g2_data_boxplot', 'g2_data_boxplot_svg'],
  'g2_prob_dice_coin': ['g2_prob_dice_coin'],
  'g2_prob_balls': ['g2_prob_balls'],
  'g2_data_boxplot': ['g2_data_boxplot', 'g2_data_boxplot_svg'],

  // --- 中3 ---
  'g3_all_mix': ['g3_poly_expand_formula', 'g3_poly_common_factor', 'g3_poly_factor_formula', 'g3_poly_value_calc', 'g3_sqrt_basic', 'g3_sqrt_rationalize', 'g3_sqrt_mul_div', 'g3_sqrt_add_sub', 'g3_qeq_sqrt_method', 'g3_qeq_factor_method', 'g3_qeq_formula_method', 'g3_qeq_word', 'g3_qfunc_formula', 'g3_qfunc_domain', 'g3_qfunc_rate', 'g3_sim_ratio', 'g3_sim_triangle_fig', 'g3_sim_area_volume', 'g3_circle_angle', 'g3_circle_angle_fig', 'g3_pyth_calc', 'g3_pyth_triangle_fig', 'g3_pyth_special_ratios', 'g3_sample_estimation'],
  'g3_poly_all': ['g3_poly_expand_formula', 'g3_poly_common_factor', 'g3_poly_factor_formula', 'g3_poly_value_calc'],
  'g3_poly_expand_formula': ['g3_poly_expand_formula'],
  'g3_poly_common_factor': ['g3_poly_common_factor'],
  'g3_poly_factor_formula': ['g3_poly_factor_formula'],
  'g3_poly_value_calc': ['g3_poly_value_calc'],
  // ★ 平方根: 厳密に中3平方根ジェネレーターのみを指定！正負の数は絶対混ざらない！
  'g3_sqrt_all': ['g3_sqrt_basic', 'g3_sqrt_rationalize', 'g3_sqrt_mul_div', 'g3_sqrt_add_sub'],
  'g3_sqrt_basic': ['g3_sqrt_basic'],
  'g3_sqrt_rationalize': ['g3_sqrt_rationalize'],
  'g3_sqrt_mul_div': ['g3_sqrt_mul_div'],
  'g3_sqrt_add_sub': ['g3_sqrt_add_sub'],
  'g3_qeq_all': ['g3_qeq_sqrt_method', 'g3_qeq_factor_method', 'g3_qeq_formula_method', 'g3_qeq_word'],
  'g3_qeq_sqrt_method': ['g3_qeq_sqrt_method'],
  'g3_qeq_factor_method': ['g3_qeq_factor_method'],
  'g3_qeq_formula_method': ['g3_qeq_formula_method'],
  'g3_qeq_word': ['g3_qeq_word'],
  'g3_qfunc_all': ['g3_qfunc_formula', 'g3_qfunc_domain', 'g3_qfunc_rate'],
  'g3_qfunc_formula': ['g3_qfunc_formula'],
  'g3_qfunc_domain': ['g3_qfunc_domain'],
  'g3_qfunc_rate': ['g3_qfunc_rate'],
  // ★ 相似
  'g3_sim_all': ['g3_sim_ratio', 'g3_sim_triangle_fig', 'g3_sim_area_volume'],
  'g3_sim_ratio': ['g3_sim_ratio', 'g3_sim_triangle_fig'],
  'g3_sim_midpoint': ['g3_sim_ratio', 'g3_sim_triangle_fig'],
  'g3_sim_area_volume': ['g3_sim_area_volume'],
  // ★ 円
  'g3_circle_all': ['g3_circle_angle', 'g3_circle_angle_fig'],
  'g3_circle_angle': ['g3_circle_angle', 'g3_circle_angle_fig'],
  'g3_circle_tangent': ['g3_circle_angle', 'g3_circle_angle_fig'],
  // ★ 三平方
  'g3_pyth_all': ['g3_pyth_calc', 'g3_pyth_triangle_fig', 'g3_pyth_special_ratios'],
  'g3_pyth_calc': ['g3_pyth_calc', 'g3_pyth_triangle_fig'],
  'g3_pyth_special_ratios': ['g3_pyth_special_ratios'],
  'g3_pyth_plane_space': ['g3_pyth_calc', 'g3_pyth_triangle_fig', 'g3_pyth_special_ratios'],
  // ★ 標本調査
  'g3_sample_all': ['g3_sample_estimation'],
  'g3_sample_estimation': ['g3_sample_estimation']
};

function getGeneratorsForSubUnit(grade, subUnitId) {
  if (subUnitGeneratorMap[subUnitId]) {
    return subUnitGeneratorMap[subUnitId];
  }
  if (problemGenerators[subUnitId]) {
    return [subUnitId];
  }
  const prefix = `g${grade}_`;
  return Object.keys(problemGenerators).filter(k => k.startsWith(prefix));
}


function convertMathToTeX(str) {
  if (!str || typeof str !== 'string') return '';
  let s = str;

  // 1. 全角記号のTeX標準化
  s = s.replace(/＝/g, ' = ');
  s = s.replace(/(^|[\s(])－/g, '$1-');
  s = s.replace(/－/g, ' - ');
  s = s.replace(/＋/g, ' + ');
  s = s.replace(/×/g, ' \\times ');
  s = s.replace(/÷/g, ' \\div ');
  s = s.replace(/±/g, ' \\pm ');
  s = s.replace(/≦/g, ' \\le ');
  s = s.replace(/≧/g, ' \\ge ');
  s = s.replace(/°/g, '^\\circ');
  s = s.replace(/π/g, '\\pi');
  s = s.replace(/∠([A-Za-z0-9]+)/g, '\\angle $1');
  s = s.replace(/△([A-Za-z0-9]+)/g, '\\triangle $1');

  // 2. 累乗
  s = s.replace(/([a-zA-Z0-9\)])²/g, '$1^2');
  s = s.replace(/([a-zA-Z0-9\)])³/g, '$1^3');

  // 3. 平方根
  s = s.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
  s = s.replace(/√([0-9a-zA-Z]+)/g, '\\sqrt{$1}');

  // 4. 分数
  s = s.replace(/\(([^)]+)\)\s*\/\s*([^\s<,()]+)/g, '\\frac{$1}{$2}');
  s = s.replace(/([0-9a-zA-Z\\{}]+)\s*\/\s*([0-9]+)([a-zA-Z])/g, '\\frac{$1}{$2}$3');
  s = s.replace(/([0-9a-zA-Z\\{}]+)\s*\/\s*([0-9a-zA-Z\\{}]+)/g, '\\frac{$1}{$2}');

  return s;
}

// TeX レンダリング（KaTeX使用、万が一の未ロード時はフォールバック）
function renderTeXSafe(tex, displayMode = false) {
  if (typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function') {
    try {
      return window.katex.renderToString(tex, {
        displayMode: displayMode,
        throwOnError: false,
        output: 'html' // MathML重複による文字化け・重なりを防止
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
  // フォールバック
  let fb = tex
    .replace(/\\sqrt\{([^}]+)\}/g, '<span class="math-sqrt-box"><span class="sqrt-sym">√</span><span class="sqrt-num">$1</span></span>')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-frac"><span class="math-num">$1</span><span class="math-den">$2</span></span>')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\le/g, '≦')
    .replace(/\\ge/g, '≧')
    .replace(/([xyabcpqmnktABCD])/g, '<i class="math-var">$1</i>');
  return `<span class="tex-fallback">${fb}</span>`;
}

// 数式テキストの教科書品質リッチフォーマッター (KaTeX TeX組版エンジン & トークン完全隔離)
function formatMathRich(text) {
  if (!text || typeof text !== 'string') return text;

  let s = text;
  const placeholders = [];
  const pushSafe = (html) => {
    placeholders.push(html);
    return `___MATH_TOKEN_${placeholders.length - 1}___`;
  };

  // 1. problem-body-math の中身を TeX レンダリングして即座に隔離
  s = s.replace(/<span class="problem-body-math">([\s\S]*?)<\/span>/g, (m, inner) => {
    const tex = convertMathToTeX(inner);
    const rendered = renderTeXSafe(tex);
    return pushSafe(`<span class="problem-body-math">${rendered}</span>`);
  });

  // 2. 既存の HTML タグ（<br>, <div...>, <i...> 等）をすべて隔離
  s = s.replace(/<[^>]+>/g, (tag) => pushSafe(tag));

  // 2.5. 問題番号・小問番号（(1), (2), ①, ②等）を隔離して数式化から保護
  s = s.replace(/(^|[\s,、。])(\([0-9]+\)|[①-⑩])(?=[\s　]|$)/g, (m, pre, num) => {
    return `${pre}${pushSafe(num)}`;
  });

  // 3. 単位記号（カッコ付き単位および数値直後の単位）を隔離
  s = s.replace(/\((cm²|cm³|cm|mm|km|kg|g|mL|dL|min|sec|m)\)/g, (m, u) => {
    return pushSafe(`(<span class="math-unit">${u}</span>)`);
  });
  s = s.replace(/(?<=[0-9\s]|^)(cm²|cm³|cm|mm|km|kg|mL|dL|min|sec)\b/g, (m, u) => {
    return pushSafe(`<span class="math-unit">${u}</span>`);
  });

  // 4. 連立方程式の解のペア: x ＝ 4, y ＝ 3 や x = -2, y = 5
  s = s.replace(/\b([xyabcpqmnkt])\s*[＝=]\s*([-+－＋]?[0-9/.]+)\s*,\s*([xyabcpqmnkt])\s*[＝=]\s*([-+－＋]?[0-9/.]+)/g, (m, v1, val1, v2, val2) => {
    return pushSafe(renderTeXSafe(`${v1} = ${convertMathToTeX(val1)}, \\; ${v2} = ${convertMathToTeX(val2)}`));
  });

  // 5. 幾何等式・線分等式・角の等式: AB ＝ AC, ∠A ＝ 67°, ∠x ＝ 103°, ∠AOB ＝ 48°, AB ＝ 6cm
  s = s.replace(/(∠[A-Za-z0-9]+|[A-Z]{2})\s*[＝=]\s*([∠A-Za-z0-9°+－＋\-\s/²³√()]+?)(?=[,、。\n<]|$|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]|___MATH_TOKEN_)/g, (m) => {
    return pushSafe(renderTeXSafe(convertMathToTeX(m.trim())));
  });

  // 6. 一般の等式・関数表記: y ＝ 2x ＋ 3, y ＝ -5x, 2x ＋ y ＝ 14, x ＝ 5 など
  s = s.replace(/(?<=^|[\s,、。(])([-+－＋]?[0-9a-zA-Z()²³√/＋－+\-\s]+?)\s*[＝=]\s*([-+－＋]?[0-9a-zA-Z()²³√/＋－+\-\s]+?)(?=[,、。\n<]|$|[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF])/g, (m, left, right) => {
    if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(left) && !/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(right)) {
      const l = left.trim();
      const r = right.trim();
      if (l.length > 0 && r.length > 0) {
        return pushSafe(renderTeXSafe(convertMathToTeX(`${l} = ${r}`)));
      }
    }
    return m;
  });

  // 7. 因数分解・多項式の積: 4a(4x ＋ y), (x ＋ 2)(x － 3), (a ＋ b)²
  s = s.replace(/(?<![a-zA-Z0-9_])([-+－＋]?(?:[0-9]*[a-zA-Z\u03C0])?\([0-9a-zA-Z\u03C0²³√+－＋\-\s/]+\)(?:\([0-9a-zA-Z\u03C0²³√+－＋\-\s/]+\)|²|³)?)(?![a-zA-Z0-9_])/g, (m) => {
    if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(m)) {
      return pushSafe(renderTeXSafe(convertMathToTeX(m.trim())));
    }
    return m;
  });

  // 8. 多項式・計算式: 例: x² ＋ 5x ＋ 6, 3x － 9y, －6x － 1, 9x ＋ 9, 2x － 12y
  s = s.replace(/(?<![a-zA-Z0-9_])([-+－＋]?\s*(?:[0-9]*[a-zA-Z\u03C0](?:²|³|\^[0-9]+)?|[0-9]+)\s*(?:[＋－+×÷\\/]\s*(?:[0-9]*[a-zA-Z\u03C0](?:²|³|\^[0-9]+)?|[0-9]+)\s*)+)(?![a-zA-Z0-9_])/g, (m) => {
    if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(m)) {
      return pushSafe(renderTeXSafe(convertMathToTeX(m.trim())));
    }
    return m;
  });

  // 9. 係数付き円周率: 6π, 36π, 144π
  s = s.replace(/([0-9]+)\s*π/g, (m, num) => {
    return pushSafe(renderTeXSafe(`${num}\\pi`));
  });

  // 10. 単独の幾何記号: ∠A, ∠B, ∠x, △ABC
  s = s.replace(/∠([A-Za-z0-9]+)/g, (m, name) => {
    return pushSafe(renderTeXSafe(`\\angle ${name}`));
  });
  s = s.replace(/△([A-Z]{3})/g, (m, name) => {
    return pushSafe(renderTeXSafe(`\\triangle ${name}`));
  });

  // 11. 係数付き平方根: a√b, 3√5 など
  s = s.replace(/([0-9a-zA-Z])√([0-9a-zA-Z]+)/g, (m, coef, num) => {
    return pushSafe(renderTeXSafe(`${coef}\\sqrt{${num}}`));
  });

  // 12. 平方根: √45
  s = s.replace(/√([0-9a-zA-Z]+)/g, (m, num) => {
    return pushSafe(renderTeXSafe(`\\sqrt{${num}}`));
  });

  // 13. 分数: (A)/(B) や A/B
  s = s.replace(/\(([^)]+)\)\s*\/\s*([^\s<,()]+)/g, (m, num, den) => {
    return pushSafe(renderTeXSafe(`\\frac{${convertMathToTeX(num)}}{${convertMathToTeX(den)}}`));
  });
  s = s.replace(/(?<![a-zA-Z0-9_])([0-9a-zA-Z]+)\s*\/\s*([0-9]+)([a-zA-Z])/g, (m, num, den, v) => {
    return pushSafe(renderTeXSafe(`\\frac{${convertMathToTeX(num)}}{${convertMathToTeX(den)}}${v}`));
  });
  s = s.replace(/(?<![a-zA-Z0-9_])([0-9a-zA-Z]+)\s*\/\s*([0-9a-zA-Z]+)(?![a-zA-Z0-9_])/g, (m, num, den) => {
    return pushSafe(renderTeXSafe(`\\frac{${convertMathToTeX(num)}}{${convertMathToTeX(den)}}`));
  });

  // 14. 累乗: x², y² など
  s = s.replace(/(?<!c|m|k)([xyabcpqmnktABCD])²/g, (m, v) => {
    return pushSafe(renderTeXSafe(`${v}^2`));
  });

  // 15.5 単独の数値・符号付き数値 (小数含む) と 単独の符号
  s = s.replace(/(?<![a-zA-Z0-9_>])([-+－＋ー]?[0-9]+(?:\.[0-9]+)?)(?![a-zA-Z0-9_])/g, (m, num) => {
    // ー（長音記号）が間違って使われている場合もマイナスとして救済
    const cleanNum = num.replace(/ー/g, '－');
    return pushSafe(renderTeXSafe(convertMathToTeX(cleanNum)));
  });
  s = s.replace(/(?<=^|[\s,、。])([-+－＋±ー])(?=[\s,、。]|$)/g, (m, sign) => {
    const cleanSign = sign === 'ー' ? '－' : sign;
    return pushSafe(renderTeXSafe(convertMathToTeX(cleanSign)));
  });

  // 15. 係数付き変数: 5x, -3y (ただし単位 cm, mm 等を除く)
  s = s.replace(/(?<![a-zA-Z0-9_])([-+－＋]?[0-9]+)([xyabcpqmnkt])(?![a-zA-Z0-9_])/g, (m, coef, v) => {
    return pushSafe(renderTeXSafe(convertMathToTeX(`${coef}${v}`)));
  });

  // 16. 単独変数・円周率: x, y, a, b, π
  s = s.replace(/___MATH_TOKEN_\d+___|(?<![a-zA-Z0-9])([xyabcpqmnktπ])(?![a-zA-Z0-9])/g, (m, v) => {
    if (!v) return m;
    if (v === 'π') return pushSafe(renderTeXSafe('\\pi'));
    return pushSafe(renderTeXSafe(v));
  });

  // 17. トークンを再帰的に全復元（安全上限10回ループ）
  let prev;
  let loops = 0;
  do {
    prev = s;
    s = s.replace(/___MATH_TOKEN_(\d+)___/g, (m, idx) => {
      const i = parseInt(idx, 10);
      return placeholders[i] !== undefined ? placeholders[i] : '';
    });
    loops++;
  } while (s !== prev && loops < 10);

  return s;
}

// KaTeX の動的適用（読み込み完了時、安全ガード付き）
function applyKaTeXIfAvailable(element) {
  if (!element) return;
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        ignoredClasses: ['katex', 'katex-html', 'katex-mathml']
      });
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
}

// 練習プリント・小テストの生成実行
function generateQuickTest() {
  const grade = document.getElementById('testGrade')?.value || '2';
  const majorSelect = document.getElementById('testMajorUnit');
  const subSelect = document.getElementById('testSubUnit');
  const countSelect = document.getElementById('testCount');
  const qTypeSelect = document.getElementById('testQuestionType');

  const majorId = majorSelect ? majorSelect.value : 'all';
  const subUnitId = subSelect ? subSelect.value : 'all_mix';
  const count = parseInt(countSelect?.value, 10) || 6;
  const reqDifficulty = qTypeSelect ? qTypeSelect.value : 'all'; // all, level_1, level_2, level_3, level_4

  // カリキュラム情報からタイトル取得
  const gradeUnits = testCurriculum[grade] || [];
  const currentMajor = gradeUnits.find(m => m.id === majorId) || gradeUnits[0];
  const currentSub = currentMajor?.subUnits?.find(s => s.id === subUnitId) || { name: '練習テスト' };

  let subTitle = currentSub.name.replace(/【.*?】/, '').trim();
  const majorName = currentMajor ? currentMajor.name : '数学科';

  let titleLine1, titleLine2;
  if (subTitle.includes('全領域からランダム') || subTitle.includes('全単元からランダム')) {
    titleLine1 = `中学${grade}年　数学`;
    titleLine2 = '総合確認テスト';
  } else if (!subTitle || subTitle === majorName) {
    titleLine1 = `中学${grade}年　数学`;
    titleLine2 = majorName;
  } else {
    titleLine1 = `中学${grade}年　${majorName}`;
    titleLine2 = subTitle;
  }

  // 問題ジェネレーターの選定 (厳密マッピング)
  let availableGenKeys = getGeneratorsForSubUnit(grade, subUnitId);
  if (!availableGenKeys || availableGenKeys.length === 0) {
    availableGenKeys = Object.keys(problemGenerators).filter(k => k.startsWith(`g${grade}_`));
  }

  const questions = [];
  const seenSignatures = new Set();
  const seenAnswers = new Set(); // 解答だけの重複もチェック

  // フェーズ1: 全ジェネレーターをシャッフルして順番に試す（最大50回）
  const shuffledKeys = [...availableGenKeys].sort(() => Math.random() - 0.5);
  let phase1Attempts = 0;
  const phase1Max = count * 50;

  for (let i = 0; questions.length < count && phase1Attempts < phase1Max; i++, phase1Attempts++) {
    const key = shuffledKeys[i % shuffledKeys.length];
    // 学年安全フォールバック: 対象学年以外の問題は絶対に混入させない
    const safeFallbackKey = availableGenKeys.find(k => problemGenerators[k]) || Object.keys(problemGenerators).find(k => k.startsWith(`g${grade}_`));
    const genFn = problemGenerators[key] || problemGenerators[safeFallbackKey];
    const item = genFn ? genFn() : null;
    if (!item) continue;

    // 難易度フィルタリング
    if (reqDifficulty !== 'all') {
      const targetLevel = parseInt(reqDifficulty.replace('level_', ''), 10) || 2;
      const itemLevel = item.level || 2;
      if (Math.abs(itemLevel - targetLevel) > 1) continue;
    }

    // 重複チェック: 問題文テキスト + 解答の組み合わせ
    const rawQText = (item.q || '').replace(/<[^>]+>/g, '').trim();
    const sig = `${rawQText}__ANS__${item.ans}`;

    // 同じシグネチャは絶対スキップ
    if (seenSignatures.has(sig)) continue;
    // 同じ解答もなるべくスキップ（ただしジェネレーターが1つだけの時は許容）
    if (seenAnswers.has(String(item.ans)) && availableGenKeys.length > 1 && seenAnswers.size < count * 0.7) continue;

    seenSignatures.add(sig);
    seenAnswers.add(String(item.ans));

    const fig = item.figureHtml || item.svgHtml || item.tableHtml || '';
    questions.push({
      num: questions.length + 1,
      q: formatMathRich(item.q),
      ans: formatMathRich(item.ans),
      figureHtml: fig,
      steps: item.steps ? item.steps.map(s => formatMathRich(s)) : [],
      exp: item.exp ? formatMathRich(item.exp) : ''
    });
  }

  // フェーズ2: まだ足りない場合は解答重複のみ許可して補充
  if (questions.length < count) {
    for (let i = 0; questions.length < count; i++) {
      const key = shuffledKeys[i % shuffledKeys.length];
      const genFn = problemGenerators[key] || problemGenerators['g1_pos_neg_add_sub'];
      const item = genFn();
      const rawQText = (item.q || '').replace(/<[^>]+>/g, '').trim();
      const sig = `${rawQText}__ANS__${item.ans}`;
      if (seenSignatures.has(sig)) {
        if (i > count * 30) break; // 無限ループ防止
        continue;
      }
      seenSignatures.add(sig);
      const fig = item.figureHtml || item.svgHtml || item.tableHtml || '';
      questions.push({
        num: questions.length + 1,
        q: formatMathRich(item.q),
        ans: formatMathRich(item.ans),
        figureHtml: fig,
        steps: item.steps ? item.steps.map(s => formatMathRich(s)) : [],
        exp: item.exp ? formatMathRich(item.exp) : ''
      });
    }
  }


  const gridClass = count > 6 ? 'test-problem-grid cols-2' : 'test-problem-grid cols-1';
  const titleClass = titleLine2.length > 13 ? ' title-mini' : (titleLine2.length > 8 ? ' title-compact' : '');
  const formattedTitleLine1 = formatMathRich(titleLine1);
  const formattedTitleLine2 = formatMathRich(titleLine2);

  // 1. 生徒用プリント用紙のHTML構築
  const studentEl = document.getElementById('testStudentPaper');
  if (studentEl) {
    studentEl.setAttribute('data-count', count);
    studentEl.innerHTML = `
      <div class="test-paper-header">
        <div class="test-header-line1">${formattedTitleLine1}</div>
        <div class="test-header-line2">
          <div class="test-title-line2${titleClass}">${formattedTitleLine2}</div>
          <div class="test-student-info">
            <div class="student-entry-line">
              <span class="student-grade-label">${grade}年</span>
              <span class="student-entry-item"><span class="student-line num-line"></span>組</span>
              <span class="student-entry-item"><span class="student-line num-line"></span>番</span>
              <span class="student-entry-item name-item">氏名<span class="student-line name-line"></span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="${gridClass}">
        ${questions.map(q => `
          <div class="test-problem-item">
            <div class="problem-header">
              <span class="problem-num">(${q.num})</span>
              <div class="problem-text">${q.q}</div>
            </div>
            ${q.figureHtml ? `<div class="problem-figure-container">${q.figureHtml}</div>` : ''}
            <div class="problem-workspace"></div>
            <div class="problem-answer-line">
              <span class="answer-label">答.</span>
              <span class="problem-answer-fill"></span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    applyKaTeXIfAvailable(studentEl);
  }

  // 2. 先生用模範解答用紙のHTML構築
  const answerEl = document.getElementById('testAnswerPaper');
  if (answerEl) {
    answerEl.setAttribute('data-count', count);
    answerEl.innerHTML = `
      <div class="test-paper-header answer-header">
        <div class="test-header-line1 answer-line1">${formattedTitleLine1}</div>
        <div class="test-header-line2">
          <div class="test-title-line2${titleClass}">【模範解答】${formattedTitleLine2}</div>
        </div>
      </div>

      <div class="${gridClass}">
        ${questions.map(q => `
          <div class="test-problem-item answer-mode">
            <div class="problem-header">
              <span class="problem-num answer-num">(${q.num})</span>
              <div class="problem-text">${q.q}</div>
            </div>
            ${q.figureHtml ? `<div class="problem-figure-container">${q.figureHtml}</div>` : ''}
            
            <div class="answer-box">
              <div class="answer-main">
                <span class="answer-tag">【正答】</span>
                <span class="answer-value">${q.ans}</span>
              </div>
              ${q.steps && q.steps.length > 0 ? `
                <div class="answer-steps-box">
                  <div class="steps-heading"><i class="fa-solid fa-stairs text-danger"></i> 【途中式・解法ステップ】</div>
                  <div class="steps-list">
                    ${q.steps.map(s => `<div class="step-item">・${s}</div>`).join('')}
                  </div>
                </div>
              ` : (q.exp ? `
                <div class="answer-steps-box">
                  <div class="steps-heading"><i class="fa-solid fa-lightbulb text-danger"></i> 【解き方のポイント】</div>
                  <div class="step-item">・${q.exp}</div>
                </div>
              ` : '')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    applyKaTeXIfAvailable(answerEl);
  }
}

// ==========================================
// // 【穴埋め・基礎】展開公式・因数分解の空欄穴埋め
problemGenerators['g3_poly_fill_blank'] = () => {
  const type = randInt(1, 3);
  if (type === 1) {
    const a = randInt(2, 6);
    const b = randInt(2, 6);
    const sum = a + b;
    const prod = a * b;
    return {
      q: `次の空欄 $\\boxed{\\phantom{00}}$ にあてはまる数を入れて、乗法公式を完成させなさい。<br><span class="problem-body-math">$(x + a)(x + b) = x^2 + (\\;\\boxed{\\phantom{a+b}}\\;)x + \\boxed{\\phantom{ab}}$</span><br>【適用】$(x + ${a})(x + ${b}) = x^2 + \\boxed{\\phantom{00}}x + \\boxed{\\phantom{00}}$`,
      ans: `公式: $a+b$, $ab$ ｜ 適用: $x^2 + ${sum}x + ${prod}$`,
      steps: [
        `公式: $(x+a)(x+b) = x^2 + (a+b)x + ab$`,
        `$x$ の係数: $${a} + ${b} = ${sum}$`,
        `定数項: $${a} \\times ${b} = ${prod}$`
      ],
      exp: `和が ${sum}、積が ${prod} となります。`
    };
  } else if (type === 2) {
    const a = randInt(2, 8);
    return {
      q: `乗法公式 $(a - b)^2 = a^2 - 2ab + b^2$ を利用して、次の空欄をうめなさい。<br><span class="problem-body-math">$(x - ${a})^2 = x^2 - \\boxed{\\phantom{00}}x + \\boxed{\\phantom{00}}$</span>`,
      ans: `$x^2 - ${2 * a}x + ${a * a}$`,
      steps: [
        `公式の $-2ab$ にあたる部分: $2 \\times x \\times ${a} = ${2 * a}x$`,
        `公式の $+b^2$ にあたる部分: $${a}^2 = ${a * a}$`
      ],
      exp: `真ん中の項は「2倍」することを忘れないようにしましょう。`
    };
  } else {
    const a = randInt(2, 7);
    return {
      q: `因数分解公式を利用して空欄にあてはまる数を答えなさい。<br><span class="problem-body-math">$x^2 - ${a * a} = (x + \\boxed{\\phantom{0}})(x - \\boxed{\\phantom{0}})$</span>`,
      ans: `$(x + ${a})(x - ${a})$`,
      steps: [
        `平方の差の公式: $a^2 - b^2 = (a+b)(a-b)$`,
        `$${a * a} = ${a}^2$ より、空欄には双方 ${a} が入ります。`
      ],
      exp: `2乗の差は (和)×(差) に因数分解できます。`
    };
  }
};

// 【つまずき克服・工夫】符号ミス・置き換えの利用
problemGenerators['g3_poly_trick_mistake'] = () => {
  const isReplace = Math.random() > 0.4;
  if (isReplace) {
    const mStr = pickRandom(['a+b', 'x-y', 'x+2']);
    const p = randInt(2, 5);
    const q = randInt(2, 5);
    const prod = p * q;
    return {
      q: `【置き換えの工夫】共通な部分に着目して、次の式を展開しなさい。<br><span class="problem-body-math">$(${mStr} + ${p})(${mStr} - ${q})$</span>`,
      ans: `$${mStr}$ を $M$ とおくと、展開の基本公式で計算できます。`,
      steps: [
        `$${mStr} = M$ とおく: $(M + ${p})(M - ${q}) = M^2 + ${p - q}M - ${prod}$`,
        `$M$ をもとの $${mStr}$ に戻して計算を展開・整理します。`
      ],
      exp: `同じまとまりを1つの文字 $M$ とおくことで、乗法公式がそのまま使えます。`
    };
  } else {
    const a = randInt(2, 5);
    const b = randInt(2, 5);
    return {
      q: `【符号注意】負の数のかけ算に注意して、次の式を展開しなさい。<br><span class="problem-body-math">$(-${a}x + ${b})(-${a}x - ${b})$</span>`,
      ans: `$${a * a}x^2 - ${b * b}$`,
      steps: [
        `公式 $(A + B)(A - B) = A^2 - B^2$ において $A = -${a}x$, $B = ${b}$`,
        `$(-${a}x)^2 - (${b})^2 = ${a * a}x^2 - ${b * b}$`
      ],
      exp: `$(-${a}x)^2 = +${a * a}x^2$ と符号が正になる点に注意！`
    };
  }
};

// 【文章題・思考利用】数の性質・証明・図形利用
problemGenerators['g3_poly_word_applied'] = () => {
  const type = randInt(1, 2);
  if (type === 1) {
    return {
      q: `【数の性質の証明】「連続する2つの奇数の積に1を加えた数は、偶数の2乗になる。」このことを、整数 $n$ を用いて証明しなさい。`,
      ans: `$(2n-1)(2n+1) + 1 = 4n^2 = (2n)^2$ より、偶数 $2n$ の2乗となる。`,
      steps: [
        `連続する2つの奇数は整数 $n$ を用いて $2n-1, 2n+1$ と表される。`,
        `積に1を加えると: $(2n-1)(2n+1) + 1 = (4n^2 - 1) + 1 = 4n^2$`,
        `$4n^2 = (2n)^2$ であり、$2n$ は偶数なので、偶数の2乗になる。`
      ],
      exp: `文字式を用いて条件通りに式を作り、目的の形 $(\\text{偶数})^2$ を導きます。`
    };
  } else {
    const r = randInt(3, 8);
    return {
      q: `【図形への利用】半径 $r$ の円形の池のまわりに、幅 $a$ の道がついている。道の面積を $S$、道の真ん中を通る円の周の長さを $\\ell$ とするとき、$S = a\\ell$ となることを証明しなさい。`,
      ans: `$S = \\pi(r+a)^2 - \\pi r^2 = 2\\pi ar + \\pi a^2 = a(2\\pi r + \\pi a) = a\\ell$`,
      steps: [
        `外側の円の半径は $r+a$ なので、$S = \\pi(r+a)^2 - \\pi r^2 = \\pi(2ar + a^2)$`,
        `道の真ん中の円の半径は $r + \\frac{a}{2}$ なので、$\\ell = 2\\pi(r + \\frac{a}{2}) = 2\\pi r + \\pi a$`,
        `よって $a\\ell = a(2\\pi r + \\pi a) = 2\\pi ar + \\pi a^2 = S$ となり成り立つ。`
      ],
      exp: `教科書・学習プリントの重要発展問題です。`
    };
  }
};