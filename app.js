/**
 * 中学数学科 教員ポータル & 授業工房
 * メインスクリプト (app.js)
 */

// ==========================================
// 3層時間割システム: 設定とデフォルトデータ
// ==========================================

// 1. 学校の時程（ベル時刻）
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
// 状態管理 (State)
// ==========================================
const state = {
  activeTab: 'home',
  timetableMode: 'schedule', // 'schedule' | 'base' | 'bell'
  showAnswers: false,
  timerSeconds: 600,
  timerTotal: 600,
  timerRunning: false,
  timerInterval: null,
  
  // 3層時間割データ
  bellSettings: loadStorage('math_portal_bell_settings', defaultBellSettings),
  termsList: loadStorage('math_portal_terms_list', defaultTermsList),
  baseTimetables: loadStorage('math_portal_base_timetables', defaultBaseTimetables),
  currentTerm: localStorage.getItem('math_portal_current_term') || '2026_first',
  dateOverrides: loadStorage('math_portal_date_overrides', defaultOverrides),
  currentWeekOffset: 0,
  editingSlot: { period: 1, dayKey: 'mon' },

  // 学習型履歴チップ（入力したクラス・科目を自動記憶）
  learnedClasses: loadStorage('math_portal_learned_classes', []),
  learnedSubjects: loadStorage('math_portal_learned_subjects', ['数学', '道徳', '学活', '総合', '会議']),

  // 週案・今週の学習予定データ（キー: dateStr_period）
  lessonPlans: loadStorage('math_portal_lesson_plans', {}),
  editingLessonPlan: { dateStr: '', period: 1, className: '', subjectName: '' },

  // Googleスプレッドシート連携（クラウド同期設定）
  cloudSettings: {
    gasUrl: localStorage.getItem('math_portal_gas_url') || '',
    autoSync: localStorage.getItem('math_portal_auto_sync') !== 'false',
    lastSyncTime: localStorage.getItem('math_portal_last_sync_time') || '',
    isSyncing: false
  },

  // ワークシートのブロック一覧
  blocks: [],
  linearFunc: { a: 2, b: 1, showPoints: true, showLine: true },
  geometry: { pattern: 'parallel_chevron', angle1: 45, angle2: 35 },
  
  memos: [
    {
      id: 1,
      unit: '中2: 一次関数の変化の割合',
      date: '2026/09/25',
      points: 'xの増加量とyの増加量の比率を公式丸暗記ではなく、表から矢印を引かせる活動を入れたら理解度が大幅に向上した。',
      timing: '導入7分、表の活動15分、練習15分、まとめ8分で余裕あり。',
      nextYear: '問3の分数になる傾きは別プリントに分けた方が定着しやすい。'
    },
    {
      id: 2,
      unit: '中1: 文字と式（代入）',
      date: '2026/09/18',
      points: '負の数を代入するときにカッコを付け忘れて符号ミスする生徒が半数いた。赤ペンで（ ）を強調させること。',
      timing: '演習に時間がかかりまとめが駆け足になった。',
      nextYear: '例題で (-3)^2 と -3^2 の違いを冒頭で全員で復唱させる。'
    }
  ]
};

// レガシーキー (first_term, second_term) からの互換マイグレーション
if (state.currentTerm === 'first_term') state.currentTerm = '2026_first';
if (state.currentTerm === 'second_term') state.currentTerm = '2026_second';
if (state.baseTimetables && state.baseTimetables['first_term'] && !state.baseTimetables['2026_first']) {
  state.baseTimetables['2026_first'] = state.baseTimetables['first_term'];
}
if (state.baseTimetables && state.baseTimetables['second_term'] && !state.baseTimetables['2026_second']) {
  state.baseTimetables['2026_second'] = state.baseTimetables['second_term'];
}

// ==========================================
// 初期化
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupTimer();
  updateCurrentDate();
  
  initBellSettingsUI();
  previewBellSchedule();

  renderTermSelector();
  renderRealTimetableGrid();
  renderBaseTimetableGrid();
  renderTodayScheduleMini();

  initCloudSync();

  loadSampleSheet();
  renderLinearGraph();
  renderGeometryFig();
  onTestGradeChange();
  renderMemosList();
});

// 日付表示
function updateCurrentDate() {
  const now = new Date();
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = days[now.getDay()];
  const str = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 (${dayName})`;
  const el = document.getElementById('currentDateStr');
  if (el) el.textContent = str;
}

// タブ切り替え
function setupTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.getAttribute('data-tab'));
    });
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToLauncher() {
  const el = document.getElementById('homeLauncherSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 3層時間割: サブビュー切り替え
// ==========================================
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
// 1. 時程設定 (Bell Settings) 直接入力・計算ロジック
// ==========================================
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
// 2. ベース時間割 (マスター) & 期管理ロジック
// ==========================================

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
// 3. 特時・日課振替 & 実時間割ロジック
// ==========================================
function getWeekDays(offset = 0) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMonday = (dayOfWeek + 6) % 7;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday + offset * 7);

  const days = [];
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const dayNames = ['月', '火', '水', '木', '金'];

  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = (new Date().toISOString().split('T')[0] === dateStr);

    days.push({
      dateStr: dateStr,
      month: d.getMonth() + 1,
      date: d.getDate(),
      dayKey: dayKeys[i],
      dayName: dayNames[i],
      isToday: isToday
    });
  }
  return days;
}

function changeWeekOffset(delta) {
  if (delta === 0) state.currentWeekOffset = 0;
  else state.currentWeekOffset += delta;
  renderRealTimetableGrid();
}

function getActualSlotsForDate(dateStr, dayKey) {
  const override = state.dateOverrides[dateStr];
  const periods = [1, 2, 3, 4, 5, 6];
  const slots = {};

  periods.forEach(p => {
    let sourceCode = `${dayKey}_${p}`;
    let isOverridden = false;

    if (override && override.slots && override.slots[p]) {
      sourceCode = override.slots[p];
      if (sourceCode !== `${dayKey}_${p}`) isOverridden = true;
    }

    if (sourceCode === 'none') {
      slots[p] = {
        class: '',
        subject: '',
        type: 'free',
        isOverridden: true,
        sourceCode: 'カット'
      };
    } else if (sourceCode.startsWith('special_')) {
      const specialName = sourceCode.replace('special_', '');
      slots[p] = {
        class: '',
        subject: specialName,
        type: 'special',
        isOverridden: true,
        sourceCode: specialName
      };
    } else {
      const [srcDay, srcPeriod] = sourceCode.split('_');
      const baseSlot = getBaseSlot(srcDay, Number(srcPeriod));
      slots[p] = {
        ...baseSlot,
        isOverridden: isOverridden,
        sourceCode: formatSourceCodeName(sourceCode)
      };
    }
  });

  return { slots, overrideMemo: override?.memo || '' };
}

function formatSourceCodeName(code) {
  if (!code || code === 'none') return '';
  if (code.startsWith('special_')) {
    return code.replace('special_', '');
  }
  const dayMap = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金' };
  const [d, p] = code.split('_');
  return `${dayMap[d] || d}${p}`;
}

// 今週のクラス別授業数サマリーの集計・表示
function renderWeekLessonSummary(weekDays) {
  const container = document.getElementById('weekLessonSummaryCard');
  if (!container) return;

  const classCounts = {};
  const slotsByClass = {};

  weekDays.forEach(w => {
    const dayData = getActualSlotsForDate(w.dateStr, w.dayKey);
    for (let p = 1; p <= 6; p++) {
      const slot = dayData.slots[p];
      if (slot && slot.class && slot.class.trim() !== '') {
        const cls = slot.class.trim();
        classCounts[cls] = (classCounts[cls] || 0) + 1;
        if (!slotsByClass[cls]) slotsByClass[cls] = [];
        slotsByClass[cls].push(`${w.month}/${w.date}(${w.dayName})${p}限`);
      }
    }
  });

  const sortedClasses = Object.keys(classCounts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  if (sortedClasses.length === 0) {
    container.innerHTML = `
      <div class="summary-title-badge"><i class="fa-solid fa-chart-simple text-primary"></i> 今週の授業コマ数</div>
      <span style="font-size: 0.78rem; color: #94a3b8;">今週の持ちコマはまだ登録されていません（ベース時間割を登録すると自動集計されます）</span>
    `;
    return;
  }

  const pillsHtml = sortedClasses.map(cls => {
    const count = classCounts[cls];
    const slotsDetail = (slotsByClass[cls] || []).join(', ');

    return `
      <div class="class-count-pill" title="${cls}: 今週 ${slotsDetail}">
        <span>${cls}</span>
        <span class="class-count-badge">${count}コマ</span>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="summary-title-badge">
      <i class="fa-solid fa-chart-simple text-primary"></i> 今週のクラス別授業数
    </div>
    <div class="class-count-pills">
      ${pillsHtml}
    </div>
  `;
}

function renderRealTimetableGrid() {
  const thead = document.getElementById('timetableRealHeader');
  const tbody = document.getElementById('timetableRealBody');
  const rangeLabel = document.getElementById('currentWeekRangeLabel');
  if (!thead || !tbody) return;

  const weekDays = getWeekDays(state.currentWeekOffset);
  const bellTimes = calculateBellSchedule();

  if (rangeLabel) {
    rangeLabel.textContent = `${weekDays[0].month}月${weekDays[0].date}日(${weekDays[0].dayName}) 〜 ${weekDays[4].month}月${weekDays[4].date}日(${weekDays[4].dayName})`;
  }

  // クラス別授業コマ数サマリーを更新
  renderWeekLessonSummary(weekDays);

  thead.innerHTML = `
    <tr>
      <th class="time-col">校時</th>
      ${weekDays.map(w => {
        const override = state.dateOverrides[w.dateStr];
        const activeClass = w.isToday ? 'col-active' : '';
        return `
          <th class="${activeClass}">
            <div>${w.month}/${w.date} (${w.dayName})</div>
            ${override ? `<div class="override-badge" title="${override.memo || '振替あり'}"><i class="fa-solid fa-shuffle"></i> ${override.memo || '特時'}</div>` : ''}
          </th>
        `;
      }).join('')}
    </tr>
  `;

  tbody.innerHTML = bellTimes.map(t => {
    const cellsHtml = weekDays.map(w => {
      const dayData = getActualSlotsForDate(w.dateStr, w.dayKey);
      const slot = dayData.slots[t.p];
      const activeClass = w.isToday ? 'col-active' : '';
      const hasContent = (slot.class && slot.class.trim() !== '') || (slot.subject && slot.subject.trim() !== '');

      if (!hasContent) {
        // 実時間割でも空きコマはすっきり白紙！
        return `
          <td class="${activeClass}">
            <div class="timetable-cell-content free-period">
            </div>
          </td>
        `;
      }

      const themeClass = getSubjectThemeClass(slot.subject);
      const isMath = (slot.subject === '数学' || (slot.subject && slot.subject.includes('数学')));
      const planKey = `${w.dateStr}_${t.p}`;
      const currentPlan = state.lessonPlans[planKey] || '';
      const isSpecial = slot.type === 'special';
      const badgeText = isSpecial ? `⚡ ${slot.sourceCode}` : (slot.isOverridden ? `⚡ ${slot.sourceCode} 振替` : slot.sourceCode);
      const isShiftBadge = isSpecial || slot.isOverridden;

      return `
        <td class="${activeClass}">
          <div class="timetable-cell-content ${themeClass}">
            <div>
              <span class="${isShiftBadge ? 'override-badge' : 'slot-code-badge'}">${badgeText}</span>
              ${slot.class ? `<div class="tt-class-name">${escapeHtml(slot.class)}</div>` : ''}
              <div><span class="tt-subject-badge">${escapeHtml(slot.subject)}</span></div>
            </div>

            <!-- 週案・学習内容入力枠 (クリックで予定を打てる) -->
            <div class="tt-lesson-plan" onclick="openLessonPlanModal('${w.dateStr}', ${t.p}, '${escapeHtml(slot.class)}', '${escapeHtml(slot.subject)}')" title="クリックしてこの時間の学習予定・単元名を入力">
              <div class="lesson-plan-text ${currentPlan ? '' : 'placeholder'}">
                ${currentPlan ? `<i class="fa-solid fa-book-open" style="font-size: 0.65rem; margin-right: 2px;"></i>${escapeHtml(currentPlan)}` : '＋ 予定・単元を入力'}
              </div>
            </div>

            ${isMath ? `
              <div class="tt-actions">
                <button class="tt-action-btn" onclick="goToLessonPrep('${escapeHtml(slot.class)}', '${escapeHtml(slot.subject)}', '${escapeHtml(currentPlan)}')">
                  <i class="fa-solid fa-file-pen"></i> プリント準備
                </button>
              </div>
            ` : ''}
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

// ------------------------------------------
// 1週間の特時・校時振替マネージャー
// ------------------------------------------
function openDayOverrideModal() {
  const modal = document.getElementById('dayOverrideModal');
  const weekDays = getWeekDays(state.currentWeekOffset);
  
  const rangeText = document.getElementById('overrideWeekRangeText');
  if (rangeText) {
    rangeText.textContent = `${weekDays[0].month}月${weekDays[0].date}日(${weekDays[0].dayName}) 〜 ${weekDays[4].month}月${weekDays[4].date}日(${weekDays[4].dayName}) の校時振替`;
  }

  renderWeekOverrideColumns(weekDays);
  modal.classList.remove('hidden');
}

function closeDayOverrideModal() {
  document.getElementById('dayOverrideModal').classList.add('hidden');
}

function renderWeekOverrideColumns(weekDays) {
  const container = document.getElementById('weekOverrideColumnsContainer');
  if (!container) return;

  const daysOptions = [
    { code: 'mon', label: '月' },
    { code: 'tue', label: '火' },
    { code: 'wed', label: '水' },
    { code: 'thu', label: '木' },
    { code: 'fri', label: '金' }
  ];

  let html = '';

  weekDays.forEach(w => {
    const existing = state.dateOverrides[w.dateStr];
    const isOverridden = !!existing;

    // 1〜6限の校時セレクト
    let slotsHtml = '';
    for (let p = 1; p <= 6; p++) {
      const currentVal = existing?.slots ? existing.slots[p] : `${w.dayKey}_${p}`;
      const isShifted = (currentVal !== `${w.dayKey}_${p}` && currentVal !== 'none');
      const isCut = (currentVal === 'none');

      let optGroupsHtml = '';
      daysOptions.forEach(day => {
        let opts = '';
        for (let pOpt = 1; pOpt <= 6; pOpt++) {
          const val = `${day.code}_${pOpt}`;
          const isSelected = (val === currentVal) ? 'selected' : '';
          opts += `<option value="${val}" ${isSelected}>${day.label}${pOpt}</option>`;
        }
        optGroupsHtml += `<optgroup label="${day.label}曜">${opts}</optgroup>`;
      });

      const specialOptions = [
        { code: 'special_総合', label: '総合' },
        { code: 'special_学活', label: '学活' },
        { code: 'special_学年', label: '学年' },
        { code: 'special_儀式', label: '儀式' },
        { code: 'special_道徳', label: '道徳' }
      ];
      let specialOpts = '';
      specialOptions.forEach(sp => {
        const isSelected = (sp.code === currentVal) ? 'selected' : '';
        specialOpts += `<option value="${sp.code}" ${isSelected}>${sp.label}</option>`;
      });
      optGroupsHtml += `<optgroup label="特活・行事・道徳">${specialOpts}</optgroup>`;
      optGroupsHtml += `<optgroup label="その他"><option value="none" ${isCut ? 'selected' : ''}>（カット）</option></optgroup>`;

      slotsHtml += `
        <div class="day-slot-assign-row">
          <span class="day-slot-label">${p}限:</span>
          <select class="form-control form-control-sm ${isShifted ? 'bg-amber-50 text-amber-700' : ''}" id="ov_slot_${w.dateStr}_${p}">
            ${optGroupsHtml}
          </select>
        </div>
      `;
    }

    html += `
      <div class="week-day-col ${w.isToday ? 'day-col-active' : ''}">
        <div class="week-day-col-header">
          <strong>${w.month}/${w.date} (${w.dayName})</strong>
          <input type="text" class="day-memo-input" id="ov_memo_${w.dateStr}" placeholder="理由・行事メモ" value="${escapeHtml(existing?.memo || '')}">
        </div>

        <!-- 一括プリセットボタン -->
        <div class="day-preset-quick-btns">
          <button type="button" class="day-preset-btn" onclick="applyDayColPreset('${w.dateStr}', '${w.dayKey}', 'reset')">通常</button>
          <button type="button" class="day-preset-btn" onclick="applyDayColPreset('${w.dateStr}', '${w.dayKey}', 'mon')">月校時</button>
          <button type="button" class="day-preset-btn" onclick="applyDayColPreset('${w.dateStr}', '${w.dayKey}', 'wed')">水校時</button>
          <button type="button" class="day-preset-btn" onclick="applyDayColPreset('${w.dateStr}', '${w.dayKey}', 'fri')">金校時</button>
          <button type="button" class="day-preset-btn" onclick="applyDayColPreset('${w.dateStr}', '${w.dayKey}', 'short4')">4時間</button>
        </div>

        <div class="day-slot-assign-list mt-1">
          ${slotsHtml}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function applyDayColPreset(dateStr, defaultDayKey, preset) {
  const memoInput = document.getElementById(`ov_memo_${dateStr}`);
  const dayNames = { mon: '月曜', tue: '火曜', wed: '水曜', thu: '木曜', fri: '金曜' };

  if (preset === 'reset') {
    for (let p = 1; p <= 6; p++) {
      const sel = document.getElementById(`ov_slot_${dateStr}_${p}`);
      if (sel) sel.value = `${defaultDayKey}_${p}`;
    }
    if (memoInput) memoInput.value = '';
    return;
  }

  if (preset === 'short4') {
    for (let p = 1; p <= 6; p++) {
      const sel = document.getElementById(`ov_slot_${dateStr}_${p}`);
      if (!sel) continue;
      if (p <= 4) sel.value = `${defaultDayKey}_${p}`;
      else sel.value = 'none';
    }
    if (memoInput) memoInput.value = '午前4時間授業';
    return;
  }

  // 曜日校時振替 (月〜金)
  for (let p = 1; p <= 6; p++) {
    const sel = document.getElementById(`ov_slot_${dateStr}_${p}`);
    if (sel) sel.value = `${preset}_${p}`;
  }
  if (memoInput) memoInput.value = `${dayNames[preset] || ''}校時実施`;
}

function saveWeekOverrides() {
  const weekDays = getWeekDays(state.currentWeekOffset);
  let changedCount = 0;

  weekDays.forEach(w => {
    const memo = document.getElementById(`ov_memo_${w.dateStr}`)?.value.trim() || '';
    const slots = {};
    let isDifferentFromDefault = false;

    for (let p = 1; p <= 6; p++) {
      const sel = document.getElementById(`ov_slot_${w.dateStr}_${p}`);
      const val = sel ? sel.value : `${w.dayKey}_${p}`;
      slots[p] = val;
      if (val !== `${w.dayKey}_${p}`) isDifferentFromDefault = true;
    }

    if (isDifferentFromDefault || memo) {
      state.dateOverrides[w.dateStr] = { memo, slots };
      changedCount++;
    } else {
      delete state.dateOverrides[w.dateStr];
    }
  });

  localStorage.setItem('math_portal_date_overrides', JSON.stringify(state.dateOverrides));
  renderRealTimetableGrid();
  renderTodayScheduleMini();
  closeDayOverrideModal();
  triggerAutoCloudSync();
  alert('1週間の特時・校時振替設定を保存しました！');
}

function clearCurrentWeekOverrides() {
  if (confirm('今週のすべての特時・校時振替を解除し、通常の基本時間割に戻しますか？')) {
    const weekDays = getWeekDays(state.currentWeekOffset);
    weekDays.forEach(w => {
      delete state.dateOverrides[w.dateStr];
    });
    localStorage.setItem('math_portal_date_overrides', JSON.stringify(state.dateOverrides));
    renderRealTimetableGrid();
    renderTodayScheduleMini();
    closeDayOverrideModal();
    triggerAutoCloudSync();
    alert('今週の振替をすべて解除し、通常日課に戻しました。');
  }
}

function resetAllOverrides() {
  if (confirm('全期間で登録されているすべての特時・振替設定を初期化しますか？')) {
    state.dateOverrides = {};
    localStorage.removeItem('math_portal_date_overrides');
    renderRealTimetableGrid();
    renderTodayScheduleMini();
    triggerAutoCloudSync();
    alert('すべての振替設定をクリアしました。');
  }
}

// ==========================================
// ホーム画面 (本日の予定ミニバー連動)
// ==========================================
function renderTodayScheduleMini() {
  const container = document.getElementById('todayMiniSlots');
  if (!container) return;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayKeys[now.getDay()] || 'mon';

  const dayData = getActualSlotsForDate(dateStr, dayKey);
  const periods = [1, 2, 3, 4, 5, 6];

  let html = '';
  let mathClassCount = 0;

  periods.forEach(p => {
    const slot = dayData.slots[p];
    if (slot && slot.type !== 'free') {
      if (slot.type === 'math') mathClassCount++;
      html += `
        <div class="mini-slot-card" onclick="goToLessonPrep('${slot.class}', '${slot.subject}')">
          <span class="slot-period">${p}限</span>
          ${slot.class ? `<span class="slot-class">${slot.class}</span>` : ''}
          <span class="slot-subject">${slot.subject}</span>
          ${slot.isOverridden ? `<span class="override-badge" style="font-size: 0.65rem;">${slot.type === 'special' ? slot.sourceCode : slot.sourceCode + '振替'}</span>` : ''}
          <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; color: #94a3b8;"></i>
        </div>
      `;
    }
  });

  container.innerHTML = html || '<span style="font-size: 0.82rem; color: #64748b;">本日の予定授業はありません</span>';
}

// ------------------------------------------
// HTMLエスケープユーティリティ
// ------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ------------------------------------------
// ベース時間割のコマ編集モーダル & 学習チップ
// ------------------------------------------
function openSlotEditModal(period, dayKey) {
  state.editingSlot = { period, dayKey };
  const slot = getBaseSlot(dayKey, period);

  const dayNames = { mon: '月曜', tue: '火曜', wed: '水曜', thu: '木曜', fri: '金曜' };
  document.getElementById('slotEditTitle').textContent = `ベースコマの編集 (${dayNames[dayKey]} ${period}限)`;

  document.getElementById('slotClassInput').value = slot.class || '';
  document.getElementById('slotSubjectInput').value = slot.subject || '';

  renderLearnedChips();
  document.getElementById('slotEditModal').classList.remove('hidden');
}

function closeSlotEditModal() {
  document.getElementById('slotEditModal').classList.add('hidden');
}

// クラス名の自然順ソート（1-1, 1-2, 2-1, 2-2, 2-3, 2-4, 2-6... の順に美しく整列）
function sortClassNames(classes) {
  return [...classes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function renderLearnedChips() {
  const classContainer = document.getElementById('classChipsContainer');
  const subjectContainer = document.getElementById('subjectChipsContainer');

  // クラスチップ（自然順ソートで美しく並べる）
  if (classContainer) {
    if (!state.learnedClasses || state.learnedClasses.length === 0) {
      classContainer.innerHTML = '<span class="learned-chip-empty">※入力して保存すると、次回からここにクラス順にボタンが並びます</span>';
    } else {
      const sortedClasses = sortClassNames(state.learnedClasses);
      classContainer.innerHTML = sortedClasses.map(cls => `
        <span class="learned-chip" onclick="setSlotClassChip('${escapeHtml(cls)}')" title="クリックして「${escapeHtml(cls)}」を入力">
          ${escapeHtml(cls)}
          <i class="fa-solid fa-xmark chip-del-btn" onclick="event.stopPropagation(); removeLearnedClass('${escapeHtml(cls)}')" title="この候補を削除"></i>
        </span>
      `).join('');
    }
  }

  // 教科チップ（数学、道徳、学活、総合、会議など）
  if (subjectContainer) {
    if (!state.learnedSubjects || state.learnedSubjects.length === 0) {
      subjectContainer.innerHTML = '<span class="learned-chip-empty">※入力して保存すると、次回からここにワンタップボタンが並びます</span>';
    } else {
      subjectContainer.innerHTML = state.learnedSubjects.map(subj => {
        return `
          <span class="learned-chip" onclick="setSlotSubjectChip('${escapeHtml(subj)}')" title="クリックして「${escapeHtml(subj)}」を入力">
            ${escapeHtml(subj)}
            <i class="fa-solid fa-xmark chip-del-btn" onclick="event.stopPropagation(); removeLearnedSubject('${escapeHtml(subj)}')" title="この候補を削除"></i>
          </span>
        `;
      }).join('');
    }
  }
}

function setSlotClassChip(text) {
  const input = document.getElementById('slotClassInput');
  if (input) input.value = text;
}

function setSlotSubjectChip(text) {
  const input = document.getElementById('slotSubjectInput');
  if (input) input.value = text;
}

function removeLearnedClass(item) {
  state.learnedClasses = state.learnedClasses.filter(x => x !== item);
  localStorage.setItem('math_portal_learned_classes', JSON.stringify(state.learnedClasses));
  renderLearnedChips();
  triggerAutoCloudSync();
}

function removeLearnedSubject(item) {
  state.learnedSubjects = state.learnedSubjects.filter(x => x !== item);
  localStorage.setItem('math_portal_learned_subjects', JSON.stringify(state.learnedSubjects));
  renderLearnedChips();
  triggerAutoCloudSync();
}

function clearCurrentSlot() {
  const { period, dayKey } = state.editingSlot;
  const term = state.currentTerm;
  if (!state.baseTimetables[term]) state.baseTimetables[term] = {};
  if (!state.baseTimetables[term][period]) state.baseTimetables[term][period] = {};

  state.baseTimetables[term][period][dayKey] = {
    class: '',
    subject: '',
    type: 'free'
  };

  localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));
  renderBaseTimetableGrid();
  renderRealTimetableGrid();
  renderTodayScheduleMini();
  closeSlotEditModal();
  showToast('🗑️ コマを空にしました');
  triggerAutoCloudSync();
}

function saveSlotEdit() {
  const { period, dayKey } = state.editingSlot;
  const cls = document.getElementById('slotClassInput').value.trim();
  const subj = document.getElementById('slotSubjectInput').value.trim();

  let finalClass = cls;
  let finalSubj = subj;
  let type = 'free';

  // 空きコマ判定: クラスも教科も空の場合
  if (!finalClass && !finalSubj) {
    finalClass = '';
    finalSubj = '';
    type = 'free';
  } else {
    // 教科から自動でタイプ判別
    type = (finalSubj === '数学' || finalSubj.includes('数学')) ? 'math' : 'other';

    // 入力がある場合、学習履歴（ボタン候補）に自動蓄積
    if (finalClass && !state.learnedClasses.includes(finalClass)) {
      state.learnedClasses.push(finalClass);
      localStorage.setItem('math_portal_learned_classes', JSON.stringify(state.learnedClasses));
    }
    if (finalSubj && !state.learnedSubjects.includes(finalSubj)) {
      state.learnedSubjects.push(finalSubj);
      localStorage.setItem('math_portal_learned_subjects', JSON.stringify(state.learnedSubjects));
    }
  }

  const term = state.currentTerm;
  if (!state.baseTimetables[term]) state.baseTimetables[term] = {};
  if (!state.baseTimetables[term][period]) state.baseTimetables[term][period] = {};

  state.baseTimetables[term][period][dayKey] = {
    class: finalClass,
    subject: finalSubj,
    type: type
  };

  localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));
  renderBaseTimetableGrid();
  renderRealTimetableGrid();
  renderTodayScheduleMini();
  closeSlotEditModal();
  showToast(finalClass ? `💾 【${finalClass} ${finalSubj}】を保存しました` : '💾 コマを空欄として保存しました');
  triggerAutoCloudSync();
}

// ------------------------------------------
// 週案・学習予定モーダル (実時間割での進度・予定管理)
// ------------------------------------------
function openLessonPlanModal(dateStr, period, className, subjectName) {
  state.editingLessonPlan = { dateStr, period, className, subjectName };
  const key = `${dateStr}_${period}`;
  const existingPlan = state.lessonPlans[key] || '';

  const banner = document.getElementById('lessonPlanMetaBanner');
  if (banner) {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dateFormatted = `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]}) ${period}限`;
    banner.innerHTML = `
      <div><strong>${dateFormatted}</strong> : <span style="font-size: 1rem; font-weight: 800;">${escapeHtml(className)}</span></div>
      <div><span class="tt-subject-badge" style="background:#dbeafe; color:#1d4ed8;">${escapeHtml(subjectName)}</span></div>
    `;
  }

  const input = document.getElementById('lessonPlanInput');
  if (input) input.value = existingPlan;

  document.getElementById('lessonPlanModal').classList.remove('hidden');
  setTimeout(() => input?.focus(), 100);
}

function closeLessonPlanModal() {
  document.getElementById('lessonPlanModal').classList.add('hidden');
}

function setLessonKeyword(keyword) {
  const input = document.getElementById('lessonPlanInput');
  if (input) {
    input.value = input.value ? `${input.value} / ${keyword}` : keyword;
  }
}

function clearCurrentLessonPlan() {
  const { dateStr, period } = state.editingLessonPlan;
  const key = `${dateStr}_${period}`;
  delete state.lessonPlans[key];
  localStorage.setItem('math_portal_lesson_plans', JSON.stringify(state.lessonPlans));
  renderRealTimetableGrid();
  closeLessonPlanModal();
  showToast('🗑️ 学習予定をクリアしました');
  triggerAutoCloudSync();
}

function saveLessonPlan() {
  const { dateStr, period } = state.editingLessonPlan;
  const input = document.getElementById('lessonPlanInput');
  const val = input ? input.value.trim() : '';
  const key = `${dateStr}_${period}`;

  if (val) {
    state.lessonPlans[key] = val;
  } else {
    delete state.lessonPlans[key];
  }

  localStorage.setItem('math_portal_lesson_plans', JSON.stringify(state.lessonPlans));
  renderRealTimetableGrid();
  closeLessonPlanModal();
  showToast(val ? `📝 学習予定【${val}】を保存しました` : '📝 学習予定をクリアしました');
  triggerAutoCloudSync();
}

// ------------------------------------------
// ベース時間割一括編集モーダル
// ------------------------------------------
function openTimetableBatchModal() {
  const table = document.getElementById('batchEditTable');
  if (!table) return;

  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const dayHeaders = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日'];
  const periods = [1, 2, 3, 4, 5, 6];

  let headerHtml = `<tr><th style="width: 60px;">校時</th>` + dayHeaders.map(h => `<th>${h}</th>`).join('') + `</tr>`;

  let rowsHtml = periods.map(p => {
    const cells = days.map(d => {
      const slot = getBaseSlot(d, p);
      return `
        <td>
          <div class="batch-cell-inputs">
            <input type="text" class="batch-input-class" id="batch_${p}_${d}_class" value="${escapeHtml(slot.class)}" placeholder="クラス">
            <input type="text" class="batch-input-subj" id="batch_${p}_${d}_subj" value="${escapeHtml(slot.subject)}" placeholder="教科・内容">
            <select id="batch_${p}_${d}_type" style="font-size: 0.72rem; border-radius: 2px;">
              <option value="math" ${slot.type === 'math' ? 'selected' : ''}>数学</option>
              <option value="other" ${slot.type === 'other' ? 'selected' : ''}>その他</option>
              <option value="free" ${slot.type === 'free' ? 'selected' : ''}>空きコマ</option>
            </select>
          </div>
        </td>
      `;
    }).join('');

    return `<tr><th>${p}限</th>${cells}</tr>`;
  }).join('');

  table.innerHTML = `<thead>${headerHtml}</thead><tbody>${rowsHtml}</tbody>`;
  document.getElementById('timetableBatchModal').classList.remove('hidden');
}

function closeTimetableBatchModal() {
  document.getElementById('timetableBatchModal').classList.add('hidden');
}

function saveBatchTimetable() {
  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const periods = [1, 2, 3, 4, 5, 6];
  const term = state.currentTerm;

  if (!state.baseTimetables[term]) state.baseTimetables[term] = {};

  periods.forEach(p => {
    if (!state.baseTimetables[term][p]) state.baseTimetables[term][p] = {};
    days.forEach(d => {
      let cls = document.getElementById(`batch_${p}_${d}_class`)?.value.trim() || '';
      let subj = document.getElementById(`batch_${p}_${d}_subj`)?.value.trim() || '';
      let type = document.getElementById(`batch_${p}_${d}_type`)?.value || 'free';

      if (type === 'free' || (!cls && !subj)) {
        cls = '';
        subj = '';
        type = 'free';
      } else {
        if (cls && !state.learnedClasses.includes(cls)) state.learnedClasses.push(cls);
        if (subj && !state.learnedSubjects.includes(subj)) state.learnedSubjects.push(subj);
      }

      state.baseTimetables[term][p][d] = { class: cls, subject: subj, type: type };
    });
  });

  localStorage.setItem('math_portal_learned_classes', JSON.stringify(state.learnedClasses));
  localStorage.setItem('math_portal_learned_subjects', JSON.stringify(state.learnedSubjects));
  localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));
  renderBaseTimetableGrid();
  renderRealTimetableGrid();
  renderTodayScheduleMini();
  closeTimetableBatchModal();
  triggerAutoCloudSync();
  alert('ベース時間割を保存しました！');
}

function resetTimetableDefault() {
  if (confirm('現在の期のベース時間割をすべて消去し、白紙（空っぽ）に戻しますか？')) {
    state.baseTimetables[state.currentTerm] = createEmptyBaseTimetable();
    localStorage.setItem('math_portal_base_timetables', JSON.stringify(state.baseTimetables));
    renderBaseTimetableGrid();
    renderRealTimetableGrid();
    renderTodayScheduleMini();
    triggerAutoCloudSync();
    alert('ベース時間割を白紙に初期化しました。');
  }
}

// 授業プリント工房への直結
function goToLessonPrep(className, subjectName, lessonPlan = '') {
  const select = document.getElementById('sheetGradeUnit');
  if (select) {
    if (className.includes('2年') || className.includes('2-')) select.value = '中2: 一次関数 (変化の割合・グラフ)';
    else if (className.includes('3年') || className.includes('3-')) select.value = '中3: 平方根の計算';
    else select.value = '中1: 一次方程式の解き方';
    onGradeUnitChange();
  }

  const titleEl = document.getElementById('paperGradeBadge');
  if (titleEl) {
    titleEl.textContent = lessonPlan 
      ? `${className} 数学科 【${lessonPlan}】` 
      : `${className} 数学科 授業プリント`;
  }

  switchTab('worksheet');
}

// ==========================================
// ワークシート工房: ブロック管理 (レゴ方式)
// ==========================================
function generateBlockId() {
  return 'blk_' + Math.random().toString(36).substr(2, 9);
}

function addBlock(type, customData = null) {
  let block = { id: generateBlockId(), type: type, data: {} };

  if (type === 'objective') {
    block.data = {
      text: customData?.text || '一次関数のグラフの傾きと切片の意味を理解し、式からグラフをかくことができる。'
    };
  } else if (type === 'review') {
    block.data = {
      title: customData?.title || '前時のふりかえり・小問',
      content: customData?.content || '比例の式 y = 3x のグラフは、原点(0,0)と点( 1 , 3 )を通る直線である。'
    };
  } else if (type === 'question') {
    block.data = {
      qNum: customData?.qNum || `問 ${state.blocks.filter(b => b.type.includes('question') || b.type.includes('block')).length + 1}`,
      text: customData?.text || '次の方程式を解きなさい。　3x - 5 = 2x + 4',
      answer: customData?.answer || 'x = 9',
      spaceHeight: customData?.spaceHeight || 45
    };
  } else if (type === 'graph-block') {
    block.data = {
      qNum: customData?.qNum || `問 ${state.blocks.filter(b => b.type.includes('question') || b.type.includes('block')).length + 1}`,
      text: customData?.text || '右の図は、一次関数 y = 2x + 1 のグラフである。この直線の傾きと切片を答えなさい。',
      answer: customData?.answer || '傾き: 2 , 切片: 1',
      svgHtml: customData?.svgHtml || generateLinearSvg(2, 1, true, true, 190, 190)
    };
  } else if (type === 'geometry-block') {
    block.data = {
      qNum: customData?.qNum || `問 ${state.blocks.filter(b => b.type.includes('question') || b.type.includes('block')).length + 1}`,
      text: customData?.text || '右の図で、直線 l // m であるとき、∠x の大きさを求めなさい。',
      answer: customData?.answer || '∠x = 80°',
      svgHtml: customData?.svgHtml || generateParallelChevronSvg(45, 35, 200, 150)
    };
  } else if (type === 'summary') {
    block.data = {
      title: customData?.title || '本時のまとめ',
      content: customData?.content || '★ 一次関数 y = ax + b において<br>・ a は「傾き（変化の割合）」を表し、グラフの傾き具合を決める。<br>・ b は「切片」を表し、y軸との交点 (0, b) を通る。'
    };
  } else if (type === 'reflection') {
    block.data = {
      title: '本時の自己評価 & 振り返り'
    };
  }

  state.blocks.push(block);
  renderWorksheet();
}

function moveBlock(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.blocks.length) return;
  const temp = state.blocks[index];
  state.blocks[index] = state.blocks[targetIndex];
  state.blocks[targetIndex] = temp;
  renderWorksheet();
}

function removeBlock(index) {
  state.blocks.splice(index, 1);
  renderWorksheet();
}

function clearWorksheet() {
  if (confirm('ワークシートの全ブロックをクリアしますか？')) {
    state.blocks = [];
    renderWorksheet();
  }
}

function toggleAnswerMode() {
  state.showAnswers = !state.showAnswers;
  document.body.classList.toggle('show-answers', state.showAnswers);
  const btn = document.getElementById('answerModeBtn');
  if (btn) {
    btn.innerHTML = state.showAnswers 
      ? '<i class="fa-solid fa-eye-slash text-danger"></i> 解答を隠す' 
      : '<i class="fa-solid fa-eye"></i> 解答表示切替';
  }
}

function renderWorksheet() {
  const container = document.getElementById('blocksContainer');
  if (!container) return;

  if (state.blocks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8; border: 2px dashed #cbd5e1; border-radius: 8px;">
        <i class="fa-solid fa-cubes" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
        <p>ブロックがありません。左のパレットから「めあて」や「問い」を追加してください。</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.blocks.map((block, index) => {
    let blockContentHtml = '';

    if (block.type === 'objective') {
      blockContentHtml = `
        <div class="objective-box">
          <span class="objective-label">めあて</span>
          <div class="objective-text" contenteditable="true" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
            ${block.data.text}
          </div>
        </div>
      `;
    } else if (block.type === 'review') {
      blockContentHtml = `
        <div class="review-box">
          <div class="review-title" contenteditable="true" onblur="updateBlockData(${index}, 'title', this.innerHTML)">
            <i class="fa-solid fa-clock-rotate-left"></i> ${block.data.title}
          </div>
          <div class="q-body" contenteditable="true" onblur="updateBlockData(${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'question') {
      blockContentHtml = `
        <div class="question-item">
          <div class="q-header">
            <span class="q-num" contenteditable="true" onblur="updateBlockData(${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
            <div class="q-body" contenteditable="true" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
              ${block.data.text}
            </div>
          </div>
          <div class="answer-space" style="min-height: ${block.data.spaceHeight}px;">
            <span class="answer-label">【答】</span>
            <span class="answer-text">（解答例: ${block.data.answer}）</span>
          </div>
        </div>
      `;
    } else if (block.type === 'graph-block') {
      blockContentHtml = `
        <div class="question-item">
          <div class="graph-question-layout">
            <div>
              <div class="q-header">
                <span class="q-num" contenteditable="true" onblur="updateBlockData(${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
                <div class="q-body" contenteditable="true" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
                  ${block.data.text}
                </div>
              </div>
              <div class="answer-space">
                <span class="answer-label">【答】</span>
                <span class="answer-text">（解答例: ${block.data.answer}）</span>
              </div>
            </div>
            <div class="sheet-svg-wrapper">
              ${block.data.svgHtml}
            </div>
          </div>
        </div>
      `;
    } else if (block.type === 'geometry-block') {
      blockContentHtml = `
        <div class="question-item">
          <div class="graph-question-layout">
            <div>
              <div class="q-header">
                <span class="q-num" contenteditable="true" onblur="updateBlockData(${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
                <div class="q-body" contenteditable="true" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
                  ${block.data.text}
                </div>
              </div>
              <div class="answer-space">
                <span class="answer-label">【答】</span>
                <span class="answer-text">（解答例: ${block.data.answer}）</span>
              </div>
            </div>
            <div class="sheet-svg-wrapper">
              ${block.data.svgHtml}
            </div>
          </div>
        </div>
      `;
    } else if (block.type === 'summary') {
      blockContentHtml = `
        <div class="summary-box">
          <div class="summary-header">
            <i class="fa-solid fa-lightbulb"></i>
            <span contenteditable="true" onblur="updateBlockData(${index}, 'title', this.innerText)">${block.data.title}</span>
          </div>
          <div class="summary-content" contenteditable="true" onblur="updateBlockData(${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'reflection') {
      blockContentHtml = `
        <div class="reflection-box">
          <div class="reflection-scales">
            <strong>${block.data.title}</strong>
            <div class="scale-options">
              理解度: <span>[ A: よくわかった ]</span> <span>[ B: だいたい ]</span> <span>[ C: もう少し ]</span>
            </div>
          </div>
          <div class="reflection-comment-line">
            今日の授業で学んだこと・疑問点:
          </div>
        </div>
      `;
    }

    return `
      <div class="sheet-block" id="${block.id}">
        <div class="block-hover-controls no-print">
          <button class="block-ctrl-btn" onclick="moveBlock(${index}, -1)" title="上へ移動"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="block-ctrl-btn" onclick="moveBlock(${index}, 1)" title="下へ移動"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="block-ctrl-btn danger" onclick="removeBlock(${index})" title="ブロック削除"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${blockContentHtml}
      </div>
    `;
  }).join('');
}

function updateBlockData(index, field, value) {
  if (state.blocks[index]) {
    state.blocks[index].data[field] = value;
  }
}

function loadSampleSheet() {
  state.blocks = [];
  addBlock('objective', {
    text: '一次関数の式 y = ax + b からグラフをかき、傾きと切片の関係を説明できる。'
  });
  addBlock('review', {
    title: '前時のふりかえり',
    content: '比例 y = 2x のグラフは原点(0, 0)を通り、右に1進むと上に2進む直線である。'
  });
  addBlock('graph-block', {
    qNum: '問 1',
    text: '右の図は y = 2x + 1 のグラフである。<br>① 切片(y軸との交点)の座標を答えなさい。<br>② グラフの傾き(xが1増えるときのyの増加量)を求めなさい。',
    answer: '① (0, 1) , ② 傾き = 2',
    svgHtml: generateLinearSvg(2, 1, true, true, 200, 200)
  });
  addBlock('geometry-block', {
    qNum: '問 2',
    text: '右の図で、直線 l と m が平行であるとき、折れ線の角 ∠x の大きさを求めなさい。（補助線を引いて考えよう）',
    answer: '∠x = 45° + 35° = 80°',
    svgHtml: generateParallelChevronSvg(45, 35, 200, 150)
  });
  addBlock('summary', {
    title: '本時のまとめ',
    content: '一次関数 y = ax + b のグラフは、<strong>切片(0, b)</strong> を通り、<strong>傾き a</strong> の直線になる！'
  });
  addBlock('reflection');
  
  document.getElementById('memoClass1').value = '問1の切片は全員スムーズだったが、問2の補助線をどこに引くかで戸惑う生徒がいた。机間巡視で「尖った頂点を通る平行線」をヒントに出すと一気に解決した。';
  document.getElementById('memoTiming').value = 'めあて+復習8分、問1で12分、問2で15分、まとめ・振り返り10分でほぼ時間通り。';
  document.getElementById('memoNext').value = '問2の前に、基本の同位角・錯角の合言葉（Zの形）を全員で手でなぞる導入を挟むとさらに良い。';
}

function onGradeUnitChange() {
  const val = document.getElementById('sheetGradeUnit').value;
  document.getElementById('paperTitle').textContent = val;
}

// ==========================================
// PDCAメモの保存
// ==========================================
function savePdcaMemo() {
  const c1 = document.getElementById('memoClass1').value;
  const timing = document.getElementById('memoTiming').value;
  const next = document.getElementById('memoNext').value;
  const unit = document.getElementById('sheetGradeUnit').value;

  const newMemo = {
    id: Date.now(),
    unit: unit,
    date: new Date().toLocaleDateString('ja-JP'),
    points: c1,
    timing: timing,
    nextYear: next
  };

  state.memos.unshift(newMemo);
  localStorage.setItem('math_portal_memos', JSON.stringify(state.memos));
  renderMemosList();
  triggerAutoCloudSync();

  const notif = document.getElementById('saveNotification');
  if (notif) {
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 2000);
  }
}

function renderMemosList() {
  const container = document.getElementById('memosHistoryGrid');
  const countEl = document.getElementById('savedMemosCount');
  if (countEl) countEl.textContent = `${state.memos.length} 件`;
  if (!container) return;

  container.innerHTML = state.memos.map(m => `
    <div class="memo-card">
      <div class="memo-card-header">
        <span><i class="fa-regular fa-calendar"></i> ${m.date}</span>
        <span class="badge badge-success">実践ログ</span>
      </div>
      <div class="memo-card-title">${m.unit}</div>
      <div class="memo-card-body">
        <strong>💡 つまずき・反応:</strong><br>${m.points || '（特になし）'}<br><br>
        <strong>⏱ 時間配分:</strong><br>${m.timing || '（特になし）'}<br><br>
        <strong>🌱 次への改善:</strong><br>${m.nextYear || '（特になし）'}
      </div>
    </div>
  `).join('');
}

// ==========================================
// SVG動的作図エンジン (関数 & 図形)
// ==========================================
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
// 練習プリント・小テスト自動生成システム (全学年・全4領域対応)
// ==========================================

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
        { id: 'g2_lfunc_rate', name: '変化の割合と変域' },
        { id: 'g2_lfunc_graph', name: '傾き・切片とグラフ' },
        { id: 'g2_lfunc_find_eq', name: '直線の式の求め方 (2点・傾きと1点)' },
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
        exp: `${aStr} ＋ (${-b < 0 ? -b : '+' + (-b)}) ＝ ${ans}`
      };
    } else {
      const ans = a + b;
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} ＋ ${bStr}</span>`,
        ans: `${ans}`,
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
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} ÷ ${bStr}</span>`,
        ans: `${ans >= 0 ? '+' : ''}${ans}`,
        exp: `負の符号の個数は ${(a < 0 ? 1 : 0) + (b < 0 ? 1 : 0)} 個。符号は ${ans >= 0 ? '＋' : '－'} で ${Math.abs(a)}÷${Math.abs(b)} ＝ ${ans}`
      };
    } else {
      const a = randNonZero(-9, 9);
      const b = randNonZero(-9, 9);
      const ans = a * b;
      const aStr = a < 0 ? `(${a})` : `(+${a})`;
      const bStr = b < 0 ? `(${b})` : `(+${b})`;
      return {
        q: `次の計算をしなさい。<br><span class="problem-body-math">${aStr} × ${bStr}</span>`,
        ans: `${ans >= 0 ? '+' : ''}${ans}`,
        exp: `負の符号の個数は ${(a < 0 ? 1 : 0) + (b < 0 ? 1 : 0)} 個。答えは ${ans}`
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
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">(${base})² － (${c}) × (${d})</span>`,
      ans: `${ans}`,
      exp: `累乗・乗法を先に計算: (${base})²＝${term1}、(${c})×(${d})＝${term2}。よって ${term1} － (${term2}) ＝ ${ans}`
    };
  },

  g1_letters_value: () => {
    const x = randInt(-4, 4);
    const a = randNonZero(-3, 3);
    const b = randNonZero(-6, 6);
    const ans = a * (x * x) + b * x;
    const aStr = a === 1 ? '' : (a === -1 ? '-' : `${a}`);
    const bStr = b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    return {
      q: `x ＝ ${x} のとき、次の式の値を求めなさい。<br><span class="problem-body-math">${aStr}x² ${bStr}x</span>`,
      ans: `${ans}`,
      exp: `${aStr}(${x})² ${bStr}(${x}) ＝ ${a * (x * x)} ＋ (${b * x}) ＝ ${ans}`
    };
  },

  g1_letters_calc: () => {
    const a = randNonZero(-5, 5);
    const b = randInt(-9, 9);
    const c = randNonZero(-5, 5);
    const d = randInt(-9, 9);
    const ansA = a + c;
    const ansB = b + d;
    const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    const dStr = d >= 0 ? `＋ ${d}` : `－ ${Math.abs(d)}`;
    const ansStr = `${ansA === 0 ? '' : (ansA === 1 ? 'x' : (ansA === -1 ? '-x' : `${ansA}x`))} ${ansB >= 0 ? (ansA !== 0 ? '＋ ' : '') + ansB : '－ ' + Math.abs(ansB)}`.trim();
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">(${a}x ${bStr}) ＋ (${c}x ${dStr})</span>`,
      ans: ansStr || '0',
      exp: `同類項をまとめる: (${a}＋${c})x ＋ (${b}＋${d}) ＝ ${ansStr}`
    };
  },

  g1_letters_expand: () => {
    const k = randInt(2, 4);
    const a = randNonZero(-4, 4);
    const b = randInt(-6, 6);
    const ansA = k * a;
    const ansB = k * b;
    const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    const ansStr = `${ansA}x ${ansB >= 0 ? '＋ ' + ansB : '－ ' + Math.abs(ansB)}`;
    return {
      q: `分配法則を使ってかっこをはずし、簡単にしなさい。<br><span class="problem-body-math">${k}(${a}x ${bStr})</span>`,
      ans: ansStr,
      exp: `${k}×(${a}x) ＋ ${k}×(${b}) ＝ ${ansStr}`
    };
  },

  g1_eq_basic: () => {
    const x = randInt(-8, 8);
    const a = randInt(2, 5);
    const c = randInt(1, a - 1);
    const b = randInt(-12, 12);
    // ax + b = cx + d => (a-c)x = d - b => d = (a-c)*x + b
    const d = (a - c) * x + b;
    const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    const dStr = d >= 0 ? `＋ ${d}` : `－ ${Math.abs(d)}`;
    return {
      q: `次の方程式を解きなさい。<br><span class="problem-body-math">${a}x ${bStr} ＝ ${c}x ${dStr}</span>`,
      ans: `x ＝ ${x}`,
      exp: `xの項を左辺へ、数の項を右辺へ移項: (${a}－${c})x ＝ ${d}－(${b}) → ${a - c}x ＝ ${(a - c) * x} → x ＝ ${x}`
    };
  },

  g1_eq_parentheses: () => {
    const x = randInt(-6, 6);
    const k = randInt(2, 4);
    const a = randInt(-5, 5);
    const rhsA = randInt(1, 3);
    const rhsB = k * (x + a) - rhsA * x;
    const aStr = a >= 0 ? `＋ ${a}` : `－ ${Math.abs(a)}`;
    const rhsBStr = rhsB >= 0 ? `＋ ${rhsB}` : `－ ${Math.abs(rhsB)}`;
    return {
      q: `次の方程式を解きなさい。<br><span class="problem-body-math">${k}(x ${aStr}) ＝ ${rhsA}x ${rhsBStr}</span>`,
      ans: `x ＝ ${x}`,
      exp: `かっこを外す: ${k}x ＋ ${k * a} ＝ ${rhsA}x ${rhsBStr} → 移項して整理: ${k - rhsA}x ＝ ${(k - rhsA) * x} → x ＝ ${x}`
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
    const b1Str = b1 >= 0 ? `＋ ${b1}y` : `－ ${Math.abs(b1)}y`;
    const b2Str = b2 >= 0 ? `＋ ${b2}y` : `－ ${Math.abs(b2)}y`;
    const ansAStr = ansA === 1 ? 'x' : (ansA === -1 ? '-x' : `${ansA}x`);
    const ansBStr = ansB >= 0 ? `＋ ${ansB}y` : `－ ${Math.abs(ansB)}y`;
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">(${a1}x ${b1Str}) － (${a2}x ${b2Str})</span>`,
      ans: `${ansAStr} ${ansBStr}`,
      exp: `ひく式の各項の符号を変えて加える: (${a1}－${a2})x ＋ (${b1}－(${b2}))y ＝ ${ansAStr} ${ansBStr}`
    };
  },

  g2_poly_mul_div: () => {
    const a = randInt(2, 4);
    const b = randInt(2, 3);
    const product = a * b * 3;
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">${product}a²b ÷ (－${a}b)</span>`,
      ans: `－${b * 3}a²`,
      exp: `符号は負。数: ${product}÷(－${a})＝－${b * 3}。文字: a²b÷b ＝ a²。よって －${b * 3}a²`
    };
  },

  g2_poly_transform: () => {
    const a = randInt(2, 4);
    const b = randInt(2, 5);
    const c = randInt(6, 18);
    return {
      q: `等式 <span class="problem-body-math">${a}x ＋ ${b}y ＝ ${c}</span> を y について解きなさい。`,
      ans: `y ＝ (${c} － ${a}x) / ${b}　または　y ＝ －${a}/${b}x ＋ ${simplifyFraction(c, b)}`,
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
      q: `次の連立方程式を加減法で解きなさい。<br><span class="problem-body-math">{ 2x ＋ y ＝ ${c1}<br>&nbsp;&nbsp;x － y ＝ ${c2}</span>`,
      ans: `x ＝ ${x},  y ＝ ${y}`,
      exp: `2つの式を足すと y が消去されて 3x ＝ ${c1 + c2} → x ＝ ${x}。代入して y ＝ ${y}`
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
    const mStr = m >= 0 ? `＋ ${m}` : `－ ${Math.abs(m)}`;
    return {
      q: `次の連立方程式を代入法で解きなさい。<br><span class="problem-body-math">{ y ＝ ${k}x ${mStr}<br>&nbsp;&nbsp;3x ＋ 2y ＝ ${c2}</span>`,
      ans: `x ＝ ${x},  y ＝ ${y}`,
      exp: `2つ目の式の y に (${k}x ${mStr}) を代入: 3x ＋ 2(${k}x ${mStr}) ＝ ${c2} を解いて x ＝ ${x}, y ＝ ${y}`
    };
  },

  g2_simul_complex: () => {
    const x = randInt(2, 4);
    const y = randInt(1, 4);
    // 0.3x + 0.2y = ...
    const c1 = (0.3 * x + 0.2 * y).toFixed(1);
    const c2 = x - y;
    return {
      q: `次の連立方程式を解きなさい。<br><span class="problem-body-math">{ 0.3x ＋ 0.2y ＝ ${c1}<br>&nbsp;&nbsp;x － y ＝ ${c2}</span>`,
      ans: `x ＝ ${x},  y ＝ ${y}`,
      exp: `第1式の両辺を 10倍して 3x ＋ 2y ＝ ${Math.round(c1 * 10)}。これと第2式を連立させて解く。`
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
      exp: `大人 x 円、子ども y 円とする。方程式 { 2x ＋ 3y ＝ ${total1}, x ＝ y ＋ 200 } を解く。`
    };
  },

  g2_lfunc_rate: () => {
    const a = randNonZero(-5, 5);
    const b = randInt(-8, 8);
    const x1 = randInt(-3, 1);
    const x2 = x1 + randInt(2, 4);
    const deltaY = a * (x2 - x1);
    const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    return {
      q: `一次関数 <span class="problem-body-math">y ＝ ${a}x ${bStr}</span> について、次の問いに答えなさい。<br>(1) この関数の変化の割合を答えなさい。<br>(2) x の値が ${x1} から ${x2} まで増加するときの y の増加量を求めなさい。`,
      ans: `(1) ${a} ,  (2) ${deltaY}`,
      exp: `(1) 一次関数の変化の割合は傾き a に等しいので ${a}。<br>(2) y の増加量 ＝ (変化の割合) × (xの増加量) ＝ ${a} × (${x2 - x1}) ＝ ${deltaY}`
    };
  },

  g2_lfunc_graph: () => {
    const a = randNonZero(-4, 4);
    const b = randNonZero(-6, 6);
    const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    return {
      q: `直線 <span class="problem-body-math">y ＝ ${a}x ${bStr}</span> の傾きと切片をそれぞれ答えなさい。`,
      ans: `傾き: ${a} ,  切片: ${b}`,
      exp: `一次関数 y ＝ ax ＋ b において、a が傾き、b が切片です。`
    };
  },

  g2_lfunc_find_eq: () => {
    const a = randNonZero(-3, 3);
    const x1 = randInt(1, 4);
    const b = randInt(-5, 5);
    const y1 = a * x1 + b;
    const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
    return {
      q: `傾きが ${a} で、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
      ans: `y ＝ ${a}x ${bStr}`,
      exp: `求める式を y ＝ ${a}x ＋ b とおき、x＝${x1}, y＝${y1} を代入: ${y1} ＝ ${a}×(${x1}) ＋ b より b ＝ ${b}`
    };
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
      return {
        q: `次の式を展開しなさい。<br><span class="problem-body-math">(x ${sign})²</span>`,
        ans: `x² ${mid >= 0 ? '＋ ' + mid : '－ ' + Math.abs(mid)}x ＋ ${last}`,
        exp: `公式 (x＋a)² ＝ x² ＋ 2ax ＋ a² を利用: x² ＋ 2×(${b})x ＋ (${b})²`
      };
    } else {
      const aStr = a >= 0 ? `＋ ${a}` : `－ ${Math.abs(a)}`;
      const bStr = b >= 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`;
      const sum = a + b;
      const prod = a * b;
      return {
        q: `次の式を展開しなさい。<br><span class="problem-body-math">(x ${aStr})(x ${bStr})</span>`,
        ans: `x² ${sum >= 0 ? '＋ ' + sum : '－ ' + Math.abs(sum)}x ${prod >= 0 ? '＋ ' + prod : '－ ' + Math.abs(prod)}`,
        exp: `公式 (x＋a)(x＋b) ＝ x² ＋ (a＋b)x ＋ ab を利用: 和は ${sum}、積は ${prod}`
      };
    }
  },

  g3_poly_common_factor: () => {
    const m = randInt(2, 4);
    const a = randInt(2, 5);
    return {
      q: `次の式を因数分解しなさい。<br><span class="problem-body-math">${m * a}ax ＋ ${m}ay</span>`,
      ans: `${m}a(${a}x ＋ y)`,
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
      return {
        q: `次の式を因数分解しなさい。<br><span class="problem-body-math">x² － ${a * a}</span>`,
        ans: `(x ＋ ${a})(x － ${a})`,
        exp: `平方の差 a²－b² ＝ (a＋b)(a－b) の公式を利用`
      };
    } else {
      return {
        q: `次の式を因数分解しなさい。<br><span class="problem-body-math">x² ＋ ${sum}x ＋ ${prod}</span>`,
        ans: `(x ＋ ${a})(x ＋ ${b})`,
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
      exp: `分母と分子に √${b} をかける: (${num} × √${b}) / (√${b} × √${b}) ＝ ${num}√${b} / ${b} ＝ ${k}√${b}`
    };
  },

  g3_sqrt_mul_div: () => {
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">√24 × √18</span>`,
      ans: `12√3`,
      exp: `2√6 × 3√2 ＝ 6√12 ＝ 6 × 2√3 ＝ 12√3`
    };
  },

  g3_sqrt_add_sub: () => {
    return {
      q: `次の計算をしなさい。<br><span class="problem-body-math">3√5 ＋ √20 － √45</span>`,
      ans: `2√5`,
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
      exp: `因数分解して (x － ${a})(x － ${b}) ＝ 0 より x ＝ ${a}, ${b}`
    };
  },

  g3_qeq_formula_method: () => {
    return {
      q: `解の公式を用いて、次の方程式を解きなさい。<br><span class="problem-body-math">2x² ＋ 5x － 1 ＝ 0</span>`,
      ans: `x ＝ (－5 ± √33) / 4`,
      exp: `解の公式 x ＝ (-b ± √(b²-4ac)) / 2a に a=2, b=5, c=-1 を代入: x ＝ (-5 ± √(25 - 4×2×(-1))) / 4 ＝ (-5 ± √33) / 4`
    };
  },

  g3_qeq_word: () => {
    return {
      q: `連続する2つの正の奇数があり、それらの積が 63 である。この2つの奇数を求めなさい。`,
      ans: `7 と 9`,
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
      exp: `y ＝ ax² に x＝${x}, y＝${y} を代入して ${y} ＝ ${x * x}a より a ＝ ${a}。よって y ＝ ${a}x²。x＝3 を代入して y ＝ ${a * 9}`
    };
  },

  g3_qfunc_domain: () => {
    const a = -2;
    return {
      q: `関数 <span class="problem-body-math">y ＝ －2x²</span> において、x の変域が <span class="problem-body-math">－3 ≦ x ≦ 2</span> のときの y の変域を求めなさい。`,
      ans: `－18 ≦ y ≦ 0`,
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
      exp: `変化の割合 ＝ a(p＋q) ＝ ${a} × (${x1} ＋ ${x2}) ＝ ${rate}`
    };
  },

  g3_sim_ratio: () => {
    return {
      q: `相似比が 2 : 3 である相似な2つの三角形 ABC と DEF があります。AB ＝ 6cm のとき、対応する辺 DE の長さを求めなさい。`,
      ans: `9 cm`,
      exp: `2 : 3 ＝ 6 : DE より 2DE ＝ 18 → DE ＝ 9 cm`
    };
  },

  g3_sim_area_volume: () => {
    return {
      q: `相似な2つの立体 P と Q があり、相似比は 2 : 3 です。<br>(1) P と Q の表面積の比を求めなさい。<br>(2) P と Q の体積の比を求めなさい。`,
      ans: `(1) 4 : 9 ,  (2) 8 : 27`,
      exp: `相似比が m : n のとき、面積比は m² : n² ＝ 2² : 3² ＝ 4 : 9、体積比は m³ : n³ ＝ 2³ : 3³ ＝ 8 : 27`
    };
  },

  g3_circle_angle: () => {
    const centerAngle = randInt(70, 130);
    const circumAngle = centerAngle / 2;
    return {
      q: `円Oの弧ABに対する中心角が ${centerAngle}° のとき、同じ弧に対する円周角の大きさを求めなさい。`,
      ans: `${circumAngle}°`,
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
      exp: `三平方の定理 c² ＝ a² ＋ b² より、c² ＝ ${a}² ＋ ${b}² ＝ ${a * a} ＋ ${b * b} ＝ ${c * c} → c ＝ ${c} cm`
    };
  },

  g3_pyth_special_ratios: () => {
    return {
      q: `直角二等辺三角形の直角をはさむ1辺の長さが 4cm のとき、斜辺の長さを求めなさい。`,
      ans: `4√2 cm`,
      exp: `45°-45°-90° の直角三角形の辺の比は 1 : 1 : √2 なので、斜辺は 4 × √2 ＝ 4√2 cm`
    };
  },

  g3_sample_estimation: () => {
    const blackPut = 100;
    const sampled = 50;
    const sampleBlack = 5;
    const totalEst = (blackPut * sampled) / sampleBlack;
    const whiteEst = totalEst - blackPut;
    return {
      q: `袋の中に大量の白い碁石が入っています。そこに黒い碁石を ${blackPut}個 入れてよくかき混ぜた後、無作為に ${sampled}個 抽出したところ、黒い碁石が ${sampleBlack}個 含まれていました。袋の中に最初に入っていた白い碁石はおよそ何個と推定されますか。`,
      ans: `およそ ${whiteEst} 個`,
      exp: `全体の碁石数を N個 とすると、N : ${blackPut} ＝ ${sampled} : ${sampleBlack} より N ＝ ${totalEst}。最初に入っていた白碁石は ${totalEst} － ${blackPut} ＝ ${whiteEst}個`
    };
  }
};

// サブユニットIDから該当する問題ジェネレーター関数を取得
function getGeneratorsForSubUnit(grade, subUnitId) {
  // 全体ミックスの場合
  if (subUnitId.includes('all_mix') || subUnitId.includes('_all')) {
    const prefix = `g${grade}_`;
    const matchedKeys = Object.keys(problemGenerators).filter(k => k.startsWith(prefix));
    if (subUnitId.includes('pos_neg')) return matchedKeys.filter(k => k.includes('pos_neg'));
    if (subUnitId.includes('letters')) return matchedKeys.filter(k => k.includes('letters'));
    if (subUnitId.includes('eq')) return matchedKeys.filter(k => k.includes('eq'));
    if (subUnitId.includes('func')) return matchedKeys.filter(k => k.includes('func') || k.includes('prop'));
    if (subUnitId.includes('plane')) return matchedKeys.filter(k => k.includes('plane'));
    if (subUnitId.includes('solid')) return matchedKeys.filter(k => k.includes('solid'));
    if (subUnitId.includes('data')) return matchedKeys.filter(k => k.includes('data'));
    if (subUnitId.includes('poly')) return matchedKeys.filter(k => k.includes('poly'));
    if (subUnitId.includes('simul')) return matchedKeys.filter(k => k.includes('simul'));
    if (subUnitId.includes('lfunc')) return matchedKeys.filter(k => k.includes('lfunc'));
    if (subUnitId.includes('geom')) return matchedKeys.filter(k => k.includes('geom'));
    if (subUnitId.includes('quad')) return matchedKeys.filter(k => k.includes('quad'));
    if (subUnitId.includes('prob')) return matchedKeys.filter(k => k.includes('prob'));
    if (subUnitId.includes('sqrt')) return matchedKeys.filter(k => k.includes('sqrt'));
    if (subUnitId.includes('qeq')) return matchedKeys.filter(k => k.includes('qeq'));
    if (subUnitId.includes('qfunc')) return matchedKeys.filter(k => k.includes('qfunc'));
    if (subUnitId.includes('sim')) return matchedKeys.filter(k => k.includes('sim'));
    if (subUnitId.includes('circle')) return matchedKeys.filter(k => k.includes('circle'));
    if (subUnitId.includes('pyth')) return matchedKeys.filter(k => k.includes('pyth'));
    if (subUnitId.includes('sample')) return matchedKeys.filter(k => k.includes('sample'));
    return matchedKeys;
  }

  // 特定のサブユニットにダイレクト一致
  if (problemGenerators[subUnitId]) {
    return [subUnitId];
  }

  // フォールバック
  const prefix = `g${grade}_`;
  return Object.keys(problemGenerators).filter(k => k.startsWith(prefix));
}

// 練習プリント・小テストの生成実行
function generateQuickTest() {
  const grade = document.getElementById('testGrade')?.value || '2';
  const majorSelect = document.getElementById('testMajorUnit');
  const subSelect = document.getElementById('testSubUnit');
  const countSelect = document.getElementById('testCount');

  const majorId = majorSelect ? majorSelect.value : 'all';
  const subUnitId = subSelect ? subSelect.value : 'all_mix';
  const count = parseInt(countSelect?.value, 10) || 6;

  // カリキュラム情報からタイトル取得
  const gradeUnits = testCurriculum[grade] || [];
  const currentMajor = gradeUnits.find(m => m.id === majorId) || gradeUnits[0];
  const currentSub = currentMajor?.subUnits?.find(s => s.id === subUnitId) || { name: '練習テスト' };

  const testTitle = currentSub.name.replace(/【.*】/, '') || currentMajor.name;
  const majorName = currentMajor ? currentMajor.name : '数学科';

  // 問題ジェネレーターの選定
  const availableGenKeys = getGeneratorsForSubUnit(grade, subUnitId);
  const questions = [];

  for (let i = 0; i < count; i++) {
    const key = availableGenKeys[i % availableGenKeys.length];
    const genFn = problemGenerators[key] || problemGenerators['g1_pos_neg_add_sub'];
    const item = genFn();
    questions.push({
      num: i + 1,
      ...item
    });
  }

  // 1列か2列かの判定 (問題数が8問以上の場合は2列グリッドで見やすく配置)
  const gridClass = count >= 8 ? 'test-problem-grid cols-2' : 'test-problem-grid';

  // 1. 生徒用プリント用紙のHTML構築
  const studentEl = document.getElementById('testStudentPaper');
  if (studentEl) {
    studentEl.innerHTML = `
      <div class="test-paper-header">
        <div class="test-paper-top-row">
          <div class="test-paper-title-area">
            <span class="test-paper-badge">第${grade}学年 数学科 小テストプリント</span>
            <h3 class="test-paper-title">${testTitle}</h3>
          </div>
          <div class="test-paper-student-info">
            <div class="test-student-box">${grade}年 _____組 _____番</div>
            <div class="test-student-box name-box">氏名: </div>
            <div class="test-score-box">
              <div>得点</div>
              <div class="test-score-huge">/ 100</div>
            </div>
          </div>
        </div>
        <div class="test-instruction-note">
          ※ 途中式や計算のあとをしっかり残して解答しなさい。丁寧な文字で書きましょう。
        </div>
      </div>

      <div class="${gridClass}">
        ${questions.map(q => `
          <div class="test-problem-item">
            <div class="problem-header">
              <span class="problem-num">${q.num}</span>
              <div class="problem-text">${q.q}</div>
            </div>
            <div class="problem-workspace">
              <span class="problem-workspace-label">計算スペース</span>
            </div>
            <div class="problem-answer-line">
              <span>【答】</span>
              <span class="problem-answer-fill"></span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="test-paper-footer">
        <span>中学校 数学科 授業・確認プリント [${majorName}]</span>
        <span>出題数: 全${count}問</span>
      </div>
    `;
  }

  // 2. 先生用模範解答用紙のHTML構築
  const answerEl = document.getElementById('testAnswerPaper');
  if (answerEl) {
    answerEl.innerHTML = `
      <div class="test-paper-header" style="border-bottom-color: #dc2626;">
        <div class="test-paper-top-row">
          <div class="test-paper-title-area">
            <span class="test-paper-badge answer-badge">第${grade}学年 模範解答 & 指導用解説</span>
            <h3 class="test-paper-title" style="color: #991b1b;">【模範解答】 ${testTitle}</h3>
          </div>
          <div class="test-paper-student-info">
            <div class="test-student-box" style="border-color: #f87171; background: #fff5f5; color: #dc2626;">
              <i class="fa-solid fa-chalkboard-user"></i> 教員用控
            </div>
            <div class="test-score-box" style="border-color: #dc2626; color: #dc2626;">
              <div>満点</div>
              <div class="test-score-huge">100</div>
            </div>
          </div>
        </div>
        <div class="test-instruction-note" style="color: #b91c1c;">
          ※ 生徒のつまずきやすい点や、途中式の確認にご活用ください。
        </div>
      </div>

      <div class="${gridClass}">
        ${questions.map(q => `
          <div class="test-problem-item answer-mode">
            <div class="problem-header">
              <span class="problem-num" style="background: #dc2626;">${q.num}</span>
              <div class="problem-text">${q.q}</div>
            </div>
            <div class="problem-answer-line" style="margin-top: 14px;">
              <span style="color: #dc2626; font-weight: 800;">【正答】</span>
              <span class="problem-answer-fill" style="border-bottom-color: #dc2626; font-weight: 800;">${q.ans}</span>
            </div>
            ${q.exp ? `
              <div class="answer-explanation-box">
                <strong><i class="fa-solid fa-lightbulb"></i> 解き方のポイント:</strong><br>
                ${q.exp}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      <div class="test-paper-footer">
        <span style="color: #dc2626;">中学校 数学科 指導用模範解答 [${majorName}]</span>
        <span>正答数: 全${count}問</span>
      </div>
    `;
  }
}

// 印刷関数群 (各対象のみを完全に独立して印刷)
function printStudentTestPaper() {
  document.body.setAttribute('data-print-target', 'test-student');
  window.print();
}

function printAnswerTestPaper() {
  document.body.setAttribute('data-print-target', 'test-answer');
  window.print();
}

function printWorksheetPaper() {
  document.body.setAttribute('data-print-target', 'worksheet');
  window.print();
}

// 印刷ダイアログ終了時に属性を解除
window.addEventListener('afterprint', () => {
  document.body.removeAttribute('data-print-target');
});


// ==========================================
// 授業用タイマー
// ==========================================
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
// 全データバックアップ・復元 (JSONファイル保存 & 読み込み)
// ==========================================

// トースト通知（画面右下の保存完了メッセージ）
function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// 全データのエクスポート（JSONファイルとしてPCに保存）
function exportAllDataBackup() {
  const backupData = {
    appName: '中学数学科ポータル',
    version: '1.2',
    exportDate: new Date().toISOString(),
    bellSettings: state.bellSettings,
    termsList: state.termsList,
    baseTimetables: state.baseTimetables,
    currentTerm: state.currentTerm,
    dateOverrides: state.dateOverrides,
    lessonPlans: state.lessonPlans,
    learnedClasses: state.learnedClasses,
    learnedSubjects: state.learnedSubjects,
    memos: state.memos
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const filename = `数学科ポータル_データ保存_${dateStr}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('<i class="fa-solid fa-circle-check text-emerald"></i> データをファイルにバックアップ保存しました！');
}

// バックアップファイルのインポート（ファイルからデータを一括復元）
function importBackupFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.bellSettings) {
        state.bellSettings = data.bellSettings;
        localStorage.setItem('math_portal_bell_settings', JSON.stringify(data.bellSettings));
      }
      if (data.termsList && Array.isArray(data.termsList)) {
        state.termsList = data.termsList;
        localStorage.setItem('math_portal_terms_list', JSON.stringify(data.termsList));
      }
      if (data.baseTimetables) {
        state.baseTimetables = data.baseTimetables;
        localStorage.setItem('math_portal_base_timetables', JSON.stringify(data.baseTimetables));
      }
      if (data.currentTerm) {
        state.currentTerm = data.currentTerm;
        localStorage.setItem('math_portal_current_term', data.currentTerm);
      }
      if (data.dateOverrides) {
        state.dateOverrides = data.dateOverrides;
        localStorage.setItem('math_portal_date_overrides', JSON.stringify(data.dateOverrides));
      }
      if (data.lessonPlans) {
        state.lessonPlans = data.lessonPlans;
        localStorage.setItem('math_portal_lesson_plans', JSON.stringify(data.lessonPlans));
      }
      if (data.learnedClasses) {
        state.learnedClasses = data.learnedClasses;
        localStorage.setItem('math_portal_learned_classes', JSON.stringify(data.learnedClasses));
      }
      if (data.learnedSubjects) {
        state.learnedSubjects = data.learnedSubjects;
        localStorage.setItem('math_portal_learned_subjects', JSON.stringify(data.learnedSubjects));
      }
      if (data.memos) {
        state.memos = data.memos;
        localStorage.setItem('math_portal_memos', JSON.stringify(data.memos));
      }

      initBellSettingsUI();
      previewBellSchedule();
      renderTermSelector();
      renderBaseTimetableGrid();
      renderRealTimetableGrid();
      renderTodayScheduleMini();
      renderMemosList();
      triggerAutoCloudSync();

      showToast('<i class="fa-solid fa-circle-check text-emerald"></i> バックアップデータを正常に復元しました！');
      alert('バックアップデータを正常に読み込み・復元しました！');
    } catch (err) {
      alert('ファイルの読み込みに失敗しました。正しいJSONバックアップファイルを選択してください。');
      console.error(err);
    }
  };
  reader.readAsText(file);
  event.target.value = ''; // 次回同じファイルを選べるようリセット
}

// ==========================================
// Googleスプレッドシート連携（クラウド自動同期）
// ==========================================

let autoSyncDebounceTimer = null;

function initCloudSync() {
  // URLパラメータ（?gas=...）があれば自動連携（タブレット用QRスキャン時など）
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const gasParam = urlParams.get('gas');
    if (gasParam && gasParam.startsWith('https://script.google.com/')) {
      state.cloudSettings.gasUrl = gasParam.trim();
      localStorage.setItem('math_portal_gas_url', state.cloudSettings.gasUrl);
      window.history.replaceState({}, document.title, window.location.pathname);
      showToast('<i class="fa-solid fa-circle-check text-emerald"></i> スプレッドシート連携を設定しました！');
    }
  } catch (e) {
    console.error('URL parse error:', e);
  }

  updateCloudStatusUI();

  // 起動時の自動取得
  if (state.cloudSettings.gasUrl && navigator.onLine) {
    syncFromCloud(false);
  }

  // 画面に戻ってきた時（タブ復帰・ウィンドウフォーカス時）に最新データを自動同期
  window.addEventListener('focus', () => {
    if (state.cloudSettings.gasUrl && navigator.onLine && !state.cloudSettings.isSyncing) {
      syncFromCloud(false);
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.cloudSettings.gasUrl && navigator.onLine && !state.cloudSettings.isSyncing) {
      syncFromCloud(false);
    }
  });

  // 30秒ごとにバックグラウンドで他端末の変更を自動チェック
  setInterval(() => {
    if (state.cloudSettings.gasUrl && state.cloudSettings.autoSync && navigator.onLine && !state.cloudSettings.isSyncing) {
      syncFromCloud(false);
    }
  }, 30000);
}

function handleHeaderSyncBtnClick() {
  if (state.cloudSettings.gasUrl) {
    syncFromCloud(true);
  } else {
    openCloudSyncModal();
  }
}

function updateCloudStatusUI() {
  const btn = document.getElementById('cloudSyncHeaderBtn');
  const text = document.getElementById('cloudSyncStatusText');
  const banner = document.getElementById('cloudStatusBanner');
  const hasUrl = !!state.cloudSettings.gasUrl;

  if (text) {
    if (state.cloudSettings.isSyncing) {
      text.textContent = '同期中...';
    } else if (hasUrl) {
      text.textContent = '同期完了';
    } else {
      text.textContent = 'スプレッドシート同期';
    }
  }

  if (btn) {
    btn.classList.toggle('syncing', state.cloudSettings.isSyncing);
    if (hasUrl) {
      btn.style.borderColor = '#10b981';
      btn.style.color = '#34d399';
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  }

  if (banner) {
    if (hasUrl) {
      const lastTime = state.cloudSettings.lastSyncTime || '未同期';
      banner.className = 'cloud-status-banner connected';
      banner.innerHTML = `
        <i class="fa-solid fa-circle-check text-emerald" style="font-size: 1.2rem;"></i>
        <div>
          <strong>Googleスプレッドシートと正常に接続されています</strong>
          <div style="font-size: 0.75rem; color: #065f46;">最終同期: ${lastTime}（データは安全に資産化されています）</div>
        </div>
      `;
    } else {
      banner.className = 'cloud-status-banner';
      banner.innerHTML = `
        <i class="fa-solid fa-circle-info text-primary" style="font-size: 1.2rem;"></i>
        <div>
          <strong>スプレッドシート未連携（現在ローカル保存モードです）</strong>
          <div style="font-size: 0.75rem; color: #64748b;">下の「1分で完了する連携手順」に従ってURLを入力すると、タブレットやスマホとも完全自動同期されます。</div>
        </div>
      `;
    }
  }

  // タブレット連携QRコード表示更新
  const tabletSection = document.getElementById('tabletShareSection');
  const qrImage = document.getElementById('tabletQrImage');
  if (tabletSection && qrImage) {
    if (hasUrl) {
      tabletSection.style.display = 'block';
      const shareUrl = `${window.location.origin}${window.location.pathname}?gas=${encodeURIComponent(state.cloudSettings.gasUrl)}`;
      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;
    } else {
      tabletSection.style.display = 'none';
    }
  }

  const urlInput = document.getElementById('gasUrlInput');
  if (urlInput) urlInput.value = state.cloudSettings.gasUrl;

  const autoBox = document.getElementById('autoSyncCheckbox');
  if (autoBox) autoBox.checked = state.cloudSettings.autoSync;
}

function copyTabletShareUrl() {
  if (!state.cloudSettings.gasUrl) return;
  const shareUrl = `${window.location.origin}${window.location.pathname}?gas=${encodeURIComponent(state.cloudSettings.gasUrl)}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('<i class="fa-solid fa-copy text-emerald"></i> タブレット連携用のURLをコピーしました！');
    }).catch(() => {
      prompt('以下の連携URLをコピーしてタブレットで開いてください：', shareUrl);
    });
  } else {
    prompt('以下の連携URLをコピーしてタブレットで開いてください：', shareUrl);
  }
}

function openCloudSyncModal() {
  updateCloudStatusUI();
  document.getElementById('cloudSyncModal').classList.remove('hidden');
}

function closeCloudSyncModal() {
  document.getElementById('cloudSyncModal').classList.add('hidden');
}

function saveGasUrlSettings() {
  const input = document.getElementById('gasUrlInput');
  const url = input ? input.value.trim() : '';

  if (url && !url.startsWith('https://script.google.com/')) {
    alert('正しいGoogle Apps ScriptのウェブアプリURL (https://script.google.com/macros/s/.../exec) を入力してください。');
    return;
  }

  state.cloudSettings.gasUrl = url;
  localStorage.setItem('math_portal_gas_url', url);
  updateCloudStatusUI();

  if (url) {
    syncFromCloud(true);
  } else {
    showToast('スプレッドシート連携設定を更新しました');
    closeCloudSyncModal();
  }
}

function onAutoSyncToggle() {
  const autoBox = document.getElementById('autoSyncCheckbox');
  state.cloudSettings.autoSync = autoBox ? autoBox.checked : true;
  localStorage.setItem('math_portal_auto_sync', state.cloudSettings.autoSync);
}

function disconnectCloudSync() {
  if (confirm('Googleスプレッドシートとの連携を解除しますか？\n（※端末内のデータやスプレッドシート上のデータは削除されません）')) {
    state.cloudSettings.gasUrl = '';
    localStorage.removeItem('math_portal_gas_url');
    updateCloudStatusUI();
    showToast('スプレッドシート連携を解除しました');
  }
}

// クラウドからデータ取得 (GET)
async function syncFromCloud(isManual = false) {
  const urlInput = document.getElementById('gasUrlInput');
  if (urlInput && urlInput.value.trim()) {
    state.cloudSettings.gasUrl = urlInput.value.trim();
    localStorage.setItem('math_portal_gas_url', state.cloudSettings.gasUrl);
    updateCloudStatusUI();
  }

  const url = state.cloudSettings.gasUrl;
  if (!url) {
    if (isManual) alert('先にGoogle Apps ScriptのウェブアプリURLを入力してください。');
    return;
  }

  state.cloudSettings.isSyncing = true;
  updateCloudStatusUI();
  if (isManual) showToast('<i class="fa-solid fa-cloud-arrow-down"></i> スプレッドシートから読み込み中...');

  try {
    const isEditingModalOpen = !document.getElementById('slotEditModal')?.classList.contains('hidden') ||
                              !document.getElementById('dayOverrideModal')?.classList.contains('hidden') ||
                              !document.getElementById('lessonPlanModal')?.classList.contains('hidden') ||
                              !document.getElementById('timetableBatchModal')?.classList.contains('hidden');
    if (isEditingModalOpen && !isManual) {
      return; // ユーザーが入力作業中の場合はバックグラウンド更新をスキップ
    }

    const fetchUrl = url + (url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
    const res = await fetch(fetchUrl, { cache: 'no-store' });
    const json = await res.json();

    if (json.status === 'success' && json.data) {
      const data = json.data;

      const prevExportDate = localStorage.getItem('math_portal_last_data_export_date');
      const hasNewerData = data.exportDate && prevExportDate && data.exportDate !== prevExportDate;

      if (data.bellSettings) {
        state.bellSettings = data.bellSettings;
        localStorage.setItem('math_portal_bell_settings', JSON.stringify(data.bellSettings));
      }
      if (data.termsList && Array.isArray(data.termsList)) {
        state.termsList = data.termsList;
        localStorage.setItem('math_portal_terms_list', JSON.stringify(data.termsList));
      }
      if (data.baseTimetables) {
        state.baseTimetables = data.baseTimetables;
        localStorage.setItem('math_portal_base_timetables', JSON.stringify(data.baseTimetables));
      }
      if (data.currentTerm) {
        state.currentTerm = data.currentTerm;
        localStorage.setItem('math_portal_current_term', data.currentTerm);
      }
      if (data.dateOverrides) {
        state.dateOverrides = data.dateOverrides;
        localStorage.setItem('math_portal_date_overrides', JSON.stringify(data.dateOverrides));
      }
      if (data.lessonPlans) {
        state.lessonPlans = data.lessonPlans;
        localStorage.setItem('math_portal_lesson_plans', JSON.stringify(data.lessonPlans));
      }
      if (data.learnedClasses) {
        state.learnedClasses = data.learnedClasses;
        localStorage.setItem('math_portal_learned_classes', JSON.stringify(data.learnedClasses));
      }
      if (data.learnedSubjects) {
        state.learnedSubjects = data.learnedSubjects;
        localStorage.setItem('math_portal_learned_subjects', JSON.stringify(data.learnedSubjects));
      }
      if (data.memos) {
        state.memos = data.memos;
        localStorage.setItem('math_portal_memos', JSON.stringify(data.memos));
      }
      if (data.exportDate) {
        localStorage.setItem('math_portal_last_data_export_date', data.exportDate);
      }

      initBellSettingsUI();
      previewBellSchedule();
      renderTermSelector();
      renderBaseTimetableGrid();
      renderRealTimetableGrid();
      renderTodayScheduleMini();
      renderMemosList();

      const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
      state.cloudSettings.lastSyncTime = timeStr;
      localStorage.setItem('math_portal_last_sync_time', timeStr);

      if (isManual) {
        showToast(`<i class="fa-solid fa-cloud-arrow-down text-emerald"></i> スプレッドシートと同期完了 (${timeStr})`);
        closeCloudSyncModal();
      } else if (hasNewerData) {
        showToast(`<i class="fa-solid fa-arrows-rotate text-emerald"></i> 他端末の最新の変更を画面に反映しました (${timeStr})`);
      }
    } else if (json.status === 'success' && !json.data) {
      // スプレッドシート側が初回で空の場合、現在のローカルデータを送信
      if (isManual) {
        showToast('スプレッドシートが空のため、現在のデータを書き出します...');
        syncToCloud(true);
      }
    }
  } catch (err) {
    console.error('Cloud sync error:', err);
    if (isManual) {
      alert('スプレッドシートとの通信に失敗しました。URLが正しいか、GASのアクセス権が「全員」になっているかご確認ください。');
    }
  } finally {
    state.cloudSettings.isSyncing = false;
    updateCloudStatusUI();
  }
}

// クラウドへデータ送信 (POST)
async function syncToCloud(isManual = false) {
  const urlInput = document.getElementById('gasUrlInput');
  if (urlInput && urlInput.value.trim()) {
    state.cloudSettings.gasUrl = urlInput.value.trim();
    localStorage.setItem('math_portal_gas_url', state.cloudSettings.gasUrl);
    updateCloudStatusUI();
  }

  const url = state.cloudSettings.gasUrl;
  if (!url) {
    if (isManual) alert('先にGoogle Apps ScriptのウェブアプリURLを入力してください。');
    return;
  }

  state.cloudSettings.isSyncing = true;
  updateCloudStatusUI();
  if (isManual) showToast('<i class="fa-solid fa-cloud-arrow-up"></i> スプレッドシートへ保存中...');

  const payload = {
    appName: '中学数学科ポータル',
    version: '1.2',
    exportDate: new Date().toISOString(),
    bellSettings: state.bellSettings,
    termsList: state.termsList,
    baseTimetables: state.baseTimetables,
    currentTerm: state.currentTerm,
    dateOverrides: state.dateOverrides,
    lessonPlans: state.lessonPlans,
    learnedClasses: state.learnedClasses,
    learnedSubjects: state.learnedSubjects,
    memos: state.memos
  };

  try {
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      mode: 'no-cors'
    });

    localStorage.setItem('math_portal_last_data_export_date', payload.exportDate);

    const timeStr = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    state.cloudSettings.lastSyncTime = timeStr;
    localStorage.setItem('math_portal_last_sync_time', timeStr);

    showToast(`<i class="fa-solid fa-circle-check text-emerald"></i> スプレッドシートに自動保存しました (${timeStr})`);
    if (isManual) closeCloudSyncModal();
  } catch (err) {
    console.error('Cloud save error:', err);
    if (isManual) {
      alert('スプレッドシートへの書き出しに失敗しました。URLをご確認ください。');
    }
  } finally {
    state.cloudSettings.isSyncing = false;
    updateCloudStatusUI();
  }
}

// 自動同期トリガー (変更時にバックグラウンドで自動送信)
function triggerAutoCloudSync() {
  if (!state.cloudSettings.gasUrl || !state.cloudSettings.autoSync) return;
  clearTimeout(autoSyncDebounceTimer);
  autoSyncDebounceTimer = setTimeout(() => {
    syncToCloud(false);
  }, 1200); // 1.2秒後に静かに自動送信
}
