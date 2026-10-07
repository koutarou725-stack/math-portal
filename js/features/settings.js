// ==========================================
// 中学校数学 単元シラバス（学習指導要領準拠・時数マスタ）
// ==========================================
const UNIT_SYLLABUS = {
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
      { num: 6, title: '比例式' },
      { num: 7, title: '代金・過不足' },
      { num: 8, title: '速さの問題' },
      { num: 9, title: '割合の問題' },
      { num: 10, title: '確かめ' },
      { num: 11, title: '単元まとめ' }
    ]
  }
};

/**
 * 数学の担当学級（数字-数字、例: 2-1, 2-2）のみを抽出（研究推進部などの業務は除外）
 */
function getMathMarksClasses() {
  const classesSet = new Set();
  const termKey = state.currentTerm || '2026_first';
  const baseTT = state.baseTimetables?.[termKey] || {};

  Object.values(baseTT).forEach(slotRow => {
    Object.values(slotRow).forEach(s => {
      if (s && s.class && (s.type === 'math' || s.subject === '数学' || s.subject?.includes('数学'))) {
        const cls = s.class.trim();
        if (/^[1-3]-[1-9]$/.test(cls) || /^[1-3]年[1-9]組$/.test(cls)) {
          classesSet.add(cls);
        }
      }
    });
  });

  if (classesSet.size === 0) {
    (state.learnedClasses || []).forEach(c => {
      if (/^[1-3]-[1-9]$/.test(c)) classesSet.add(c);
    });
  }
  if (classesSet.size === 0) {
    ['2-1', '2-2', '2-3', '2-4'].forEach(c => classesSet.add(c));
  }

  return Array.from(classesSet).sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));
}

/**
 * 指導進度 & 授業改善メモ ダッシュボードの全体描画
 */
function renderProgressDashboard() {
  renderProgressSummaryRow();
  renderProgressMatrixTable();
  renderMemosList(currentMemoGradeFilter);
}

/**
 * ② クラス別 指導進度マトリクス表の描画（ユーザー要望: 縦軸=クラス、横軸=授業内容・コマ、●/🚩でクラス差可視化）
 */
function renderProgressMatrixTable() {
  const container = document.getElementById('matrixTableContainer');
  const selectEl = document.getElementById('progressUnitSelect');
  const diffBadge = document.getElementById('matrixDiffBadge');
  if (!container) return;

  const currentUnitKey = state.currentProgressUnit || 'unit_linear_2';
  const unitData = UNIT_SYLLABUS[currentUnitKey] || UNIT_SYLLABUS['unit_linear_2'];

  // 単元セレクタのオプション生成
  if (selectEl && selectEl.options.length === 0) {
    selectEl.innerHTML = Object.entries(UNIT_SYLLABUS).map(([k, u]) => `
      <option value="${k}" ${k === currentUnitKey ? 'selected' : ''}>${escapeHtml(u.name)}</option>
    `).join('');
  } else if (selectEl) {
    selectEl.value = currentUnitKey;
  }

  // 対象クラス取得
  const classes = getMathMarksClasses();

  // 進度データの初期化・取得
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
      progMap[c] = Math.min(5, unitData.totalHours); // デフォルト初期値
    }
    const val = progMap[c];
    if (val < minH) minH = val;
    if (val > maxH) maxH = val;
  });
  if (minH === 999) minH = 0;
  const classDiff = Math.max(0, maxH - minH);

  if (diffBadge) {
    diffBadge.textContent = `最大クラス差: ${classDiff}コマ`;
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
    const memoKey = `${currentUnitKey}_${h.num}`;
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
      const memoKey = `${currentUnitKey}_${h.num}`;
      const hasMemo = !!(state.hourMemos && state.hourMemos[memoKey]);

      let cellClass = 'matrix-cell';
      let cellContent = '';

      if (isDone) {
        cellClass += ' cell-done';
        cellContent = `<span class="cell-icon" title="実施済（クリックでここまで完了に設定）">●</span>`;
      } else if (isNext) {
        cellClass += ' cell-next';
        cellContent = `<span class="cell-flag" title="【次の授業】ここからスタート">🚩 次</span>`;
      } else {
        cellClass += ' cell-future';
        cellContent = `<span class="cell-icon" title="未実施（クリックでここまで完了に設定）" style="color: #cbd5e1;">○</span>`;
      }

      tableHtml += `
        <td class="${cellClass}" onclick="setClassProgressHour('${currentUnitKey}', '${cls}', ${h.num})">
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
 * 単元セレクタ変更時
 */
function onProgressUnitChanged() {
  const selectEl = document.getElementById('progressUnitSelect');
  if (selectEl) {
    state.currentProgressUnit = selectEl.value;
    localStorage.setItem('math_portal_current_progress_unit', state.currentProgressUnit);
    renderProgressMatrixTable();
  }
}

/**
 * マスクリックでそのクラスの進度を設定
 */
function setClassProgressHour(unitKey, cls, hourNum) {
  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[unitKey]) state.classProgress[unitKey] = {};

  const current = state.classProgress[unitKey][cls] || 0;
  // すでにそのコマが完了なら、そのコマをクリックしたらその手前に戻すトグル機能
  if (current === hourNum) {
    state.classProgress[unitKey][cls] = Math.max(0, hourNum - 1);
  } else {
    state.classProgress[unitKey][cls] = hourNum;
  }

  localStorage.setItem('math_portal_class_progress', JSON.stringify(state.classProgress));
  renderProgressMatrixTable();
  renderProgressSummaryRow();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
}

/**
 * +1 / -1 で進度を操作
 */
function stepClassProgress(unitKey, cls, delta) {
  if (!state.classProgress) state.classProgress = {};
  if (!state.classProgress[unitKey]) state.classProgress[unitKey] = {};

  const unitData = UNIT_SYLLABUS[unitKey] || UNIT_SYLLABUS['unit_linear_2'];
  const current = state.classProgress[unitKey][cls] || 0;
  const nextVal = Math.max(0, Math.min(unitData.totalHours, current + delta));

  state.classProgress[unitKey][cls] = nextVal;
  localStorage.setItem('math_portal_class_progress', JSON.stringify(state.classProgress));
  renderProgressMatrixTable();
  renderProgressSummaryRow();
  if (typeof triggerAutoCloudSync === 'function') triggerAutoCloudSync();
}

/**
 * コマ別改善メモモーダルを開く
 */
function openHourMemoModal(unitKey, hourNum) {
  const modal = document.getElementById('hourMemoModal');
  if (!modal) return;

  const unitData = UNIT_SYLLABUS[unitKey] || UNIT_SYLLABUS['unit_linear_2'];
  const hourData = unitData.hours.find(h => h.num === hourNum) || { title: `第${hourNum}時` };

  document.getElementById('hourMemoUnitKey').value = unitKey;
  document.getElementById('hourMemoHourNum').value = hourNum;
  document.getElementById('hourMemoModalTitle').innerHTML = `<i class="fa-solid fa-lightbulb text-amber"></i> 【${escapeHtml(unitData.name.split('（')[0])}】第${hourNum}時の改善メモ`;
  document.getElementById('hourMemoTopicName').textContent = `第${hourNum}時: ${hourData.title}`;

  const memoKey = `${unitKey}_${hourNum}`;
  const existingMemo = (state.hourMemos && state.hourMemos[memoKey]) || '';
  document.getElementById('hourMemoTextInput').value = existingMemo;

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
  const text = document.getElementById('hourMemoTextInput').value.trim();

  if (!state.hourMemos) state.hourMemos = {};
  const memoKey = `${unitKey}_${hourNum}`;

  if (text) {
    state.hourMemos[memoKey] = text;
    // 下の「授業改善メモ一覧（ナレッジベース）」にも自動連動で蓄積
    const unitData = UNIT_SYLLABUS[unitKey] || UNIT_SYLLABUS['unit_linear_2'];
    const hourData = unitData.hours.find(h => h.num === hourNum) || { title: `第${hourNum}時` };
    const fullUnitName = `${unitData.name.split('（')[0]} 第${hourNum}時: ${hourData.title}`;

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


// ==========================================
// TAB 5: 指導進度 & 授業改善メモ (実践ナレッジ蓄積エンジン)
// 時間割・週案メモ・授業プリント作成と完全連動
// ==========================================

let currentMemoGradeFilter = 'all';



/**
 * ① 上部サマリーカード (考査カウントダウン、クラス差警告、メモ蓄積数)
 */
function renderProgressSummaryRow() {
  const container = document.getElementById('progressSummaryRow');
  if (!container) return;

  const exam = state.examSettings || { examName: '2学期 中間考査', examDate: '2026-10-23' };

  // 考査カウントダウン日数
  let diffDays = 0;
  if (exam.examDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(exam.examDate);
    target.setHours(0, 0, 0, 0);
    diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  }

  // クラス別コマ数・残コマ計算
  let classStats = {};
  if (typeof calculateExamCountdown === 'function') {
    classStats = calculateExamCountdown();
  }
  const classes = Object.keys(classStats);
  let minLessons = 999;
  let maxLessons = 0;
  classes.forEach(c => {
    const cnt = classStats[c]?.totalLessons || 0;
    if (cnt < minLessons) minLessons = cnt;
    if (cnt > maxLessons) maxLessons = cnt;
  });
  if (minLessons === 999) minLessons = 0;
  const lessonDiff = Math.max(0, maxLessons - minLessons);

  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-icon bg-emerald"><i class="fa-solid fa-stopwatch-20"></i></div>
      <div class="stat-info">
        <span class="stat-label">${escapeHtml(exam.examName || '次回考査')}まで</span>
        <strong class="stat-value" style="font-size: 1.25rem; color: #059669;">
          ${diffDays >= 0 ? `あと ${diffDays} 日` : '考査終了'}
        </strong>
        <span class="stat-sub">目標日程: ${escapeHtml(exam.examDate || '未設定')}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-blue"><i class="fa-solid fa-scale-balanced"></i></div>
      <div class="stat-info">
        <span class="stat-label">クラス間 進度・コマ差</span>
        <strong class="stat-value" style="font-size: 1.25rem; ${lessonDiff >= 2 ? 'color: #dc2626;' : 'color: #2563eb;'}">
          ${classes.length > 0 ? `最大差 ${lessonDiff} コマ` : '時間割登録なし'}
        </strong>
        <span class="stat-sub">${lessonDiff >= 2 ? '⚠️ クラス間に進度差あり（調整推奨）' : '✓ 順調に進度揃い中'}</span>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon bg-purple"><i class="fa-solid fa-lightbulb"></i></div>
      <div class="stat-info">
        <span class="stat-label">蓄積された授業改善ナレッジ</span>
        <strong class="stat-value" style="font-size: 1.25rem; color: #7c3aed;">
          ${(state.memos || []).length} 件
        </strong>
        <span class="stat-sub">来年度の指導案・教材研究に直結</span>
      </div>
    </div>
  `;
}

/**
 * ② クラス別 最新指導進度・次の授業プランカード
 */
function renderClassesProgressCards() {
  const container = document.getElementById('classesProgressGrid');
  if (!container) return;

  const classesSet = new Set();
  const termKey = state.currentTerm || '2026_first';
  const baseTT = state.baseTimetables?.[termKey] || {};
  Object.values(baseTT).forEach(slotRow => {
    Object.values(slotRow).forEach(s => {
      if (s && s.class && (s.type === 'math' || s.subject === '数学' || s.subject?.includes('数学'))) {
        classesSet.add(s.class.trim());
      }
    });
  });

  (state.learnedClasses || []).forEach(c => {
    if (c && c.trim()) classesSet.add(c.trim());
  });

  const sortedClasses = Array.from(classesSet).sort((a, b) => a.localeCompare(b, 'ja', { numeric: true }));

  if (sortedClasses.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 1.5rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b; font-size: 0.85rem;">
        <i class="fa-solid fa-circle-info text-primary"></i> 時間割にクラス（例: 2-1, 2-2）が登録されると、クラスごとの最新進度・週案メモがここに自動表示されます。
      </div>
    `;
    return;
  }

  let classStats = {};
  if (typeof calculateExamCountdown === 'function') {
    classStats = calculateExamCountdown();
  }

  const plans = state.lessonPlans || {};
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  const cardsHtml = sortedClasses.map(cls => {
    let latestPlan = '';
    const sortedPlanKeys = Object.keys(plans).filter(k => k.includes('_')).sort().reverse();

    for (const k of sortedPlanKeys) {
      const [dStr, pStr] = k.split('_');
      const d = new Date(dStr);
      if (isNaN(d.getTime())) continue;
      const dayData = getActualSlotsForDate(dStr, dayKeys[d.getDay()]);
      const slot = dayData?.slots?.[Number(pStr)];
      if (slot && slot.class === cls && plans[k] && plans[k].trim() !== '') {
        latestPlan = plans[k];
        break;
      }
    }

    const remainingLessons = classStats[cls]?.totalLessons ?? '—';

    return `
      <div class="class-progress-card">
        <div class="class-card-header">
          <div class="class-card-name">
            <i class="fa-solid fa-chalkboard-user"></i> ${escapeHtml(cls)}
          </div>
          <div class="class-card-stats">
            <span class="badge" style="background: #e0f2fe; color: #0284c7; font-size: 0.72rem; padding: 2px 7px;">考査まで ${remainingLessons} コマ</span>
          </div>
        </div>

        <div class="class-plan-box">
          <span class="class-plan-label">
            <i class="fa-solid fa-note-sticky text-amber"></i> 最新の指導計画・進度メモ:
          </span>
          <div class="class-plan-text">
            ${latestPlan ? escapeHtml(cleanMathText(latestPlan)) : '<span style="color: #94a3b8; font-weight: normal;">（直近の予定・メモは未入力です）</span>'}
          </div>
        </div>

        <div class="class-card-actions">
          <button type="button" class="btn btn-xs btn-outline" onclick="goToLessonPrep('${escapeHtml(cls)}', '数学')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; flex: 1;">
            <i class="fa-solid fa-file-pen text-primary"></i> 授業プリント作成
          </button>
          <button type="button" class="btn btn-xs btn-ghost text-secondary" onclick="switchTab('timetable')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem;" title="時間割で予定を確認">
            <i class="fa-solid fa-calendar-days"></i> 時間割
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = cardsHtml;
}

/**
 * ③ 単元別 授業改善メモ一覧
 */
function renderMemosList(filterGrade = 'all') {
  currentMemoGradeFilter = filterGrade;
  const container = document.getElementById('memosHistoryGrid');
  const countBadge = document.getElementById('memosCountBadge');
  const countEl = document.getElementById('savedMemosCount');
  if (!container) return;

  let filtered = state.memos || [];
  if (filterGrade !== 'all') {
    filtered = filtered.filter(m => {
      const u = m.unit || '';
      return u.includes(`中${filterGrade}`) || u.startsWith(`${filterGrade}年`) || u.startsWith(`${filterGrade}-`);
    });
  }

  if (countBadge) countBadge.textContent = `${filtered.length} 件`;
  if (countEl) countEl.textContent = `${(state.memos || []).length} 件`;

  const group = document.getElementById('memoGradeFilterGroup');
  if (group) {
    group.querySelectorAll('.memo-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.grade === filterGrade);
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 2rem; background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; color: #64748b;">
        <i class="fa-solid fa-lightbulb" style="font-size: 1.5rem; color: #cbd5e1; margin-bottom: 0.5rem; display: block;"></i>
        この学年の授業改善メモはまだありません。<br>
        上部の「<strong class="text-primary">＋ 改善メモを新規記録</strong>」から、授業のつまずきや時間配分のメモを残しておきましょう！
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