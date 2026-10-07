// ==========================================
// 中学校数学 単元シラバス（学習指導要領準拠・時数マスタ）
// ==========================================
const UNIT_SYLLABUS = {
  // --- 中学校第1学年 ---
  'unit_posneg_1': {
    name: '中1: 正の数・負の数（全14時間）',
    grade: '1',
    totalHours: 14,
    hours: [
      { num: 1, title: '正の数・負の数' },
      { num: 2, title: '数直線と絶対値' },
      { num: 3, title: '正負の数の加法①' },
      { num: 4, title: '正負の数の加法②' },
      { num: 5, title: '正負の数の減法' },
      { num: 6, title: '加減の混じった計算' },
      { num: 7, title: '正負の数の乗法' },
      { num: 8, title: '累乗の計算' },
      { num: 9, title: '正負の数の除法' },
      { num: 10, title: '四則混合の計算' },
      { num: 11, title: '分配法則・工夫' },
      { num: 12, title: '正負の数の利用' },
      { num: 13, title: '章末問題演習' },
      { num: 14, title: '単元まとめ' }
    ]
  },
  'unit_letters_1': {
    name: '中1: 文字と式（全11時間）',
    grade: '1',
    totalHours: 11,
    hours: [
      { num: 1, title: '文字を使った式' },
      { num: 2, title: '文字式の表し方①' },
      { num: 3, title: '文字式の表し方②' },
      { num: 4, title: '式の値(代入)' },
      { num: 5, title: '一次式の加法' },
      { num: 6, title: '一次式の減法' },
      { num: 7, title: '一次式と数の乗除' },
      { num: 8, title: 'かっこを含む式の計算' },
      { num: 9, title: '文字式の利用' },
      { num: 10, title: '不等式' },
      { num: 11, title: '単元まとめ' }
    ]
  },
  'unit_linear_1': {
    name: '中1: 一次方程式（全11時間）',
    grade: '1',
    totalHours: 11,
    hours: [
      { num: 1, title: '方程式と解' },
      { num: 2, title: '等式の性質' },
      { num: 3, title: '移項の解法' },
      { num: 4, title: 'かっこを含む式' },
      { num: 5, title: '小数・分数' },
      { num: 6, title: '比の式' },
      { num: 7, title: '文章題①(代金・過不足)' },
      { num: 8, title: '文章題②(速さ・道のり)' },
      { num: 9, title: '文章題③(割合)' },
      { num: 10, title: '確かめ' },
      { num: 11, title: '単元まとめ' }
    ]
  },
  'unit_prop_1': {
    name: '中1: 比例と反比例（全12時間）',
    grade: '1',
    totalHours: 12,
    hours: [
      { num: 1, title: '関数と変域' },
      { num: 2, title: '比例の式 y=ax' },
      { num: 3, title: '座標平面' },
      { num: 4, title: '比例のグラフ' },
      { num: 5, title: '反比例の式 y=a/x' },
      { num: 6, title: '反比例のグラフ' },
      { num: 7, title: '比例・反比例の利用' },
      { num: 8, title: 'グラフの交点・図形' },
      { num: 9, title: '動点と関数' },
      { num: 10, title: '表・式・グラフ' },
      { num: 11, title: '章末問題演習' },
      { num: 12, title: '単元まとめ' }
    ]
  },

  // --- 中学校第2学年 ---
  'unit_poly_2': {
    name: '中2: 式の計算（全10時間）',
    grade: '2',
    totalHours: 10,
    hours: [
      { num: 1, title: '単項式と多項式・次数' },
      { num: 2, title: '同類項の整理' },
      { num: 3, title: '多項式の加法と減法' },
      { num: 4, title: '単項式の乗法と除法' },
      { num: 5, title: '式の値' },
      { num: 6, title: '文字式の利用①(数の性質)' },
      { num: 7, title: '文字式の利用②(図形)' },
      { num: 8, title: '等式の変形①' },
      { num: 9, title: '等式の変形②' },
      { num: 10, title: '単元まとめ' }
    ]
  },
  'unit_equations_2': {
    name: '中2: 連立方程式（全11時間）',
    grade: '2',
    totalHours: 11,
    hours: [
      { num: 1, title: '連立方程式の意味' },
      { num: 2, title: '加減法①' },
      { num: 3, title: '加減法②' },
      { num: 4, title: '代入法' },
      { num: 5, title: 'かっこを含む式' },
      { num: 6, title: '分数・小数' },
      { num: 7, title: 'A=B=Cの形' },
      { num: 8, title: '代金・個数' },
      { num: 9, title: '速さ・道のり' },
      { num: 10, title: '割合の利用' },
      { num: 11, title: '単元まとめ' }
    ]
  },
  'unit_linear_2': {
    name: '中2: 一次関数（全12時間）',
    grade: '2',
    totalHours: 12,
    hours: [
      { num: 1, title: '一次関数の意味' },
      { num: 2, title: '変化の割合' },
      { num: 3, title: 'グラフの特徴' },
      { num: 4, title: '切片と傾き' },
      { num: 5, title: 'グラフのかき方' },
      { num: 6, title: '式の求め方①' },
      { num: 7, title: '式の求め方②' },
      { num: 8, title: '二元一次方程式' },
      { num: 9, title: 'グラフの交点' },
      { num: 10, title: '一次関数の利用①' },
      { num: 11, title: '一次関数の利用②' },
      { num: 12, title: '単元まとめ' }
    ]
  },
  'unit_congruence_2': {
    name: '中2: 平行と合同（全14時間）',
    grade: '2',
    totalHours: 14,
    hours: [
      { num: 1, title: '対頂角・同位角・錯角' },
      { num: 2, title: '平行線と角' },
      { num: 3, title: '三角形の内角と外角' },
      { num: 4, title: '多角形の内角の和' },
      { num: 5, title: '多角形の外角の和' },
      { num: 6, title: '図形の合同' },
      { num: 7, title: '三角形の合同条件' },
      { num: 8, title: '証明の進め方①' },
      { num: 9, title: '証明の進め方②' },
      { num: 10, title: '合同の利用' },
      { num: 11, title: '二等辺三角形の性質' },
      { num: 12, title: '正三角形の性質' },
      { num: 13, title: '直角三角形の合同条件' },
      { num: 14, title: '単元まとめ' }
    ]
  },

  // --- 中学校第3学年 ---
  'unit_poly_3': {
    name: '中3: 多項式と展開・因数分解（全11時間）',
    grade: '3',
    totalHours: 11,
    hours: [
      { num: 1, title: '単項式×多項式' },
      { num: 2, title: '多項式の乗法' },
      { num: 3, title: '乗法公式①' },
      { num: 4, title: '乗法公式②' },
      { num: 5, title: '乗法公式③' },
      { num: 6, title: '共通因数' },
      { num: 7, title: '公式因数分解' },
      { num: 8, title: '置き換え' },
      { num: 9, title: '数の計算利用' },
      { num: 10, title: '式の証明' },
      { num: 11, title: '単元まとめ' }
    ]
  },
  'unit_sqrt_3': {
    name: '中3: 平方根（全10時間）',
    grade: '3',
    totalHours: 10,
    hours: [
      { num: 1, title: '平方根の意味' },
      { num: 2, title: '根号を含む数の大小' },
      { num: 3, title: '有理数と無理数' },
      { num: 4, title: '平方根の乗法・除法' },
      { num: 5, title: 'a√b の形' },
      { num: 6, title: '分母の有理化' },
      { num: 7, title: '平方根の加法・減法' },
      { num: 8, title: '分配法則・式の展開' },
      { num: 9, title: '平方根の利用' },
      { num: 10, title: '単元まとめ' }
    ]
  },
  'unit_quad_3': {
    name: '中3: 二次方程式（全10時間）',
    grade: '3',
    totalHours: 10,
    hours: [
      { num: 1, title: '二次方程式の意味' },
      { num: 2, title: '平方根の解法' },
      { num: 3, title: '平方完成' },
      { num: 4, title: '解の公式導出' },
      { num: 5, title: '解の公式利用' },
      { num: 6, title: '因数分解解法①' },
      { num: 7, title: '因数分解解法②' },
      { num: 8, title: '図形の利用' },
      { num: 9, title: '動点の利用' },
      { num: 10, title: '単元まとめ' }
    ]
  },
  'unit_quadfunc_3': {
    name: '中3: 関数 y=ax²（全9時間）',
    grade: '3',
    totalHours: 9,
    hours: [
      { num: 1, title: 'y=ax² の意味' },
      { num: 2, title: '放物線のグラフ' },
      { num: 3, title: '値の増減と変域' },
      { num: 4, title: '変化の割合' },
      { num: 5, title: '一次関数との比較' },
      { num: 6, title: '放物線と直線の交点' },
      { num: 7, title: '放物線と図形の面積' },
      { num: 8, title: '関数の利用' },
      { num: 9, title: '単元まとめ' }
    ]
  }
};

/**
 * 数学の担当学級（数字-数字、例: 2-1, 2-2）を学年ごとに厳密抽出（研究推進部などの業務は除外）
 */

/**
 * 時間割（ベース時間割）から先生が実際に担当している学年（例: ['2']）を自動抽出
 */
function getTeacherAssignedGrades() {
  const gradesSet = new Set();
  const termKey = state.currentTerm || '2026_first';
  const baseTT = state.baseTimetables?.[termKey] || {};

  Object.values(baseTT).forEach(slotRow => {
    Object.values(slotRow).forEach(s => {
      if (s && s.class && (s.type === 'math' || s.subject === '数学' || s.subject?.includes('数学'))) {
        const cls = s.class.trim();
        const m = cls.match(/^([1-3])[-年]/);
        if (m) gradesSet.add(m[1]);
      }
    });
  });

  if (gradesSet.size === 0) {
    (state.learnedClasses || []).forEach(c => {
      const m = c.match(/^([1-3])[-年]/);
      if (m) gradesSet.add(m[1]);
    });
  }

  if (gradesSet.size === 0) {
    gradesSet.add('2');
  }

  return Array.from(gradesSet).sort();
}

/**
 * 数学の担当学級（数字-数字、例: 2-1, 2-2）を学年ごとに厳密抽出（研究推進部などの業務は除外）
 */
function getMathMarksClasses(targetGrade = '2') {
  const classesSet = new Set();
  const termKey = state.currentTerm || '2026_first';
  const baseTT = state.baseTimetables?.[termKey] || {};

  Object.values(baseTT).forEach(slotRow => {
    Object.values(slotRow).forEach(s => {
      if (s && s.class && (s.type === 'math' || s.subject === '数学' || s.subject?.includes('数学'))) {
        const cls = s.class.trim();
        const p1 = targetGrade + '-';
        const p2 = targetGrade + '年';
        if (cls.startsWith(p1) || cls.startsWith(p2)) {
          classesSet.add(cls);
        }
      }
    });
  });

  if (classesSet.size === 0) {
    (state.learnedClasses || []).forEach(c => {
      if (c.startsWith(targetGrade + '-')) classesSet.add(c);
    });
  }

  // 時間割に該当学年がまだなければ、標準的なクラスセットを提供
  if (classesSet.size === 0) {
    if (targetGrade === '1') ['1-1', '1-2', '1-3'].forEach(c => classesSet.add(c));
    else if (targetGrade === '3') ['3-1', '3-2', '3-3'].forEach(c => classesSet.add(c));
    else ['2-1', '2-2', '2-3', '2-4', '2-6'].forEach(c => classesSet.add(c));
  }

  return Array.from(classesSet).sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));
}

/**
 * 学年ピルボタン切り替え (中1 / 中2 / 中3)
 */
function switchMatrixGrade(grade) {
  state.matrixGrade = String(grade);
  localStorage.setItem('math_portal_matrix_grade', state.matrixGrade);

  // ピルボタンのactive状態更新
  document.querySelectorAll('#matrixGradePillGroup .grade-pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.grade === state.matrixGrade);
  });

  renderProgressMatrixTable();
}

/**
 * 指導進度 & 授業改善メモ ダッシュボードの全体描画
 */
function renderProgressDashboard() {
  updateMatrixExamBadge();
  renderProgressMatrixTable();
  renderMemosList(currentMemoGradeFilter);
}

/**
 * タイトル横の考査カウントダウンバッジの更新 (ユーザー要望: 上部カードを廃止してタイトル横に統合)
 */
function updateMatrixExamBadge() {
  const badgeEl = document.getElementById('matrixExamBadge');
  const textEl = document.getElementById('matrixExamText');
  if (!badgeEl || !textEl) return;

  const exam = state.examSettings || { examName: '中間考査', examDate: '2026-10-23' };
  const targetDate = new Date(exam.examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

  textEl.textContent = (exam.examName || '考査') + 'まで: あと ' + (diffDays > 0 ? diffDays : 0) + ' 日';
  if (diffDays <= 7) {
    badgeEl.style.background = '#fef2f2';
    badgeEl.style.color = '#dc2626';
    badgeEl.style.borderColor = '#fecaca';
  } else {
    badgeEl.style.background = '#ecfdf5';
    badgeEl.style.color = '#059669';
    badgeEl.style.borderColor = '#a7f3d0';
  }
}

/**
 * ② クラス別 指導進度マトリクス表の描画
 */
function renderProgressMatrixTable() {
  const container = document.getElementById('matrixTableContainer');
  const selectEl = document.getElementById('progressUnitSelect');
  const diffBadge = document.getElementById('matrixDiffBadge');
  const pillGroup = document.getElementById('matrixGradePillGroup');
  if (!container) return;

  // 時間割から担当学年を動的検出（担当していない学年のボタンは表示しない）
  const assignedGrades = getTeacherAssignedGrades();
  if (!assignedGrades.includes(state.matrixGrade)) {
    state.matrixGrade = assignedGrades[0];
    localStorage.setItem('math_portal_matrix_grade', state.matrixGrade);
  }
  const curGrade = state.matrixGrade || '2';

  // ピルボタンの動的生成（担当学年が1つだけなら非表示でスッキリ！）
  if (pillGroup) {
    if (assignedGrades.length <= 1) {
      pillGroup.style.display = 'none';
    } else {
      pillGroup.style.display = 'flex';
      pillGroup.innerHTML = assignedGrades.map(g => `
        <button type="button" class="grade-pill-btn ${g === curGrade ? 'active' : ''}" data-grade="${g}" onclick="switchMatrixGrade('${g}')">中${g}</button>
      `).join('');
    }
  }

  // 学年ごとの単元リスト抽出
  const gradeUnits = Object.entries(UNIT_SYLLABUS).filter(([k, u]) => u.grade === curGrade);

  // 学年ごとの選択中単元
  if (!state.gradeSelectedUnits) state.gradeSelectedUnits = {};
  let currentUnitKey = state.gradeSelectedUnits[curGrade];
  if (!currentUnitKey || !UNIT_SYLLABUS[currentUnitKey] || UNIT_SYLLABUS[currentUnitKey].grade !== curGrade) {
    currentUnitKey = gradeUnits[0] ? gradeUnits[0][0] : 'unit_linear_2';
    state.gradeSelectedUnits[curGrade] = currentUnitKey;
  }

  // 単元セレクタのオプション生成 (現在選択学年の単元のみ表示)
  if (selectEl) {
    selectEl.innerHTML = gradeUnits.map(([k, u]) => `
      <option value="${k}" ${k === currentUnitKey ? 'selected' : ''}>${escapeHtml(u.name)}</option>
    `).join('');
  }

  const unitData = UNIT_SYLLABUS[currentUnitKey] || gradeUnits[0][1];

  // 対象クラス取得 (指定学年のみ)
  const classes = getMathMarksClasses(curGrade);

  // 進度データ
  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[currentUnitKey]) {
    state.classProgress[currentUnitKey] = {};
  }
  const progMap = state.classProgress[currentUnitKey];

  // クラスごとの実施済みコマ数・最大差の算出
  let minH = 999;
  let maxH = 0;
  classes.forEach(c => {
    if (typeof progMap[c] !== 'number') {
      progMap[c] = Math.min(5, unitData.totalHours);
    }
    const val = progMap[c];
    if (val < minH) minH = val;
    if (val > maxH) maxH = val;
  });
  if (minH === 999) minH = 0;
  const classDiff = Math.max(0, maxH - minH);

  if (diffBadge) {
    diffBadge.textContent = '最大クラス差: ' + classDiff + 'コマ';
    if (classDiff >= 2) {
      diffBadge.style.background = '#fef2f2';
      diffBadge.style.color = '#dc2626';
      diffBadge.style.border = '1px solid #fecaca';
    } else {
      diffBadge.style.background = '#e0f2fe';
      diffBadge.style.color = '#0284c7';
      diffBadge.style.border = 'none';
    }
  }

  // テーブルHTML生成
  let tableHtml = `
    <table class="progress-matrix-table">
      <thead>
        <tr>
          <th class="matrix-th-class">クラス</th>
  `;

  unitData.hours.forEach(h => {
    const memoKey = currentUnitKey + '_' + h.num;
    const hasMemo = !!(state.hourMemos && state.hourMemos[memoKey]);
    tableHtml += `
      <th class="matrix-th-hour">
        <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
          <span>第${h.num}時</span>
          <button type="button" class="btn btn-ghost" style="padding: 0; font-size: 0.72rem; color: ${hasMemo ? '#f59e0b' : '#94a3b8'}; cursor: pointer;" onclick="openHourMemoModal('${currentUnitKey}', ${h.num})" title="第${h.num}時の改善メモを確認・記録">
            <i class="fa-solid fa-lightbulb"></i>
          </button>
        </div>
        <span class="matrix-hour-title" title="${escapeHtml(h.title)}">${escapeHtml(h.title)}</span>
      </th>
    `;
  });

  tableHtml += `
          <th class="matrix-th-hour" style="min-width: 90px;">進度操作</th>
        </tr>
      </thead>
      <tbody>
  `;

  classes.forEach(cls => {
    const currentDone = progMap[cls] || 0;
    tableHtml += `
      <tr>
        <td class="matrix-td-class">
          <i class="fa-solid fa-chalkboard-user"></i> ${escapeHtml(cls)}
        </td>
    `;

    unitData.hours.forEach(h => {
      const isDone = h.num <= currentDone;
      const isNext = h.num === currentDone + 1;
      const memoKey = currentUnitKey + '_' + h.num;
      const classMemoKey = currentUnitKey + '_' + h.num + '_' + cls;
      const hasMemo = !!(state.hourMemos && (state.hourMemos[memoKey] || state.hourMemos[classMemoKey]));

      let cellClass = 'matrix-cell';
      let cellContent = '';

      if (isDone) {
        // ★ユーザー要望: 緑の●を押したら授業改善メモを記録・確認
        cellClass += ' cell-done';
        cellContent = '<span class="cell-icon" title="実施済：クリックして授業改善メモ・つまずきを記録/確認">●</span>';
      } else if (isNext) {
        // 🚩次はクリックで+1進める
        cellClass += ' cell-next';
        cellContent = '<span class="cell-flag" title="【次の授業】クリックして「実施済」に進める">🚩 次</span>';
      } else {
        // ○未実施はクリックでここまで進める
        cellClass += ' cell-future';
        cellContent = '<span class="cell-icon" title="未実施：クリックしてここまで完了に設定" style="color: #cbd5e1;">○</span>';
      }

      tableHtml += `
        <td class="${cellClass}" onclick="onMatrixCellClicked('${currentUnitKey}', '${cls}', ${h.num})">
          ${cellContent}
          ${hasMemo ? '<span class="cell-memo-indicator" title="改善メモあり"><i class="fa-solid fa-lightbulb"></i></span>' : ''}
        </td>
      `;
    });

    tableHtml += `
        <td class="matrix-actions-cell">
          <div style="display: flex; gap: 3px; justify-content: center;">
            <button type="button" class="btn btn-xs btn-outline" onclick="stepClassProgress('${currentUnitKey}', '${cls}', -1)" title="1コマ戻す" style="padding: 1px 6px; font-size: 0.72rem;">
              -1
            </button>
            <button type="button" class="btn btn-xs btn-primary" onclick="stepClassProgress('${currentUnitKey}', '${cls}', 1)" title="1コマ進める" style="padding: 1px 6px; font-size: 0.72rem;">
              +1
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHtml;
}

/**
 * マスクリック時の振る舞い (ユーザー要望に準拠)
 * - 実施済み（●）: そのコマの授業改善メモモーダルを開く！
 * - 次の授業（🚩次）: このコマを実施済みに進める（+1）
 * - 未実施（○）: ここまで進める
 */
function onMatrixCellClicked(unitKey, cls, hourNum) {
  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[unitKey]) state.classProgress[unitKey] = {};

  const current = state.classProgress[unitKey][cls] || 0;

  if (hourNum <= current) {
    // 実施済みの●をクリック ➔ 授業改善メモモーダルを開く！
    openHourMemoModal(unitKey, hourNum, cls);
  } else if (hourNum === current + 1) {
    // 🚩次をクリック ➔ このコマを実施済みに進める
    stepClassProgress(unitKey, cls, 1);
  } else {
    // 未実施の○をクリック ➔ ここまで進める
    setClassProgressHour(unitKey, cls, hourNum);
  }
}

/**
 * 単元セレクタ変更時
 */
function onProgressUnitChanged() {
  const selectEl = document.getElementById('progressUnitSelect');
  if (selectEl) {
    const curGrade = state.matrixGrade || '2';
    if (!state.gradeSelectedUnits) state.gradeSelectedUnits = {};
    state.gradeSelectedUnits[curGrade] = selectEl.value;
    localStorage.setItem('math_portal_grade_selected_units', JSON.stringify(state.gradeSelectedUnits));
    renderProgressMatrixTable();
  }
}

/**
 * 時間割の最新週案メモから各クラスの進度コマを自動検出して反映
 */
function syncProgressFromTimetable() {
  const curGrade = state.matrixGrade || '2';
  const unitKey = state.gradeSelectedUnits?.[curGrade] || 'unit_linear_2';
  const unitData = UNIT_SYLLABUS[unitKey];
  const classes = getMathMarksClasses(curGrade);

  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[unitKey]) state.classProgress[unitKey] = {};

  let syncedCount = 0;
  const plans = state.lessonPlans || {};

  classes.forEach(cls => {
    let latestHour = 0;
    Object.entries(plans).forEach(([key, plan]) => {
      if (plan && (plan.className === cls || key.includes(cls))) {
        const text = (plan.memo || '') + ' ' + (plan.subjectName || '');
        const match = text.match(/第\s*(\d+)\s*時/);
        if (match) {
          const h = parseInt(match[1], 10);
          if (h > latestHour && h <= (unitData?.totalHours || 20)) {
            latestHour = h;
          }
        }
      }
    });

    if (latestHour > 0) {
      state.classProgress[unitKey][cls] = latestHour;
      syncedCount++;
    }
  });

  localStorage.setItem('math_portal_class_progress', JSON.stringify(state.classProgress));
  renderProgressMatrixTable();

  if (typeof showToast === 'function') {
    if (syncedCount > 0) {
      showToast('<i class="fa-solid fa-arrows-rotate text-success"></i> 時間割の週案から ' + syncedCount + ' クラスの進度を反映しました', 'success');
    } else {
      showToast('<i class="fa-solid fa-circle-info text-primary"></i> 時間割に「第◯時」の記載がある最新コマを検出できませんでした（手動で更新可能です）', 'info');
    }
  }
}

/**
 * マスクリックでそのクラスの進度を設定
 */
function setClassProgressHour(unitKey, cls, hourNum) {
  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[unitKey]) state.classProgress[unitKey] = {};

  state.classProgress[unitKey][cls] = hourNum;
  localStorage.setItem('math_portal_class_progress', JSON.stringify(state.classProgress));
  renderProgressMatrixTable();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
}

/**
 * +1 / -1 で進度を操作
 */
function stepClassProgress(unitKey, cls, delta) {
  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[unitKey]) state.classProgress[unitKey] = {};

  const curGrade = state.matrixGrade || '2';
  const unitData = UNIT_SYLLABUS[unitKey] || UNIT_SYLLABUS['unit_linear_2'];
  const current = state.classProgress[unitKey][cls] || 0;
  const nextVal = Math.max(0, Math.min(unitData.totalHours, current + delta));

  state.classProgress[unitKey][cls] = nextVal;
  localStorage.setItem('math_portal_class_progress', JSON.stringify(state.classProgress));
  renderProgressMatrixTable();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
}

/**
 * コマ別改善メモモーダルを開く (クラス名も表示)
 */
function openHourMemoModal(unitKey, hourNum, className = '') {
  const modal = document.getElementById('hourMemoModal');
  if (!modal) return;

  const unitData = UNIT_SYLLABUS[unitKey] || UNIT_SYLLABUS['unit_linear_2'];
  const hourData = unitData.hours.find(h => h.num === hourNum) || { title: '第' + hourNum + '時' };

  document.getElementById('hourMemoUnitKey').value = unitKey;
  document.getElementById('hourMemoHourNum').value = hourNum;
  const classLabel = className ? '【' + escapeHtml(className) + '】' : '';
  document.getElementById('hourMemoModalTitle').innerHTML = '<i class="fa-solid fa-lightbulb text-amber"></i> ' + classLabel + '第' + hourNum + '時の授業改善メモ';
  document.getElementById('hourMemoTopicName').textContent = classLabel + '第' + hourNum + '時: ' + hourData.title + '（' + unitData.name.split('（')[0] + '）';

  const memoKey = className ? (unitKey + '_' + hourNum + '_' + className) : (unitKey + '_' + hourNum);
  const fallbackKey = unitKey + '_' + hourNum;
  const existingMemo = (state.hourMemos && (state.hourMemos[memoKey] || state.hourMemos[fallbackKey])) || '';
  document.getElementById('hourMemoTextInput').value = existingMemo;
  document.getElementById('hourMemoTextInput').dataset.class = className || '';

  modal.classList.remove('hidden');
}

function closeHourMemoModal() {
  const modal = document.getElementById('hourMemoModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * コマ別改善メモの保存
 */
function saveHourMemo() {
  const unitKey = document.getElementById('hourMemoUnitKey').value;
  const hourNum = Number(document.getElementById('hourMemoHourNum').value);
  const textInput = document.getElementById('hourMemoTextInput');
  const text = textInput.value.trim();
  const cls = textInput.dataset.class || '';

  if (!state.hourMemos) state.hourMemos = {};
  const memoKey = cls ? (unitKey + '_' + hourNum + '_' + cls) : (unitKey + '_' + hourNum);

  if (text) {
    state.hourMemos[memoKey] = text;
    // 下の「授業改善メモ一覧（ナレッジベース）」にも自動連動で蓄積
    const unitData = UNIT_SYLLABUS[unitKey] || UNIT_SYLLABUS['unit_linear_2'];
    const hourData = unitData.hours.find(h => h.num === hourNum) || { title: '第' + hourNum + '時' };
    const classLabel = cls ? ('【' + cls + '】') : '';
    const fullUnitName = classLabel + unitData.name.split('（')[0] + ' 第' + hourNum + '時: ' + hourData.title;

    const existingIdx = (state.memos || []).findIndex(m => m.unit === fullUnitName);
    if (existingIdx !== -1) {
      state.memos[existingIdx].points = text;
      state.memos[existingIdx].date = new Date().toLocaleDateString('ja-JP');
    } else {
      state.memos.unshift({
        id: Date.now(),
        unit: fullUnitName,
        date: new Date().toLocaleDateString('ja-JP'),
        points: text,
        timing: '通常展開',
        nextYear: '実践メモ参照'
      });
    }
    localStorage.setItem('math_portal_memos', JSON.stringify(state.memos));
  } else {
    delete state.hourMemos[memoKey];
  }

  localStorage.setItem('math_portal_hour_memos', JSON.stringify(state.hourMemos));
  closeHourMemoModal();
  renderProgressDashboard();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
  if (typeof showToast === 'function') {
    showToast('<i class="fa-solid fa-floppy-disk text-success"></i> 第' + hourNum + '時の改善メモを保存しました', 'success');
  }
}


function renderMemosList(filterGrade = 'all') {
  currentMemoGradeFilter = filterGrade;
  const container = document.getElementById('memosHistoryGrid');
  const countBadge = document.getElementById('memosCountBadge');
  const countEl = document.getElementById('savedMemosCount');
  const group = document.getElementById('memoGradeFilterGroup');
  if (!container) return;

  // 担当学年の取得（時間割にない学年はボタンに出さない）
  const assignedGrades = typeof getTeacherAssignedGrades === 'function' ? getTeacherAssignedGrades() : ['2'];

  // もし担当学年外が指定されたら 'all' に戻す
  if (filterGrade !== 'all' && !assignedGrades.includes(filterGrade)) {
    filterGrade = 'all';
    currentMemoGradeFilter = 'all';
  }

  // フィルタボタングループの動的更新
  if (group) {
    if (assignedGrades.length <= 1) {
      // 担当学年が1学年（中2のみなど）ならフィルタボタン自体を非表示にしてスッキリ！
      group.style.display = 'none';
      filterGrade = 'all';
      currentMemoGradeFilter = 'all';
    } else {
      group.style.display = 'flex';
      let btnsHtml = `<button type="button" class="memo-filter-btn ${filterGrade === 'all' ? 'active' : ''}" data-grade="all" onclick="filterMemosByGrade('all')">すべて</button>`;
      assignedGrades.forEach(g => {
        btnsHtml += `<button type="button" class="memo-filter-btn ${filterGrade === g ? 'active' : ''}" data-grade="${g}" onclick="filterMemosByGrade('${g}')">中${g}</button>`;
      });
      group.innerHTML = btnsHtml;
    }
  }

  // メモリストのフィルタリング（未定義エラーを完全防止）
  let filtered = state.memos || [];
  if (filterGrade !== 'all') {
    filtered = filtered.filter(m => {
      const u = m.unit || '';
      return u.includes(`中${filterGrade}`) || u.startsWith(`${filterGrade}年`) || u.startsWith(`${filterGrade}-`);
    });
  }

  if (countBadge) countBadge.textContent = `${filtered.length} 件`;
  if (countEl) countEl.textContent = `${(state.memos || []).length} 件`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b;">
        <i class="fa-solid fa-lightbulb" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
        この学年の授業改善メモはまだありません。<br>
        マトリクス表の緑の「<strong>● 済</strong>」をクリックするか、上部の「<strong class="text-primary">＋ 改善メモを新規記録</strong>」からメモを残せます！
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(m => {
    const unitBadgeText = m.unit?.includes(':') ? m.unit.split(':')[0] : '実践知';
    return `
      <div class="memo-card">
        <div class="memo-card-header">
          <span><i class="fa-regular fa-calendar"></i> ${escapeHtml(m.date || '')}</span>
          <span class="memo-unit-badge"><i class="fa-solid fa-bookmark"></i> ${escapeHtml(unitBadgeText)}</span>
        </div>
        <div class="memo-card-title">${escapeHtml(m.unit || '単元メモ')}</div>
        <div class="memo-card-body">
          <div style="margin-bottom: 0.5rem;">
            <strong style="color: #d97706; display: block; margin-bottom: 2px;">
              <i class="fa-solid fa-lightbulb"></i> つまずき・生徒の反応:
            </strong>
            <div>${escapeHtml(m.points || '（特になし）')}</div>
          </div>
          <div style="margin-bottom: 0.5rem;">
            <strong style="color: #0284c7; display: block; margin-bottom: 2px;">
              <i class="fa-solid fa-stopwatch"></i> 時間配分・展開:
            </strong>
            <div>${escapeHtml(m.timing || '（特になし）')}</div>
          </div>
          <div>
            <strong style="color: #059669; display: block; margin-bottom: 2px;">
              <i class="fa-solid fa-seedling"></i> 次回・来年度への改善点:
            </strong>
            <div>${escapeHtml(m.nextYear || '（特になし）')}</div>
          </div>
        </div>

        <div class="memo-card-actions">
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-xs btn-outline" onclick="openWorksheetForUnit('${escapeHtml(m.unit || '')}')" title="この単元の授業プリント作成画面を開く" style="font-size: 0.72rem; padding: 0.18rem 0.5rem;">
              <i class="fa-solid fa-file-pen text-primary"></i> プリント作成
            </button>
          </div>
          <div style="display: flex; gap: 0.35rem;">
            <button type="button" class="btn btn-xs btn-ghost text-secondary" onclick="openProgressMemoModal(${m.id})" title="編集" style="font-size: 0.72rem; padding: 0.18rem 0.45rem;">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button type="button" class="btn btn-xs btn-ghost text-danger" onclick="deleteProgressMemo(${m.id})" title="削除" style="font-size: 0.72rem; padding: 0.18rem 0.45rem;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 改善メモ作成・編集モーダルを開く
 */
function openProgressMemoModal(memoId = null) {
  const modal = document.getElementById('memoEditModal');
  if (!modal) return;

  const idInput = document.getElementById('editingMemoId');
  const unitInput = document.getElementById('memoUnitInput');
  const dateInput = document.getElementById('memoDateInput');
  const pointsInput = document.getElementById('memoPointsInput');
  const timingInput = document.getElementById('memoTimingInput');
  const nextInput = document.getElementById('memoNextYearInput');
  const titleEl = document.getElementById('memoModalTitle');

  if (memoId) {
    const memo = state.memos.find(m => m.id === memoId);
    if (memo) {
      if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square text-amber"></i> 授業改善メモを編集';
      if (idInput) idInput.value = memo.id;
      if (unitInput) unitInput.value = memo.unit || '';
      if (dateInput) {
        const dStr = (memo.date || '').replace(/\//g, '-');
        dateInput.value = dStr;
      }
      if (pointsInput) pointsInput.value = memo.points || '';
      if (timingInput) timingInput.value = memo.timing || '';
      if (nextInput) nextInput.value = memo.nextYear || '';
    }
  } else {
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-lightbulb text-amber"></i> 授業改善メモを新規記録';
    if (idInput) idInput.value = '';
    if (unitInput) unitInput.value = '';
    if (dateInput) {
      const now = new Date();
      dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    if (pointsInput) pointsInput.value = '';
    if (timingInput) timingInput.value = '';
    if (nextInput) nextInput.value = '';
  }

  modal.classList.remove('hidden');
}

function closeProgressMemoModal() {
  const modal = document.getElementById('memoEditModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * モーダルからのメモ保存
 */
function saveProgressMemoFromModal() {
  const idInput = document.getElementById('editingMemoId');
  const unit = document.getElementById('memoUnitInput')?.value.trim() || '単元メモ';
  const dateRaw = document.getElementById('memoDateInput')?.value || new Date().toISOString().split('T')[0];
  const dateFormatted = dateRaw.replace(/-/g, '/');
  const points = document.getElementById('memoPointsInput')?.value.trim() || '';
  const timing = document.getElementById('memoTimingInput')?.value.trim() || '';
  const nextYear = document.getElementById('memoNextYearInput')?.value.trim() || '';

  const editingId = idInput?.value ? Number(idInput.value) : null;

  if (editingId) {
    const idx = state.memos.findIndex(m => m.id === editingId);
    if (idx !== -1) {
      state.memos[idx] = {
        ...state.memos[idx],
        unit,
        date: dateFormatted,
        points,
        timing,
        nextYear
      };
    }
  } else {
    const newMemo = {
      id: Date.now(),
      unit,
      date: dateFormatted,
      points,
      timing,
      nextYear
    };
    state.memos.unshift(newMemo);
  }

  localStorage.setItem('math_portal_memos', JSON.stringify(state.memos));
  closeProgressMemoModal();
  renderProgressDashboard();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
  if (typeof showToast === 'function') {
    showToast('<i class="fa-solid fa-floppy-disk text-success"></i> 授業改善メモを保存しました', 'success');
  }
}

/**
 * メモ削除
 */
function deleteProgressMemo(memoId) {
  if (!confirm('この授業改善メモを削除してもよろしいですか？')) return;
  state.memos = state.memos.filter(m => m.id !== memoId);
  localStorage.setItem('math_portal_memos', JSON.stringify(state.memos));
  renderProgressDashboard();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
  if (typeof showToast === 'function') {
    showToast('<i class="fa-solid fa-trash-can text-danger"></i> メモを削除しました', 'info');
  }
}

/**
 * 学年フィルタ切り替え
 */
function filterMemosByGrade(grade) {
  renderMemosList(grade);
}

/**
 * メモから授業プリント作成を開く
 */
function openWorksheetForUnit(unitName) {
  switchTab('worksheet');
  if (typeof extractGradeFromClassName === 'function') {
    const grade = extractGradeFromClassName(unitName);
    const gradeSelect = document.getElementById('sheetGradeSelect');
    if (gradeSelect) {
      gradeSelect.value = grade;
      if (typeof onGradeChanged === 'function') onGradeChanged();
    }
  }
  if (typeof showToast === 'function') {
    showToast(`<i class="fa-solid fa-file-pen text-primary"></i> ${escapeHtml(unitName)} の授業プリント作成を開きました`, 'info');
  }
}

// 既存コード互換用
function savePdcaMemo() {
  saveProgressMemoFromModal();
}


// 授業用タイマー

function setupTimer() {
  const triggerBtn = document.getElementById('openTimerBtn');
  if (triggerBtn) {
    triggerBtn.addEventListener('click', openTimerModal);
  }
}

function openTimerModal() {
  document.getElementById('timerModal').classList.remove('hidden');
}

function closeTimerModal() {
  document.getElementById('timerModal').classList.add('hidden');
}

function updateTimerDisplay() {
  const m = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
  const s = (state.timerSeconds % 60).toString().padStart(2, '0');
  const timeStr = `${m}:${s}`;

  const elHuge = document.getElementById('timerDisplayHuge');
  const elShort = document.getElementById('timerDisplayShort');
  if (elHuge) elHuge.textContent = timeStr;
  if (elShort) elShort.textContent = timeStr;

  if (state.timerSeconds <= 30 && state.timerSeconds > 0) {
    if (elHuge) elHuge.style.color = '#ef4444';
  } else {
    if (elHuge) elHuge.style.color = 'inherit';
  }
}

function toggleTimer() {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    document.getElementById('timerStartBtn').textContent = 'スタート';
    document.getElementById('timerStartBtn').classList.remove('btn-danger');
  } else {
    if (state.timerSeconds <= 0) return;
    state.timerRunning = true;
    document.getElementById('timerStartBtn').textContent = '一時停止';
    document.getElementById('timerStartBtn').classList.add('btn-danger');

    state.timerInterval = setInterval(() => {
      if (state.timerSeconds > 0) {
        state.timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        playTimerAlarm();
        document.getElementById('timerStartBtn').textContent = 'スタート';
        document.getElementById('timerStartBtn').classList.remove('btn-danger');
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerSeconds = state.timerTotal;
  updateTimerDisplay();
  const startBtn = document.getElementById('timerStartBtn');
  if (startBtn) {
    startBtn.textContent = 'スタート';
    startBtn.classList.remove('btn-danger');
  }
}

function adjustTimer(sec) {
  state.timerSeconds = Math.max(0, state.timerSeconds + sec);
  state.timerTotal = state.timerSeconds;
  updateTimerDisplay();
}

function setTimerSeconds(sec) {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerSeconds = sec;
  state.timerTotal = sec;
  updateTimerDisplay();
  const startBtn = document.getElementById('timerStartBtn');
  if (startBtn) {
    startBtn.textContent = 'スタート';
    startBtn.classList.remove('btn-danger');
  }
}

function playTimerAlarm() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.8);
  } catch (e) {
    console.log('Audio error:', e);
  }
}

// ==========================================
// // 全データバックアップ・復元 (JSONファイル保存 & 読み込み)