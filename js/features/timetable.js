// ==========================================
// // 1. 学校の時程（ベル時刻）
const defaultBellSettings = {
  startTime: '08:45',
  duration: 50,
  breakDuration: 10,
  lunchDuration: 50,
  customSchedule: null
};

// 空のベース時間割生成関数
function createEmptyBaseTimetable() {
  const tt = {};
  for (let p = 1; p <= 6; p++) {
    tt[p] = {
      mon: { class: '', subject: '', type: 'free' },
      tue: { class: '', subject: '', type: 'free' },
      wed: { class: '', subject: '', type: 'free' },
      thu: { class: '', subject: '', type: 'free' },
      fri: { class: '', subject: '', type: 'free' }
    };
  }
  return tt;
}

// 2. 期別ベース時間割（マスター）
const defaultTermsList = [
  { id: '2027_second', label: '2027年度 後期基本時間割' },
  { id: '2027_first', label: '2027年度 前期基本時間割' },
  { id: '2026_second', label: '2026年度 後期基本時間割' },
  { id: '2026_first', label: '2026年度 前期基本時間割' },
  { id: '2025_second', label: '2025年度 後期基本時間割' },
  { id: '2025_first', label: '2025年度 前期基本時間割' }
];

const defaultBaseTimetables = {
  '2026_first': createEmptyBaseTimetable(),
  '2026_second': createEmptyBaseTimetable()
};

// 3. 特時・日課振替（初期は空っぽ）
const defaultOverrides = {};

// ローカルストレージ読み込み関数
function loadStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
  }
  return JSON.parse(JSON.stringify(fallback));
}

// ==========================================
// // 3層時間割: サブビュー切り替え

function switchTimetableMode(mode) {
  state.timetableMode = mode;
  document.getElementById('ttModeSchedule').classList.toggle('active', mode === 'schedule');
  document.getElementById('ttModeBase').classList.toggle('active', mode === 'base');
  document.getElementById('ttModeBell').classList.toggle('active', mode === 'bell');

  document.getElementById('ttSubViewSchedule').classList.toggle('active', mode === 'schedule');
  document.getElementById('ttSubViewBase').classList.toggle('active', mode === 'base');
  document.getElementById('ttSubViewBell').classList.toggle('active', mode === 'bell');

  if (mode === 'schedule') {
    renderRealTimetableGrid();
  } else if (mode === 'base') {
    renderBaseTimetableGrid();
  } else if (mode === 'bell') {
    previewBellSchedule();
  }
}

// ==========================================
// // 1. 時程設定 (Bell Settings) 直接入力・計算ロジック

function initBellSettingsUI() {
  const { startTime, duration, breakDuration, lunchDuration } = state.bellSettings;
  const startEl = document.getElementById('bellStartTime');
  const durEl = document.getElementById('bellDuration');
  const breakEl = document.getElementById('bellBreakDuration');
  const lunchEl = document.getElementById('bellLunchDuration');

  if (startEl) startEl.value = startTime;
  if (durEl) durEl.value = duration;
  if (breakEl) breakEl.value = breakDuration;
  if (lunchEl) lunchEl.value = lunchDuration;
}

function calculateBellSchedule() {
  const { startTime, duration, breakDuration, lunchDuration, customSchedule } = state.bellSettings;
  
  if (customSchedule && customSchedule.length === 6) {
    return customSchedule;
  }

  const [startH, startM] = (startTime || '08:45').split(':').map(Number);
  let currentMinutes = startH * 60 + startM;

  const schedule = [];
  const dur = Number(duration) || 50;
  const brk = Number(breakDuration) || 10;
  const lunch = Number(lunchDuration) || 50;

  for (let p = 1; p <= 6; p++) {
    const pStartMin = currentMinutes;
    const pEndMin = pStartMin + dur;
    
    const formatTime = (min) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return `${h}:${m.toString().padStart(2, '0')}`;
    };

    schedule.push({
      p: p,
      start: formatTime(pStartMin),
      end: formatTime(pEndMin),
      time: `${formatTime(pStartMin)}-${formatTime(pEndMin)}`
    });

    if (p === 4) {
      currentMinutes = pEndMin + lunch;
    } else {
      currentMinutes = pEndMin + brk;
    }
  }
  return schedule;
}

function previewBellSchedule() {
  const startEl = document.getElementById('bellStartTime');
  const durEl = document.getElementById('bellDuration');
  const breakEl = document.getElementById('bellBreakDuration');
  const lunchEl = document.getElementById('bellLunchDuration');

  if (startEl) {
    state.bellSettings.startTime = startEl.value || '08:45';
    state.bellSettings.duration = Number(durEl.value) || 50;
    state.bellSettings.breakDuration = Number(breakEl.value) || 10;
    state.bellSettings.lunchDuration = Number(lunchEl.value) || 50;
    state.bellSettings.customSchedule = null; // 基準値変更時はカスタムをリセット再計算
  }

  const schedule = calculateBellSchedule();
  const container = document.getElementById('bellTimelinePreview');
  if (container) {
    container.innerHTML = schedule.map(s => `
      <div class="bell-timeline-item">
        <span class="bell-period-name">${s.p}校時</span>
        <div class="bell-timeline-edit-row">
          <input type="text" class="bell-time-input" id="sched_start_${s.p}" value="${s.start}" onchange="onManualTimeChange(${s.p})" title="開始時刻">
          <span>〜</span>
          <input type="text" class="bell-time-input" id="sched_end_${s.p}" value="${s.end}" onchange="onManualTimeChange(${s.p})" title="終了時刻">
        </div>
      </div>
    `).join('');
  }
}

function onManualTimeChange(period) {
  const sInput = document.getElementById(`sched_start_${period}`);
  const eInput = document.getElementById(`sched_end_${period}`);
  if (!state.bellSettings.customSchedule) {
    state.bellSettings.customSchedule = calculateBellSchedule();
  }
  const item = state.bellSettings.customSchedule.find(x => x.p === period);
  if (item) {
    item.start = sInput.value.trim();
    item.end = eInput.value.trim();
    item.time = `${item.start}-${item.end}`;
  }
}

function recalcBellTimesFromInputs() {
  state.bellSettings.customSchedule = null;
  previewBellSchedule();
}

function saveBellSettings() {
  localStorage.setItem('math_portal_bell_settings', JSON.stringify(state.bellSettings));
  renderRealTimetableGrid();
  renderBaseTimetableGrid();
  triggerAutoCloudSync();
  alert('学校の時程設定を保存しました！');
}

// ==========================================
// // 2. ベース時間割 (マスター) & 期管理ロジック

function renderTermSelector() {
  const select = document.getElementById('termSelector');
  if (!select) return;

  // 選択肢の生成
  select.innerHTML = state.termsList.map(t => `
    <option value="${t.id}" ${state.currentTerm === t.id ? 'selected' : ''}>${escapeHtml(t.label)}</option>
  `).join('');

  // もし現在の期がリストに無ければ補正
  if (!state.termsList.some(t => t.id === state.currentTerm)) {
    if (state.termsList.length > 0) {
      state.currentTerm = state.termsList[0].id;
      select.value = state.currentTerm;
      localStorage.setItem('math_portal_current_term', state.currentTerm);
    }
  }
}

function onTermChange() {
  const select = document.getElementById('termSelector');
  if (select) state.currentTerm = select.value;
  localStorage.setItem('math_portal_current_term', state.currentTerm);

  // 選択した期の時間割がまだ無ければ空白を生成
  if (!state.baseTimetables[state.currentTerm]) {
    state.baseTimetables[state.currentTerm] = createEmptyBaseTimetable();
    localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));
  }

  renderBaseTimetableGrid();
  renderRealTimetableGrid();
  renderTodayScheduleMini();
  triggerAutoCloudSync();
}

function openAddTermModal() {
  const nowYear = new Date().getFullYear();
  const yearInput = document.getElementById('newTermYear');
  if (yearInput) yearInput.value = nowYear + 1; // 来年度をデフォルト推薦

  // コピー元候補の生成
  const sourceSelect = document.getElementById('newTermSource');
  if (sourceSelect) {
    let opts = `<option value="empty">白紙（完全な空っぽ）からスタート</option>`;
    state.termsList.forEach(t => {
      opts += `<option value="${t.id}">【${escapeHtml(t.label)}】の時間割をコピーして開始</option>`;
    });
    sourceSelect.innerHTML = opts;
  }

  document.getElementById('addTermModal').classList.remove('hidden');
}

function closeAddTermModal() {
  document.getElementById('addTermModal').classList.add('hidden');
}

function onNewTermTypeChange() {
  const type = document.getElementById('newTermType').value;
  const customGroup = document.getElementById('customTermNameGroup');
  if (customGroup) {
    if (type === 'custom') customGroup.classList.remove('hidden');
    else customGroup.classList.add('hidden');
  }
}

function saveNewTerm() {
  const year = document.getElementById('newTermYear').value.trim();
  const type = document.getElementById('newTermType').value;
  let termName = type;
  if (type === 'custom') {
    const custom = document.getElementById('newTermCustomName').value.trim();
    termName = custom || '新学期';
  } else {
    termName = `${type}基本時間割`;
  }

  if (!year) {
    alert('年度（西暦）を入力してください。');
    return;
  }

  // ユニークIDとラベル生成
  const termKey = type === '前期' ? 'first' : type === '後期' ? 'second' : type === '1学期' ? 'sem1' : type === '2学期' ? 'sem2' : type === '3学期' ? 'sem3' : Date.now().toString(36);
  const newTermId = `${year}_${termKey}`;
  const newTermLabel = `${year}年度 ${termName}`;

  // 既に存在するかチェック
  if (state.termsList.some(t => t.id === newTermId)) {
    if (!confirm(`【${newTermLabel}】は既に存在します。この期に切り替えますか？`)) {
      return;
    }
  } else {
    state.termsList.unshift({ id: newTermId, label: newTermLabel });
    localStorage.setItem('math_portal_terms_list', JSON.stringify(state.termsList));
  }

  // 初期データの準備（白紙 or コピー元）
  const source = document.getElementById('newTermSource').value;
  if (!state.baseTimetables[newTermId]) {
    if (source !== 'empty' && state.baseTimetables[source]) {
      state.baseTimetables[newTermId] = JSON.parse(JSON.stringify(state.baseTimetables[source]));
    } else {
      state.baseTimetables[newTermId] = createEmptyBaseTimetable();
    }
    localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));
  }

  state.currentTerm = newTermId;
  localStorage.setItem('math_portal_current_term', state.currentTerm);

  renderTermSelector();
  renderBaseTimetableGrid();
  renderRealTimetableGrid();
  renderTodayScheduleMini();
  closeAddTermModal();
  triggerAutoCloudSync();

  showToast(`🎉 【${newTermLabel}】を作成し、選択しました！`);
}

function openCopyTermModal() {
  const currentObj = state.termsList.find(t => t.id === state.currentTerm);
  const labelEl = document.getElementById('copyTargetTermLabel');
  if (labelEl) labelEl.textContent = currentObj ? currentObj.label : state.currentTerm;

  const select = document.getElementById('copySourceTermSelector');
  if (select) {
    const otherTerms = state.termsList.filter(t => t.id !== state.currentTerm);
    if (otherTerms.length === 0) {
      alert('コピー元となる他の期がまだ登録されていません。先に「新しい期を追加」してください。');
      return;
    }
    select.innerHTML = otherTerms.map(t => `
      <option value="${t.id}">${escapeHtml(t.label)}</option>
    `).join('');
  }

  document.getElementById('copyTermModal').classList.remove('hidden');
}

function closeCopyTermModal() {
  document.getElementById('copyTermModal').classList.add('hidden');
}

function executeCopyTerm() {
  const sourceTermId = document.getElementById('copySourceTermSelector').value;
  if (!sourceTermId || !state.baseTimetables[sourceTermId]) {
    alert('コピー元の時間割データが見つかりませんでした。');
    return;
  }

  const sourceObj = state.termsList.find(t => t.id === sourceTermId);
  const targetObj = state.termsList.find(t => t.id === state.currentTerm);

  const sourceName = sourceObj ? sourceObj.label : sourceTermId;
  const targetName = targetObj ? targetObj.label : state.currentTerm;

  if (confirm(`【${sourceName}】の時間割をコピーして、【${targetName}】に上書きしますか？`)) {
    state.baseTimetables[state.currentTerm] = JSON.parse(JSON.stringify(state.baseTimetables[sourceTermId]));
    localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));

    renderBaseTimetableGrid();
    renderRealTimetableGrid();
    renderTodayScheduleMini();
    closeCopyTermModal();
    triggerAutoCloudSync();

    showToast(`📋 【${sourceName}】から時間割をコピーしました！`);
  }
}

function getBaseSlot(dayKey, period) {
  const termData = state.baseTimetables[state.currentTerm];
  if (termData && termData[period] && termData[period][dayKey]) {
    return termData[period][dayKey];
  }
  return { class: '', subject: '', type: 'free' };
}

// 教科ごとの視覚的テーマクラス判定（直感的な色分け）
function getSubjectThemeClass(subjectName) {
  if (!subjectName) return 'theme-other';
  const s = subjectName.trim();
  if (s === '数学' || s.includes('数学') || s.includes('幾何') || s.includes('代数')) return 'theme-math';
  if (s === '道徳' || s.includes('道徳')) return 'theme-morality';
  if (s === '学活' || s.includes('学活') || s.includes('HR') || s.includes('ホームルーム') || s.includes('生徒会')) return 'theme-homeroom';
  if (s === '総合' || s.includes('総合') || s.includes('探究')) return 'theme-integrated';
  if (s === '会議' || s.includes('会議') || s.includes('学年') || s.includes('校務') || s.includes('部会') || s.includes('研修') || s.includes('儀式') || s.includes('式典')) return 'theme-meeting';
  return 'theme-other';
}

function renderBaseTimetableGrid() {
  const tbody = document.getElementById('timetableBaseBody');
  if (!tbody) return;

  const bellTimes = calculateBellSchedule();
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const dayNames = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金' };

  tbody.innerHTML = bellTimes.map(t => {
    const cellsHtml = days.map(d => {
      const slot = getBaseSlot(d, t.p);
      const hasContent = (slot.class && slot.class.trim() !== '') || (slot.subject && slot.subject.trim() !== '');

      if (!hasContent) {
        // 空きコマ: 文字は一切出さずスッキリした空白にする！
        return `
          <td>
            <div class="timetable-cell-content free-period" onclick="openSlotEditModal(${t.p}, '${d}')" title="クリックして持ちコマを登録">
              <button class="tt-cell-edit-trigger" onclick="event.stopPropagation(); openSlotEditModal(${t.p}, '${d}')" title="このコマを編集">
                <i class="fa-solid fa-pencil"></i>
              </button>
            </div>
          </td>
        `;
      }

      const themeClass = getSubjectThemeClass(slot.subject);
      return `
        <td>
          <div class="timetable-cell-content ${themeClass}" onclick="openSlotEditModal(${t.p}, '${d}')">
            <button class="tt-cell-edit-trigger" onclick="event.stopPropagation(); openSlotEditModal(${t.p}, '${d}')" title="このベースコマを編集">
              <i class="fa-solid fa-pencil"></i>
            </button>
            <div>
              <span class="slot-code-badge">${dayNames[d]}${t.p}</span>
              <div class="tt-class-name">${escapeHtml(slot.class)}</div>
              <div><span class="tt-subject-badge">${escapeHtml(slot.subject)}</span></div>
            </div>
          </div>
        </td>
      `;
    }).join('');

    return `
      <tr>
        <th class="time-col">
          <span class="period-label">${t.p}限</span>
          <span class="period-time">${t.time}</span>
        </th>
        ${cellsHtml}
      </tr>
    `;
  }).join('');
}

// ==========================================
// // 3. 特時・日課振替 & 実時間割ロジック

// ==========================================
// // ホーム画面 (本日の予定ミニバー連動)

// ==========================================
// // 時間割 ➔ 授業プリント工房 への双方向連携

function jumpToWorksheetFromSlot() {
  let className = state.editingLessonPlan ? (state.editingLessonPlan.className || '') : '';
  let grade = extractGradeFromClassName(className);
  const input = document.getElementById('lessonPlanInput');
  const planKeyword = (input ? input.value : '').trim();

  // 単元別主要キーワードマップ（教育課程の教科書・板書・プリントに完全準拠）
  const mathUnitKeywords = [
    { key: 'g3_poly_expand', grade: '3', words: ['展開', '因数分解', '多項式', '乗法公式', '式の計算', '乗法', '置き換え'] },
    { key: 'g3_sqrt_calc', grade: '3', words: ['平方根', '根号', 'ルート', '√', '有理数', '無理数', '積と商'] },
    { key: 'g3_quad_factor', grade: '3', words: ['2次方程式', '二次方程式', '方程式の解', '解の公式', '因数分解で解く'] },
    { key: 'g2_linear_graph', grade: '2', words: ['一次関数', '1次関数', '関数', 'グラフ', '傾き', '切片', '変化の割合', '直線の式'] },
    { key: 'g2_sim_eq', grade: '2', words: ['連立', '連立方程式', '加減法', '代入法', '二元一次方程式'] },
    { key: 'g2_parallel_angle', grade: '2', words: ['平行', '角', '同位角', '錯角', '対頂角', '合同', '証明', '三角形', '四角形'] },
    { key: 'g1_pos_neg', grade: '1', words: ['正の数', '負の数', '正負', '加法', '減法', '絶対値', '符号', '数直線'] },
    { key: 'g1_equation', grade: '1', words: ['方程式', '1次方程式', '一次方程式', '移項', '等式の性質'] }
  ];

  let targetPresetKey = null;
  const gradeKeys = Object.keys(lessonUnitPresets).filter(k => lessonUnitPresets[k].grade === grade);

  if (planKeyword) {
    // 該当学年のキーワードから優先マッチング
    for (const item of mathUnitKeywords.filter(m => m.grade === grade)) {
      if (item.words.some(w => planKeyword.includes(w))) {
        targetPresetKey = item.key;
        break;
      }
    }
    // 学年が明示されない場合の全学年フォールバック
    if (!targetPresetKey) {
      for (const item of mathUnitKeywords) {
        if (item.words.some(w => planKeyword.includes(w))) {
          targetPresetKey = item.key;
          grade = item.grade;
          break;
        }
      }
    }
  }

  if (!targetPresetKey && gradeKeys.length > 0) {
    targetPresetKey = gradeKeys[0];
  }

  closeLessonPlanModal();
  switchTab('worksheet');

  // B4見開き板書プリセットへのマッピング
  let b4UnitId = 'u_3_1';
  let b4Hour = 5;

  if (targetPresetKey === 'g3_poly_expand') { b4UnitId = 'u_3_1'; b4Hour = 5; }
  else if (targetPresetKey === 'g3_sqrt_calc') { b4UnitId = 'u_3_2'; b4Hour = 3; }
  else if (targetPresetKey === 'g3_quad_factor') { b4UnitId = 'u_3_3'; b4Hour = 4; }
  else if (targetPresetKey === 'g2_linear_graph') { b4UnitId = 'u_2_3'; b4Hour = 2; }
  else if (targetPresetKey === 'g1_equation') { b4UnitId = 'u_1_3'; b4Hour = 3; }
  else if (grade === '1') { b4UnitId = 'u_1_3'; b4Hour = 3; }
  else if (grade === '2') { b4UnitId = 'u_2_3'; b4Hour = 2; }
  else { b4UnitId = 'u_3_1'; b4Hour = 5; }

  selectB4Grade(grade);
  loadBoardLessonPreset(grade, b4UnitId, b4Hour);

  // クラス情報の反映
  if (className) {
    const classCell = document.querySelector('.info-cell.class-cell');
    if (classCell) {
      classCell.innerHTML = className + '組';
    }
  }
}

// 授業プリント工房 ➔ 時間割の授業予定（週案）へ反映
function applyWorksheetToTimetable() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  const title = document.getElementById('paperTitle')?.textContent || (preset ? preset.lessonTitle : '数学 授業プリント');
  const objBlock = state.blocks.find(b => b.type === 'objective');
  const objText = objBlock?.data?.text || '';

  const summaryText = title + (objText ? ' (' + objText.slice(0, 24) + '...)' : '');

  // 直近で編集していたスロットがあれば反映、なければ案内トースト
  if (state.editingLessonPlan && state.editingLessonPlan.key) {
    const [tKey, day, p] = state.editingLessonPlan.key.split('_');
    const term = state.terms[tKey];
    if (term && term.weeklyPlans && term.weeklyPlans[day]) {
      term.weeklyPlans[day][p] = summaryText;
      renderCurrentTimetable();
      showToast('<i class="fa-solid fa-calendar-check text-success"></i> 時間割の授業予定に「' + title + '」を登録しました！');
      return;
    }
  }

  showToast('<i class="fa-solid fa-circle-info text-primary"></i> 時間割を開き、反映したい授業マスをクリックして「学習内容を保存」してください');
}