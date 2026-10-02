
// クラス名から学年（1, 2, 3）を正確に抽出する共通ヘルパー
function extractGradeFromClassName(cls) {
  if (!cls) return '2';
  const trimmed = String(cls).trim();
  const m = trimmed.match(/^([1-3])/);
  if (m) return m[1];
  const m2 = trimmed.match(/([1-3])年/);
  if (m2) return m2[1];
  if (trimmed.includes('3')) return '3';
  if (trimmed.includes('2')) return '2';
  if (trimmed.includes('1')) return '1';
  return '2';
}

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
  blocksLeft: [],
  blocksRight: [],
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

  selectB4Grade('3');
  renderDigitalLibrary();
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
  } else if (type === 'board-task') {
    block.data = {
      qNum: customData?.qNum || '【本時の課題】',
      text: customData?.text || '式 $(a+b+2)(a+b-5)$ を展開するにはどうすればよいだろうか？共通な部分を見つけて工夫しよう。',
      guide: customData?.guide || '着眼点: 共通な部分に着目して、1つのまとまり（$M$など）とおいてみよう。',
      thinkingSpaceHeight: customData?.thinkingSpaceHeight || 85,
      answer: customData?.answer || '$a+b=M$ とおくと、$(M+2)(M-5) = M^2 - 3M - 10$。'
    };
  } else if (type === 'point-box') {
    block.data = {
      badge: customData?.badge || '要点公式',
      title: customData?.title || '重要ポイント・公式まとめ',
      content: customData?.content || '公式や定義のまとめを入力します。'
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
    } else if (block.type === 'board-task') {
      blockContentHtml = `
        <div class="board-task-box">
          <div class="board-task-header">
            <span class="board-task-badge"><i class="fa-solid fa-chalkboard-user"></i> ${block.data.qNum}</span>
            <div class="board-task-text" contenteditable="true" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
              ${block.data.text}
            </div>
          </div>
          ${block.data.guide ? `
            <div class="board-task-guide" contenteditable="true" onblur="updateBlockData(${index}, 'guide', this.innerHTML)">
              <i class="fa-solid fa-compass text-primary"></i> ${block.data.guide}
            </div>
          ` : ''}
          <div class="board-task-canvas" style="min-height: ${block.data.thinkingSpaceHeight || 85}px;">
            <div class="canvas-grid-label">【自分の考え・途中式・説明】</div>
            <div class="answer-space answer-text-inline">
              <span class="answer-label">【板書まとめ・模範解】</span>
              <span class="answer-text">${block.data.answer}</span>
            </div>
          </div>
        </div>
      `;
    } else if (block.type === 'point-box') {
      blockContentHtml = `
        <div class="point-summary-box">
          <div class="point-summary-header">
            <span class="point-badge"><i class="fa-solid fa-bookmark"></i> ${block.data.badge || '要点公式'}</span>
            <strong contenteditable="true" onblur="updateBlockData(${index}, 'title', this.innerText)">${block.data.title}</strong>
          </div>
          <div class="point-summary-body" contenteditable="true" onblur="updateBlockData(${index}, 'content', this.innerHTML)">
            ${block.data.content}
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


// ==========================================
// 授業プリント・単元プリセットデータ（板書書籍・要点ブック連動）
// ==========================================
const lessonUnitPresets = {
  // --- 中3 ---
  'g3_poly_expand': {
    grade: '3',
    unitName: '多項式の展開・因数分解',
    lessonTitle: '工夫して式を展開しよう（置き換えの利用）',
    badge: '中3数学 / 明治図書板書 3年上',
    boardPdf: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中3数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '',
    blocks: [
      {
        type: 'objective',
        data: { text: '共通な部分に着目して式の一部を別の文字とおきかえ、乗法公式を使って工夫して展開できる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・乗法公式',
          content: '公式: $(x+a)(x+b) = x^2 + (a+b)x + ab$　例: $(x+3)(x+5) = x^2 + 8x + 15$'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '式 $(a+b+2)(a+b-5)$ を展開するにはどうすればよいだろうか？共通な部分を見つけて工夫しよう。',
          guide: '着眼点: $a+b$ がどちらのカッコにもあるね。1つのまとまり（$M$など）とおいてみよう。',
          thinkingSpaceHeight: 90,
          answer: '$a+b=M$ とおくと、$(M+2)(M-5) = M^2 - 3M - 10$。元に戻して $(a+b)^2 - 3(a+b) - 10 = a^2 + 2ab + b^2 - 3a - 3b - 10$'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '板書まとめ',
          title: '置き換えによる展開のポイント',
          content: '式の中に同じまとまりがあるときは、それを <strong>1つの文字 $M$</strong> とおくことで、知っている乗法公式にあてはめて簡単に展開できる！'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '置き換えの工夫を使って、次の式を展開しなさい。<br>$(x+y+3)(x+y-3)$',
          answer: '$x+y=M$ とおくと $(M+3)(M-3) = M^2 - 9 = (x+y)^2 - 9 = x^2 + 2xy + y^2 - 9$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g3_sqrt_calc': {
    grade: '3',
    unitName: '平方根の性質と乗除',
    lessonTitle: '根号をふくむ式の乗法と除法',
    badge: '中3数学 / 明治図書板書 3年上',
    boardPdf: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中3数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '',
    blocks: [
      {
        type: 'objective',
        data: { text: '$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$ の性質を理解し、根号を含む式の乗法・除法を正確に計算できる。' }
      },
      {
        type: 'review',
        data: {
          title: '平方根の定義のふりかえり',
          content: '面積が $2$ の正方形の1辺の長さは $\\sqrt{2}$、面積が $3$ の正方形の1辺の長さは $\\sqrt{3}$ である。'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '$\\sqrt{2} \\times \\sqrt{3} = \\sqrt{6}$ になる理由を、正方形や長方形の面積をもとに説明しよう。',
          guide: 'ヒント: 2乗して $6$ になる正の数は何だろう？ $(\\sqrt{2} \\times \\sqrt{3})^2$ を計算してみよう。',
          thinkingSpaceHeight: 90,
          answer: '理由: $(\\sqrt{2}\\times\\sqrt{3})^2 = (\\sqrt{2})^2 \\times (\\sqrt{3})^2 = 2 \\times 3 = 6$。2乗して6になる正の数だから $\\sqrt{6}$ である。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '要点公式',
          title: '根号をふくむ式の計算公式（$a>0, b>0$）',
          content: '① <strong>$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$</strong>　（根号の中身同士をかける）<br>② <strong>$\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$</strong>　（根号の中身同士をわる）'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の計算をしなさい。<br>(1) $\\sqrt{3} \\times \\sqrt{5}$　　(2) $\\sqrt{24} \\div \\sqrt{2}$',
          answer: '(1) $\\sqrt{15}$　　(2) $\\sqrt{12} = 2\\sqrt{3}$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g3_quad_factor': {
    grade: '3',
    unitName: '2次方程式の解き方',
    lessonTitle: '因数分解を利用した2次方程式の解法',
    badge: '中3数学 / 明治図書板書 3年上',
    boardPdf: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中3数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '',
    blocks: [
      {
        type: 'objective',
        data: { text: '$AB=0$ ならば $A=0$ または $B=0$ の性質を利用して、2次方程式を因数分解によって解くことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・因数分解',
          content: '因数分解公式: $x^2 - 5x + 6 = (x - 2)(x - 3)$'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '2次方程式 $x^2 - 5x + 6 = 0$ の解を求めるには、左辺をどのように変形すればよいだろうか？',
          guide: 'ヒント: 2つの式をかけて $0$ になるとき、それぞれの式はどうなっているかな？',
          thinkingSpaceHeight: 90,
          answer: '左辺を因数分解すると $(x-2)(x-3)=0$。かけて0になるから $x-2=0$ または $x-3=0$。よって解は $x=2, 3$。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '板書まとめ',
          title: '因数分解による解法のまとめ',
          content: '2次方程式の左辺を $(x-\\alpha)(x-\\beta)=0$ の形に因数分解できれば、解は <strong>$x = \\alpha, \\beta$</strong> とすぐに求められる！'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の方程式を解きなさい。<br>(1) $(x-4)(x+1) = 0$　　(2) $x^2 - 7x + 12 = 0$',
          answer: '(1) $x = 4, -1$　　(2) $(x-3)(x-4)=0$ より $x = 3, 4$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  // --- 中2 ---
  'g2_linear_graph': {
    grade: '2',
    unitName: '一次関数とグラフ',
    lessonTitle: '一次関数のグラフと傾き・切片',
    badge: '中2数学 / 学習プリント 3-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中2数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/02_2年生/数学_3-1一次関数とグラフ.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '一次関数の式 $y = ax + b$ からグラフの傾きと切片を読み取り、正確に直線グラフをかくことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・比例',
          content: '比例 $y = 2x$ のグラフは原点 $(0, 0)$ を通り、右に1進むと上に2進む直線である。'
        }
      },
      {
        type: 'graph-block',
        data: {
          qNum: '【本時の課題】',
          text: '右の図は $y = 2x + 1$ のグラフである。<br>① 切片（$y$軸との交点）の座標を答えなさい。<br>② グラフの傾き（$x$が1増えるときの$y$の増加量）を求めなさい。',
          answer: '① $(0, 1)$　② 傾き $= 2$',
          svgHtml: '' // load時に生成
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '要点まとめ',
          title: '一次関数 $y = ax + b$ のグラフの性質',
          content: '・ <strong>$a$（傾き）</strong>: グラフの傾き具合。$x$ が1増えるときの $y$ の増加量。<br>・ <strong>$b$（切片）</strong>: グラフと $y$ 軸との交点 $(0, b)$。'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '一次関数 $y = -3x + 4$ について、次の問いに答えなさい。<br>(1) この直線の傾きと切片を答えなさい。<br>(2) $x=2$ のときの $y$ の値を求めなさい。',
          answer: '(1) 傾き: $-3$, 切片: $4$　(2) $y = -3(2) + 4 = -2$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g2_sim_eq': {
    grade: '2',
    unitName: '連立方程式の解き方',
    lessonTitle: '連立方程式の解法（加減法）',
    badge: '中2数学 / 学習プリント 2-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中2数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/02_2年生/数学_2-1連立方程式.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '係数をそろえて2つの式をたしたりひいたりし、文字を1つ消去して連立方程式を解くことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・1次方程式',
          content: '方程式 $3x = 12$ の解は $x = 4$。文字が1つなら解くことができる！'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '連立方程式 $\\begin{cases} 2x + y = 11 \\\\ 2x - y = 5 \\end{cases}$ を解くには、どうすれば文字を1つにできるだろうか？',
          guide: 'ヒント: 2つの式の左辺同士、右辺同士をたしたりひいたりしてみよう。',
          thinkingSpaceHeight: 90,
          answer: '2つの式をたすと $4x = 16 \\rightarrow x = 4$。代入して $y = 3$。解は $(x, y) = (4, 3)$。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '加減法のポイント',
          title: '連立方程式の解き方の手順',
          content: '① どちらかの文字の係数の絶対値をそろえる。<br>② 2つの式を <strong>たしたりひいたりして、文字を1つ消去</strong> する！<br>③ 出た解を代入してもう1つの文字を求める。'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の連立方程式を加減法で解きなさい。<br>$\\begin{cases} x + y = 7 \\\\ x - y = 3 \\end{cases}$',
          answer: 'たして $2x = 10 \\rightarrow x = 5$。代入して $y = 2$。答: $x=5, y=2$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g2_parallel_angle': {
    grade: '2',
    unitName: '平行線と角・合同',
    lessonTitle: '平行線と角（同位角と錯角）',
    badge: '中2数学 / 学習プリント 4-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中2数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/02_2年生/数学_4-1平行と合同.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '平行線における同位角・錯角の性質を理解し、補助線を引いて未知の角の大きさを求めることができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・対頂角',
          content: '向かい合う角（対頂角）は常に等しい。また、同位角・錯角の位置関係を確認しよう。'
        }
      },
      {
        type: 'geometry-block',
        data: {
          qNum: '【本時の課題】',
          text: '右の図で、直線 $l$ と $m$ が平行であるとき、折れ線の角 $\\angle x$ の大きさを求めなさい。（補助線を引いて考えよう）',
          answer: '$\\angle x = 45^\\circ + 35^\\circ = 80^\\circ$',
          svgHtml: '' // load時に生成
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '定理まとめ',
          title: '平行線と角の重要性質',
          content: '2直線が平行ならば、<strong>同位角は等しい</strong>。また <strong>錯角は等しい</strong>。<br>折れ線の角は、<strong>「尖った頂点を通る平行な補助線」</strong> を引いて2つに分けて考える！'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '$l // m$ のとき、同位角が $65^\\circ$ である角の錯角の大きさを求めなさい。',
          answer: '$65^\\circ$（平行線なので錯角も等しい）',
          spaceHeight: 45
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  // --- 中1 ---
  'g1_pos_neg': {
    grade: '1',
    unitName: '正の数・負の数の計算',
    lessonTitle: '正負の数の加法と減法',
    badge: '中1数学 / 学習プリント 1-2 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中1数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/01_1年生/数学_1-2正の数・負の数の計算.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '正負の数のたし算とひき算の規則を理解し、符号に注意して正確に計算できる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・絶対値',
          content: '$+5$ の絶対値は $5$、$-5$ の絶対値も $5$（原点からの距離）。'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '$(-3) - (-5)$ はなぜ足し算にかえて計算できるのだろうか？数直線やカードの増減をもとに説明しよう。',
          guide: 'ヒント: 「$-5$ 点のカードを引く（取り除く）」と、点数は増えるかな？減るかな？',
          thinkingSpaceHeight: 90,
          answer: '負の数を引くことは、その分だけ元に戻る（プラスされる）こと。数直線で左に進むことの逆だから右に進む。$(-3) + (+5) = +2$'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '計算のルール',
          title: '正負の数の減法のまとめ',
          content: '正負の数のひき算は、<strong>ひく数の符号を変えて、たし算になおす</strong>！<br>例: $a - (-b) = a + (+b)$　/　$a - (+b) = a + (-b)$'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の計算をしなさい。<br>(1) $(+3) + (-8)$　　(2) $(-4) - (-9)$　　(3) $2 - 7$',
          answer: '(1) $-5$　　(2) $(-4)+(+9)=+5$　　(3) $-5$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g1_equation': {
    grade: '1',
    unitName: '一次方程式の解き方',
    lessonTitle: '等式の性質と方程式の解法（移項）',
    badge: '中1数学 / 学習プリント 3-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中1数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/01_1年生/数学_3-1方程式.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '等式の性質をもとに「移項」の仕組みを理解し、$x=a$ の形にして方程式を解くことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・天びんの関係',
          content: '等式の両辺に同じ数をたしても、同じ数をひいても、等式は成り立つ。'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '方程式 $3x - 5 = 7$ を解くとき、両辺に $+5$ をするとどのような式になるだろうか？「項の移動」に着目しよう。',
          guide: 'ヒント: $3x - 5 + 5 = 7 + 5$ とすると、左辺の $-5$ はどうなる？',
          thinkingSpaceHeight: 90,
          answer: '$3x = 7 + 5$ となり、左辺にあった $-5$ が符号を変えて $+5$ として右辺に移ったように見える。これが「移項」である。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '移項のルール',
          title: '方程式を解く基本ステップ',
          content: '① <strong>移項</strong>: $x$ の項を左辺へ、数の項を右辺へ符号を変えて移す。<br>② <strong>整理</strong>: $ax = b$ の形にまとめる。<br>③ <strong>割る</strong>: 両辺を $x$ の係数 $a$ で割り、$x = \\frac{b}{a}$ を求める。'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の方程式を解きなさい。<br>(1) $4x - 3 = 9$　　(2) $5x + 2 = 2x + 11$',
          answer: '(1) $4x = 12 \\rightarrow x = 3$　　(2) $3x = 9 \\rightarrow x = 3$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  }
};

let currentWorksheetPresetKey = 'g2_linear_graph';
let currentWorksheetGrade = '2';

// 単元プリセットから授業プリントを一括生成
function loadLessonPreset(presetKey, classInfo = null) {
  if (!presetKey || !lessonUnitPresets[presetKey]) {
    presetKey = 'g2_linear_graph';
  }
  currentPresetKey = presetKey;
  currentWorksheetPresetKey = presetKey;
  const preset = lessonUnitPresets[presetKey];
  currentWorksheetGrade = preset.grade;

  state.blocks = [];

  // タイトルとバッジの更新
  const titleEl = document.getElementById('paperTitle');
  if (titleEl) titleEl.textContent = preset.lessonTitle;

  const badgeEl = document.getElementById('paperGradeBadge');
  if (badgeEl) badgeEl.textContent = '第' + preset.grade + '学年 数学科 授業プリント';

  const footerCode = document.getElementById('footerLessonCode');
  if (footerCode) footerCode.textContent = 'M' + preset.grade + '-' + presetKey;

  // クラス情報の反映（時間割からジャンプしてきた場合など）
  if (classInfo) {
    const classCell = document.querySelector('.info-cell.class-cell');
    if (classCell) {
      classCell.innerHTML = classInfo + '組';
    }
  }

  // ブロックの追加
  preset.blocks.forEach(b => {
    let blockData = { ...b.data };
    if (b.type === 'graph-block' && !blockData.svgHtml) {
      blockData.svgHtml = generateLinearSvg(2, 1, true, true, 200, 200);
    } else if (b.type === 'geometry-block' && !blockData.svgHtml) {
      blockData.svgHtml = generateParallelChevronSvg(45, 35, 200, 150);
    }
    addBlock(b.type, blockData);
  });

  // UIのセレクトボックスの同期
  updatePresetDropdown();
  updatePresetReferenceButtons();

  showToast('<i class="fa-solid fa-wand-magic-sparkles text-primary"></i> 【' + preset.unitName + '】の板書授業プリントを展開しました');
}

// 授業例テンプレート読込（旧loadSampleSheetの進化版）
function loadSampleSheet() {
  loadBoardLessonPreset(currentB4Grade || '3', currentB4UnitId || 'u_3_1', currentB4Hour || 5);
}

// サイドバーの学年切り替え
function switchWorksheetGrade(grade) {
  currentWorksheetGrade = String(grade);
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('wsGradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentWorksheetGrade === g);
  });
  updatePresetDropdown();
}

// 単元セレクトボックスの動的更新
function updatePresetDropdown() {
  const select = document.getElementById('sheetGradeUnit');
  if (!select) return;

  const filteredKeys = Object.keys(lessonUnitPresets).filter(k => lessonUnitPresets[k].grade === currentWorksheetGrade);
  
  select.innerHTML = filteredKeys.map(k => {
    const p = lessonUnitPresets[k];
    const isSelected = k === currentWorksheetPresetKey ? 'selected' : '';
    return '<option value="' + k + '" ' + isSelected + '>【中' + p.grade + '】' + p.unitName + ' - ' + p.lessonTitle + '</option>';
  }).join('');

  if (!filteredKeys.includes(currentWorksheetPresetKey) && filteredKeys.length > 0) {
    currentWorksheetPresetKey = filteredKeys[0];
    select.value = currentWorksheetPresetKey;
  }

  updatePresetReferenceButtons();
}

function onGradeUnitChange() {
  const select = document.getElementById('sheetGradeUnit');
  if (select && select.value) {
    currentWorksheetPresetKey = select.value;
    updatePresetReferenceButtons();
  }
}

// 選択中の単元の板書PDFや要点PDFボタンの更新・開く
function updatePresetReferenceButtons() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  const btnBoard = document.getElementById('btnWsViewBoard');
  const btnPoint = document.getElementById('btnWsViewPoint');
  const btnOfficial = document.getElementById('btnWsViewOfficial');

  if (btnBoard) {
    btnBoard.style.display = (preset && preset.boardPdf) ? 'inline-flex' : 'none';
  }
  if (btnPoint) {
    btnPoint.style.display = (preset && preset.pointPdf) ? 'inline-flex' : 'none';
  }
  if (btnOfficial) {
    btnOfficial.style.display = (preset && preset.officialPdf) ? 'inline-flex' : 'none';
  }
}

function openPresetBoardPdf() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  if (preset && preset.boardPdf) {
    openPdfPreviewModal(encodeURIComponent(preset.boardPdf), '【中' + preset.grade + ' 板書＆展開例】' + preset.unitName);
  } else {
    showToast('この単元の板書書籍PDFは準備中です');
  }
}

function openPresetPointPdf() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  if (preset && preset.pointPdf) {
    openPdfPreviewModal(encodeURIComponent(preset.pointPdf), '【中' + preset.grade + ' 要点ブック】' + preset.unitName);
  }
}

function openPresetOfficialPdf() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  if (preset && preset.officialPdf) {
    openPdfPreviewModal(encodeURIComponent(preset.officialPdf), '【中' + preset.grade + ' 公式学習プリント】' + preset.unitName);
  }
}

// ==========================================
// 時間割 ➔ 授業プリント工房 への双方向連携
// ==========================================
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
    const a = randNonZero(-5, 5);
    const b = randInt(-8, 8);
    const x1 = randInt(-3, 1);
    const x2 = x1 + randInt(2, 4);
    const deltaY = a * (x2 - x1);
    const aTerm = formatTerm(a, 'x', true);
    const bStr = b !== 0 ? (b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`) : '';
    const aDisp = a < 0 ? `－${Math.abs(a)}` : `${a}`;
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
    const a = randNonZero(-3, 3);
    const x1 = randInt(1, 4);
    const b = randInt(-5, 5);
    const y1 = a * x1 + b;
    const aTerm = formatTerm(a, 'x', true);
    const bStr = b !== 0 ? (b > 0 ? `＋ ${b}` : `－ ${Math.abs(b)}`) : '';
    const aDisp = a < 0 ? `－${Math.abs(a)}` : `${a}`;
    return {
      q: `傾きが ${aDisp} で、点 (${x1}, ${y1}) を通る直線の式を求めなさい。`,
      ans: `y ＝ ${aTerm} ${bStr}`.trim(),
      steps: [
        `求める直線の式を y ＝ ${aTerm} ＋ b とおく`,
        `点 (${x1}, ${y1}) を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b → ${y1} ＝ ${a * x1} ＋ b`,
        `切片 b を解く: b ＝ ${b}`,
        `答: y ＝ ${aTerm} ${bStr}`.trim()
      ],
      exp: `求める式を y ＝ ${aTerm} ＋ b とおき、x＝${x1}, y＝${y1} を代入: ${y1} ＝ ${aDisp}×(${x1}) ＋ b より b ＝ ${b}`
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

// TeX記法への変換関数
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

  const majorId = majorSelect ? majorSelect.value : 'all';
  const subUnitId = subSelect ? subSelect.value : 'all_mix';
  const count = parseInt(countSelect?.value, 10) || 6;

  // カリキュラム情報からタイトル取得
  const gradeUnits = testCurriculum[grade] || [];
  const currentMajor = gradeUnits.find(m => m.id === majorId) || gradeUnits[0];
  const currentSub = currentMajor?.subUnits?.find(s => s.id === subUnitId) || { name: '練習テスト' };

  let subTitle = currentSub.name.replace(/【.*?】/, '').trim();
  const majorName = currentMajor ? currentMajor.name : '数学科';

  // タイトル行1: 「中学X年　大単元名」 行2: 「小単元名」
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

  // 問題ジェネレーターの選定
  const availableGenKeys = getGeneratorsForSubUnit(grade, subUnitId);
  const questions = [];

  for (let i = 0; i < count; i++) {
    const key = availableGenKeys[i % availableGenKeys.length];
    const genFn = problemGenerators[key] || problemGenerators['g1_pos_neg_add_sub'];
    const item = genFn();
    questions.push({
      num: i + 1,
      q: formatMathRich(item.q),
      ans: formatMathRich(item.ans),
      steps: item.steps ? item.steps.map(s => formatMathRich(s)) : [],
      exp: item.exp ? formatMathRich(item.exp) : ''
    });
  }

  // 1列か2列かの判定:
  // 4問・5問・6問は1列 (cols-1) にして横幅を贅沢に活用。問題文がゆったり収まり、右下に解答欄、十分な計算余白を確保！
  // 7問・8問・9問・10問は2列 (cols-2) にしてA4用紙1枚にバランスよく収容
  const gridClass = count > 6 ? 'test-problem-grid cols-2' : 'test-problem-grid cols-1';

  // タイトルの文字数に応じた文字サイズ自動調整（長い単元名でも改行を完全防止）
  const titleClass = titleLine2.length > 13 ? ' title-mini' : (titleLine2.length > 8 ? ' title-compact' : '');

  // タイトル内の数式（y = ax², a√b 等）も教科書品質 KaTeX TeX組版を適用！
  const formattedTitleLine1 = formatMathRich(titleLine1);
  const formattedTitleLine2 = formatMathRich(titleLine2);

  // 1. 生徒用プリント用紙のHTML構築（1行目: 大単元全幅、2行目: 左小単元・右生徒情報）
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

  // 2. 先生用模範解答用紙のHTML構築（1行目: 大単元全幅、2行目: 【模範解答】小単元）
  const answerEl = document.getElementById('testAnswerPaper');
  if (answerEl) {
    answerEl.setAttribute('data-count', count);
    answerEl.innerHTML = `
      <div class="test-paper-header answer-header">
        <div class="test-header-line1 answer-line1">${formattedTitleLine1}</div>
        <div class="test-header-line2">
          <div class="test-title-line2 answer-line2${titleClass}">【模範解答】${formattedTitleLine2}</div>
        </div>
      </div>

      <div class="${gridClass}">
        ${questions.map(q => `
          <div class="test-problem-item answer-mode">
            <div class="problem-header">
              <span class="problem-num answer-num">(${q.num})</span>
              <div class="problem-text">${q.q}</div>
            </div>
            <div class="problem-answer-line" style="margin-top: 4px;">
              <span class="answer-badge-label">【正答】</span>
              <span class="problem-answer-fill red-fill">${q.ans}</span>
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
        `).join('')}
      </div>
    `;
    applyKaTeXIfAvailable(answerEl);
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

// KaTeX の確実な描画フック (ページロード完了時)
window.addEventListener('load', () => {
  if (typeof window.katex !== 'undefined' && document.getElementById('testStudentPaper')) {
    generateQuickTest();
  }
  if (document.getElementById('officialCardsGrid')) {
    renderOfficialPrintLibrary();
  }
});

// ========================================================
// 公式数学学習プリント & 書籍教材ライブラリ
// ========================================================
const officialPrintLibrary = {
  '1': [
    { id: 'g1_p1_1', unit: '1-1', title: '正の数・負の数', file: '数学学習プリント/01_1年生/数学_1-1正の数・負の数.pdf', category: '正負の数' },
    { id: 'g1_p1_2', unit: '1-2', title: '正の数・負の数の計算', file: '数学学習プリント/01_1年生/数学_1-2正の数・負の数の計算.pdf', category: '正負の数' },
    { id: 'g1_p1_3', unit: '1-3', title: '正の数・負の数の利用 (文章題)', file: '数学学習プリント/01_1年生/数学_1-3正の数・負の数の利用.pdf', category: '正負の数' },
    { id: 'g1_p2_1', unit: '2-1', title: '文字を使った式', file: '数学学習プリント/01_1年生/数学_2-1文字を使った式.pdf', category: '文字と式' },
    { id: 'g1_p2_2', unit: '2-2', title: '文字式の計算', file: '数学学習プリント/01_1年生/数学_2-2文字式の計算.pdf', category: '文字と式' },
    { id: 'g1_p3_1', unit: '3-1', title: '方程式の解き方', file: '数学学習プリント/01_1年生/数学_3-1方程式.pdf', category: '方程式' },
    { id: 'g1_p3_2', unit: '3-2', title: '方程式の利用 (文章題)', file: '数学学習プリント/01_1年生/数学_3-2方程式の利用.pdf', category: '方程式' },
    { id: 'g1_p4_1', unit: '4-1', title: '関数と座標', file: '数学学習プリント/01_1年生/数学_4-1関数.pdf', category: '比例・反比例' },
    { id: 'g1_p4_2', unit: '4-2', title: '比例の式とグラフ', file: '数学学習プリント/01_1年生/数学_4-2比例.pdf', category: '比例・反比例' },
    { id: 'g1_p4_3', unit: '4-3', title: '反比例の式とグラフ', file: '数学学習プリント/01_1年生/数学_4-3反比例.pdf', category: '比例・反比例' },
    { id: 'g1_p4_4', unit: '4-4', title: '比例・反比例の利用', file: '数学学習プリント/01_1年生/数学_4-4比例，反比例の利用.pdf', category: '比例・反比例' },
    { id: 'g1_p5_1', unit: '5-1', title: '直線と図形 (垂直・平行・距離)', file: '数学学習プリント/01_1年生/数学_5-1直線と図形.pdf', category: '平面図形' },
    { id: 'g1_p5_2', unit: '5-2', title: '図形の移動と作図', file: '数学学習プリント/01_1年生/数学_5-2移動と作図.pdf', category: '平面図形' },
    { id: 'g1_p5_3', unit: '5-3', title: '円とおうぎ形 (弧と面積)', file: '数学学習プリント/01_1年生/数学_5-3円とおうぎ形.pdf', category: '平面図形' },
    { id: 'g1_p6_1', unit: '6-1', title: '立体と空間図形 (位置関係・展開図)', file: '数学学習プリント/01_1年生/数学_6-1立体と空間図形.pdf', category: '空間図形' },
    { id: 'g1_p6_2', unit: '6-2', title: '立体の体積と表面積', file: '数学学習プリント/01_1年生/数学_6-2立体の体積と表面積.pdf', category: '空間図形' },
    { id: 'g1_p7_1', unit: '7-1', title: 'ヒストグラムと相対度数', file: '数学学習プリント/01_1年生/数学_7-1ヒストグラムと相対度数.pdf', category: 'データの活用' },
    { id: 'g1_p7_2', unit: '7-2', title: 'データにもとづく確率', file: '数学学習プリント/01_1年生/数学_7-2データにもとづく確率.pdf', category: 'データの活用' },
    { id: 'g1_p8_1', unit: '学年総復習', title: '1年生 数学まとめテスト', file: '数学学習プリント/01_1年生/数学_8まとめ（1年生）.pdf', category: '学年まとめ', isSummary: true }
  ],
  '2': [
    { id: 'g2_p1_1', unit: '1-1', title: '式の計算 (加法・減法・乗除)', file: '数学学習プリント/02_2年生/数学_1-1式の計算.pdf', category: '式の計算' },
    { id: 'g2_p1_2', unit: '1-2', title: '文字式の利用 (説明・等式変形)', file: '数学学習プリント/02_2年生/数学_1-2文字式の利用.pdf', category: '式の計算' },
    { id: 'g2_p2_1', unit: '2-1', title: '連立方程式の解き方', file: '数学学習プリント/02_2年生/数学_2-1連立方程式.pdf', category: '連立方程式' },
    { id: 'g2_p2_2', unit: '2-2', title: '連立方程式の利用 (文章題)', file: '数学学習プリント/02_2年生/数学_2-2連立方程式の利用.pdf', category: '連立方程式' },
    { id: 'g2_p3_1', unit: '3-1', title: '一次関数とグラフ', file: '数学学習プリント/02_2年生/数学_3-1一次関数とグラフ.pdf', category: '一次関数' },
    { id: 'g2_p3_2', unit: '3-2', title: '一次関数と方程式 (交点座標)', file: '数学学習プリント/02_2年生/数学_3-2一次関数と方程式.pdf', category: '一次関数' },
    { id: 'g2_p3_3', unit: '3-3', title: '一次関数の利用 (動点・水そう)', file: '数学学習プリント/02_2年生/数学_3-3一次関数の利用.pdf', category: '一次関数' },
    { id: 'g2_p4_1', unit: '4-1', title: '平行線と角・多角形の角・合同条件', file: '数学学習プリント/02_2年生/数学_4-1平行と合同.pdf', category: '平行と合同' },
    { id: 'g2_p4_2', unit: '4-2', title: '合同の証明問題', file: '数学学習プリント/02_2年生/数学_4-2証明.pdf', category: '平行と合同' },
    { id: 'g2_p5_1', unit: '5-1', title: '二等辺三角形・直角三角形', file: '数学学習プリント/02_2年生/数学_5-1三角形.pdf', category: '三角形と四角形' },
    { id: 'g2_p5_2', unit: '5-2', title: '平行四辺形と特別な四角形', file: '数学学習プリント/02_2年生/数学_5-2四角形.pdf', category: '三角形と四角形' },
    { id: 'g2_p6_1', unit: '6-1', title: '場合の数と確率', file: '数学学習プリント/02_2年生/数学_6-1場合の数と確率.pdf', category: '確率' },
    { id: 'g2_p7_1', unit: '7-1', title: '四分位数と箱ひげ図', file: '数学学習プリント/02_2年生/数学_7-1箱ひげ図.pdf', category: 'データの比較' },
    { id: 'g2_p8_1', unit: '学年総復習', title: '2年生 数学まとめテスト', file: '数学学習プリント/02_2年生/数学_8まとめ（2年生）.pdf', category: '学年まとめ', isSummary: true }
  ],
  '3': []
};

const referenceBookLibrary = {
  '1': {
    title: '中1数学をひとつひとつわかりやすく。',
    file: CLOUD_DOC_LINKS.pointBooks['1'],
    badge: '学研 / 中1要点解説',
    desc: '中1の全単元をスモールステップで図解。授業前の要点確認やプロジェクター提示に最適。'
  },
  '2': {
    title: '中2数学をひとつひとつわかりやすく。',
    file: CLOUD_DOC_LINKS.pointBooks['2'],
    badge: '学研 / 中2要点解説',
    desc: '中2の連立方程式・一次関数・証明などを超基礎から図解。つまずきポイントの確認に。'
  },
  '3': {
    title: '中3数学をひとつひとつわかりやすく。',
    file: CLOUD_DOC_LINKS.pointBooks['3'],
    badge: '学研 / 中3要点解説',
    desc: '中3の展開・因数分解・平方根・二次方程式・相似・三平方の定理などを丁寧に解説。'
  }
};

// 板書・展開例ライブラリ データ（明治図書『板書＆展開例でよくわかる 365日の全授業』シリーズ）
const boardingLibrary = {
  books: [
    {
      id: 'board_3_1',
      grade: '3',
      volume: '3年上巻',
      title: '板書＆展開例でよくわかる 中学校数学 3年上',
      fullTitle: '板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上',
      publisher: '明治図書',
      badge: '明治図書 / 板書＆展開例',
      color: '#0284c7',
      file: CLOUD_DOC_LINKS.boardBooks['3'],
      desc: '3年前期の全単元を収録。見開きで各1時間の板書計画・発問・生徒のつまずきへの指導展開例をそのまま参照できます。',
      units: ['第1章 多項式・展開と因数分解', '第2章 平方根と無理数', '第3章 2次方程式と解の公式'],
      available: true
    },
    {
      id: 'board_3_2',
      grade: '3',
      volume: '3年下巻',
      title: '中学校数学 3年下巻（関数y=ax², 相似, 円, 三平方, 標本調査）',
      fullTitle: '中学校数学 3年下巻（板書＆展開例でよくわかる 365日の全授業）',
      publisher: '明治図書',
      badge: '明治図書 / 今後追加予定',
      color: '#0369a1',
      file: '',
      desc: '3年後期の単元（関数y=ax²、図形の相似、円周角の定理、三平方の定理、標本調査）の板書展開例。フォルダにPDFを追加すると閲覧可能になります。',
      units: ['第4章 関数 y=ax²', '第5章 相似な図形', '第6章 円の性質', '第7章 三平方の定理', '第8章 標本調査'],
      available: false
    },
    {
      id: 'board_2_1',
      grade: '2',
      volume: '2年巻',
      title: '中学校数学 2年（式と計算, 連立方程式, 1次関数, 図形の性質・合同, 確率）',
      fullTitle: '中学校数学 2年（板書＆展開例でよくわかる 365日の全授業）',
      publisher: '明治図書',
      badge: '明治図書 / 今後追加予定',
      color: '#059669',
      file: '',
      desc: '中2の全単元（式の計算、連立方程式、一次関数、平行と合同、三角形・四角形、確率）の板書展開例。フォルダにPDFを追加すると閲覧可能になります。',
      units: ['第1章 式の計算', '第2章 連立方程式', '第3章 1次関数', '第4章 平行と合同', '第5章 三角形と四角形', '第6章 確率・データの活用'],
      available: false
    },
    {
      id: 'board_1_1',
      grade: '1',
      volume: '1年巻',
      title: '中学校数学 1年（正負の数, 文字と式, 方程式, 比例と反比例, 平面・空間図形）',
      fullTitle: '中学校数学 1年（板書＆展開例でよくわかる 365日の全授業）',
      publisher: '明治図書',
      badge: '明治図書 / 今後追加予定',
      color: '#d97706',
      file: '',
      desc: '中1の全単元（正負の数、文字式、一次方程式、比例・反比例、平面・空間図形、データの分析）の板書展開例。フォルダにPDFを追加すると閲覧可能になります。',
      units: ['第1章 正の数・負の数', '第2章 文字と式', '第3章 1次方程式', '第4章 比例と反比例', '第5章 平面図形', '第6章 空間図形', '第7章 データの活用'],
      available: false
    }
  ]
};

let currentBoardGrade = 'all';
let currentBoardSearch = '';

let currentLibraryGrade = '1';
let currentLibrarySearch = '';
let currentPreviewPdfPath = '';

// モード切替: 小テスト自動生成 ⇔ 公式プリントライブラリ ⇔ 板書・展開例ライブラリ
function switchTestViewMode(mode) {
  const btnAuto = document.getElementById('btnModeAutoTest');
  const btnOff = document.getElementById('btnModeOfficialPrint');
  const btnBoard = document.getElementById('btnModeBoarding');

  const autoArea = document.getElementById('autoTestArea');
  const offArea = document.getElementById('officialPrintsArea');
  const boardArea = document.getElementById('boardingLibraryArea');

  // 全ボタンのactive解除
  btnAuto?.classList.remove('active');
  btnOff?.classList.remove('active');
  btnBoard?.classList.remove('active');

  // 全エリアを隠す
  autoArea?.classList.add('hidden');
  offArea?.classList.add('hidden');
  boardArea?.classList.add('hidden');

  if (mode === 'auto') {
    btnAuto?.classList.add('active');
    autoArea?.classList.remove('hidden');
  } else if (mode === 'official') {
    btnOff?.classList.add('active');
    offArea?.classList.remove('hidden');
    renderOfficialPrintLibrary();
  } else if (mode === 'boarding') {
    btnBoard?.classList.add('active');
    boardArea?.classList.remove('hidden');
    renderBoardingLibrary();
  }
}

// ライブラリ学年切替
function switchLibraryGrade(grade) {
  currentLibraryGrade = grade;
  for (let g = 1; g <= 3; g++) {
    const btn = document.getElementById(`libGradeBtn${g}`);
    if (btn) {
      if (String(g) === String(grade)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  }
  renderOfficialPrintLibrary();
}

// 検索フィルター
function filterOfficialPrints() {
  const input = document.getElementById('librarySearchInput');
  currentLibrarySearch = input ? input.value.trim().toLowerCase() : '';
  renderOfficialPrintLibrary();
}

// ライブラリ描画
function renderOfficialPrintLibrary() {
  const bannerEl = document.getElementById('referenceBookBanner');
  const gridEl = document.getElementById('officialCardsGrid');
  if (!gridEl) return;

  // 1. 書籍バナー描画
  const book = referenceBookLibrary[currentLibraryGrade];
  if (bannerEl && book) {
    bannerEl.innerHTML = `
      <div class="book-banner-left">
        <div class="book-icon-wrap">
          <i class="fa-solid fa-book-bookmark"></i>
        </div>
        <div class="book-info">
          <h4>${book.title} <span class="book-badge">${book.badge}</span></h4>
          <p>${book.desc}</p>
        </div>
      </div>
      <button class="book-open-btn" onclick="openPdfInNewTab('${encodeURIComponent(book.file)}')">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 要点ブックを開く
      </button>
    `;
    bannerEl.style.display = 'flex';
  } else if (bannerEl) {
    bannerEl.style.display = 'none';
  }

  // 2. 単元別プリントカード描画
  const prints = officialPrintLibrary[currentLibraryGrade] || [];
  let filtered = prints;

  if (currentLibrarySearch) {
    filtered = prints.filter(p => 
      p.title.toLowerCase().includes(currentLibrarySearch) ||
      p.unit.toLowerCase().includes(currentLibrarySearch) ||
      p.category.toLowerCase().includes(currentLibrarySearch)
    );
  }

  if (filtered.length === 0) {
    if (currentLibraryGrade === '3') {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem 1.5rem; text-align: center; color: var(--text-muted); background: var(--bg-panel); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
          <i class="fa-solid fa-folder-open" style="font-size: 2.2rem; margin-bottom: 0.8rem; color: #94a3b8; display: block;"></i>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem;">3年生の学習プリントは準備中です</h4>
          <p style="font-size: 0.85rem; margin: 0;">上部の「要点ブックを開く」から、3年生の全単元解説・要点PDFをご活用いただけます。</p>
        </div>
      `;
    } else {
      gridEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-muted);">
          一致する単元プリントが見つかりませんでした。「${currentLibrarySearch}」
        </div>
      `;
    }
    return;
  }

  gridEl.innerHTML = filtered.map(p => {
    const summaryClass = p.isSummary ? ' featured-summary' : '';
    const unitTagClass = p.isSummary ? 'unit-tag summary-tag' : 'unit-tag';
    const encFile = encodeURIComponent(p.file);
    return `
      <div class="official-print-card${summaryClass}">
        <div class="card-top-row">
          <span class="${unitTagClass}">${p.unit}</span>
          <span class="category-tag">${p.category}</span>
        </div>
        <h4 class="print-card-title">${p.title}</h4>
        <div class="print-card-actions">
          <button class="btn btn-outline" onclick="openPdfPreviewModal('${encFile}', '${p.unit} ${p.title}')">
            <i class="fa-solid fa-eye"></i> プレビュー
          </button>
          <button class="btn btn-primary" onclick="openPdfInNewTab('${encFile}')">
            <i class="fa-solid fa-print"></i> 印刷 / 開く
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// PDFプレビューモーダル操作
function openPdfPreviewModal(encodedPath, title) {
  const modal = document.getElementById('pdfPreviewModal');
  const iframe = document.getElementById('pdfPreviewIframe');
  const titleEl = document.getElementById('pdfModalTitle');
  const downloadLink = document.getElementById('pdfDownloadLink');

  currentPreviewPdfPath = decodeURIComponent(encodedPath);

  if (titleEl) titleEl.textContent = title || 'プリントプレビュー';
  if (iframe) iframe.src = currentPreviewPdfPath;
  if (downloadLink) {
    downloadLink.href = currentPreviewPdfPath;
    downloadLink.setAttribute('download', currentPreviewPdfPath.split('/').pop());
  }

  modal?.classList.remove('hidden');
}

function closePdfPreviewModal() {
  const modal = document.getElementById('pdfPreviewModal');
  const iframe = document.getElementById('pdfPreviewIframe');
  if (iframe) iframe.src = '';
  modal?.classList.add('hidden');
}

function openCurrentPdfNewTab() {
  if (currentPreviewPdfPath) {
    window.open(currentPreviewPdfPath, '_blank');
  }
}

function openPdfInNewTab(encodedPath) {
  const path = decodeURIComponent(encodedPath);
  window.open(path, '_blank');
}

// 時間割スロットから該当学年の公式プリントライブラリへジャンプ
function jumpToOfficialPrintsFromSlot() {
  let className = state.editingLessonPlan ? (state.editingLessonPlan.className || '') : '';
  let grade = extractGradeFromClassName(className);
  const input = document.getElementById('lessonPlanInput');
  const planKeyword = input ? input.value : '';

  closeLessonPlanModal();
  switchTab('practice-test');
  switchTestViewMode('official');
  switchLibraryGrade(grade);

  if (planKeyword) {
    const searchInput = document.getElementById('librarySearchInput');
    if (searchInput) {
      if (planKeyword.includes('一次関数') || planKeyword.includes('1次関数')) searchInput.value = '一次関数';
      else if (planKeyword.includes('連立')) searchInput.value = '連立';
      else if (planKeyword.includes('方程式')) searchInput.value = '方程式';
      else if (planKeyword.includes('証明') || planKeyword.includes('合同')) searchInput.value = '合同';
      else if (planKeyword.includes('比例')) searchInput.value = '比例';
      else if (planKeyword.includes('文字')) searchInput.value = '文字';
      else if (planKeyword.includes('正負') || planKeyword.includes('正の数')) searchInput.value = '正の数';
      filterOfficialPrints();
    }
  }
}

// 時間割スロットから板書・展開例ライブラリへジャンプ
function jumpToBoardingPrintsFromSlot() {
  let className = state.editingLessonPlan ? (state.editingLessonPlan.className || '') : '';
  let grade = extractGradeFromClassName(className);
  const input = document.getElementById('lessonPlanInput');
  const planKeyword = input ? input.value : '';

  closeLessonPlanModal();
  switchTab('practice-test');
  switchTestViewMode('boarding');
  switchBoardGrade(grade);

  if (planKeyword) {
    const searchInput = document.getElementById('boardingSearchInput');
    if (searchInput) {
      if (planKeyword.includes('展開') || planKeyword.includes('因数分解')) searchInput.value = '因数分解';
      else if (planKeyword.includes('平方根') || planKeyword.includes('ルート')) searchInput.value = '平方根';
      else if (planKeyword.includes('方程式') || planKeyword.includes('2次方程式')) searchInput.value = '2次方程式';
      else if (planKeyword.includes('関数')) searchInput.value = '関数';
      else if (planKeyword.includes('図形') || planKeyword.includes('証明')) searchInput.value = '図形';
      filterBoardingLibrary();
    }
  }
}

// ========================================================
// 板書・展開例ライブラリ 描画
// ========================================================
function renderBoardingLibrary() {
  const containerEl = document.getElementById('boardingLibraryCards');
  if (!containerEl) return;

  const searchEl = document.getElementById('boardingSearchInput');
  const keyword = searchEl ? searchEl.value.trim().toLowerCase() : '';

  let filtered = boardingLibrary.books;

  if (currentBoardGrade !== 'all') {
    filtered = filtered.filter(b => b.grade === currentBoardGrade);
  }
  if (keyword) {
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(keyword) ||
      b.fullTitle.toLowerCase().includes(keyword) ||
      b.desc.toLowerCase().includes(keyword) ||
      b.units.some(u => u.toLowerCase().includes(keyword))
    );
  }

  // 学年ピルボタンのアクティブ更新
  ['all', '1', '2', '3'].forEach(g => {
    const btn = document.getElementById('boardGradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentBoardGrade === g);
  });

  if (filtered.length === 0) {
    containerEl.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size:2.5rem;margin-bottom:1rem;display:block;color:#cbd5e1;"></i>
        <h4>該当する板書・展開例データが見つかりませんでした</h4>
        <p style="font-size:0.85rem;margin-top:0.5rem;">検索キーワードを変更するか、「すべて」の学年を選択してください。</p>
      </div>
    `;
    return;
  }

  containerEl.innerHTML = filtered.map(book => {
    const encFile = encodeURIComponent(book.file);
    const gradeLabel = book.grade === '1' ? '中1' : book.grade === '2' ? '中2' : '中3';
    const unitTags = book.units.map(u => `<span class="boarding-unit-tag">${u}</span>`).join('');
    
    let actionButtonsHtml = '';
    if (book.available) {
      actionButtonsHtml = `
        <button class="btn btn-outline" onclick="openPdfPreviewModal('${encFile}', '${book.volume} 板書・展開例')">
          <i class="fa-solid fa-eye"></i> プレビュー
        </button>
        <button class="btn btn-primary" onclick="openPdfInNewTab('${encFile}')">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> 開く / 印刷
        </button>
      `;
    } else {
      actionButtonsHtml = `
        <button class="btn btn-outline" disabled style="opacity: 0.6; cursor: not-allowed; width: 100%;">
          <i class="fa-solid fa-clock"></i> 今後データ追加で利用可能
        </button>
      `;
    }

    return `
      <div class="boarding-book-card ${book.available ? '' : 'is-upcoming'}">
        <div class="boarding-card-header" style="border-top: 4px solid ${book.color};">
          <div class="boarding-card-meta-row">
            <span class="boarding-grade-badge" style="background:${book.color}18;color:${book.color};border:1px solid ${book.color}35;">
              ${gradeLabel} ${book.volume}
            </span>
            <span class="boarding-publisher-badge">${book.badge}</span>
          </div>
          <div class="boarding-card-icon" style="background:${book.color}15;">
            <i class="fa-solid fa-chalkboard-user" style="color:${book.color};"></i>
          </div>
        </div>
        <div class="boarding-card-body">
          <h4 class="boarding-book-title">${book.title}</h4>
          <p class="boarding-book-desc">${book.desc}</p>
          <div class="boarding-units-row">
            <span class="boarding-units-label"><i class="fa-solid fa-list-ul"></i> 収録単元:</span>
            <div class="boarding-unit-tags">${unitTags}</div>
          </div>
        </div>
        <div class="boarding-card-actions">
          ${actionButtonsHtml}
        </div>
      </div>
    `;
  }).join('');
}

function switchBoardGrade(grade) {
  currentBoardGrade = grade;
  renderBoardingLibrary();
}

function filterBoardingLibrary() {
  renderBoardingLibrary();
}

// ========================================================
// サーバー環境チェック（GitHub Pages等で開かれた時の親切バナー）
// ========================================================
function checkServerEnvironment() {
  const host = window.location.hostname;
  const port = window.location.port;
  const isLocalServer = (host === 'localhost' || host === '127.0.0.1') && port === '3000';
  const isGitHubPages = host.includes('github.io');

  if (isGitHubPages) {
    const banner = document.createElement('div');
    banner.id = 'serverEnvironmentBanner';
    banner.style.cssText = 'background: linear-gradient(90deg, #1e293b, #0f172a); color: #f8fafc; padding: 0.65rem 1.25rem; font-size: 0.84rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #38bdf8; z-index: 1000; position: relative;';
    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
        <span style="background:#0284c7;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">
          <i class="fa-solid fa-circle-info"></i> PDF利用ガイド
        </span>
        <span>公式学習プリントや板書書籍のPDF閲覧・印刷は、パソコン内のローカルサーバー（<strong>http://localhost:3000</strong>）での実行を推奨しています。</span>
      </div>
      <button onclick="document.getElementById('serverEnvironmentBanner').remove()" style="background:transparent;border:none;color:#94a3b8;cursor:pointer;font-size:1.1rem;padding:0 0.5rem;" title="閉じる">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    document.body.insertBefore(banner, document.body.firstChild);
  }
}

// ページ読み込み時に環境チェックを実行
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(checkServerEnvironment, 500);
});



// ========================================================

// ========================================================
// 教材・書籍 OneDrive クラウド共有リンク設定（オンライン完全対応）
// 先生のOneDrive共有URLにより、Webブラウザ上からどこでも直接PDFを参照可能
// ========================================================
const CLOUD_DOC_LINKS = {
  // 学研『中1〜中3 数学をひとつひとつわかりやすく。』
  pointBooks: {
    '1': 'https://1drv.ms/b/c/7afb9670452d4dba/IQC4gcHZTgFoRoBOL7FbI00uAYAo4hpgqWuZtjHhb4r7J_0?e=Ak1hV9',
    '2': 'https://1drv.ms/b/c/7afb9670452d4dba/IQCGShIQnCM6Ro_fEPW9OmVhAUe0_xiCbUTJC7fY-2_AnUI?e=XJU1aJ',
    '3': 'https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx'
  },
  // 明治図書『板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学』
  boardBooks: {
    '3': 'https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY'
  },
  // 数学学習プリント (全学年・全単元 OneDrive共有フォルダ)
  officialPrintsFolder: 'https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F'
};

// 中学数学科 板書＆展開例 授業データベース（B4横見開きプリント完全対応）
// 明治図書『板書＆展開例でよくわかる 365日の全授業』シリーズ準拠
// ========================================================
const boardLessonDatabase = {
  '3': {
    gradeLabel: '第3学年',
    units: [
      {
        id: 'u_3_1',
        unitName: '第1章 多項式・展開と因数分解',
        totalHours: 11,
        bookRef: CLOUD_DOC_LINKS.boardBooks['3'],
        pointRef: CLOUD_DOC_LINKS.pointBooks['3'],
        lessons: [
          {
            hour: 1,
            title: '多項式と単項式の乗法・除法',
            leftBlocks: [
              { type: 'objective', data: { text: '分配法則を利用して、多項式と単項式の乗法・除法を計算できる。' } },
              { type: 'review', data: { title: '1・2年の復習', content: '分配法則: $a(b+c) = ab + ac$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '長方形の面積をもとに、多項式 $2x(x + 3y)$ の展開方法を考えよう。', guide: 'たてが $2x$、横が $x+3y$ の長方形を2つに分けてみよう。', thinkingSpaceHeight: 90, answer: '$2x(x) + 2x(3y) = 2x^2 + 6xy$' } },
              { type: 'point-box', data: { badge: '板書まとめ', title: '多項式と単項式の計算', content: '多項式に単項式をかけるときは、カッコの中の <strong>すべての項に単項式をかける</strong>（分配法則）。' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の計算をしなさい。<br>(1) $3a(2a - b)$<br>(2) $(4x^2 - 6xy) \\div 2x$', answer: '(1) $6a^2 - 3ab$<br>(2) $2x - 3y$', spaceHeight: 65 } },
              { type: 'question', data: { qNum: '問 2 (発展)', text: '次の式を展開して整理しなさい。<br>$x(x + 2) + 2x(x - 3)$', answer: '$x^2 + 2x + 2x^2 - 6x = 3x^2 - 4x$', spaceHeight: 60 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          },
          {
            hour: 2,
            title: '多項式どうしの乗法 (a+b)(c+d)',
            leftBlocks: [
              { type: 'objective', data: { text: '多項式どうしの積 $(a+b)(c+d)$ を、面積図や文字の置き換えを用いて展開できる。' } },
              { type: 'review', data: { title: '前時のふりかえり', content: '$M(c+d) = Mc + Md$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: 'たて $a+b$、横 $c+d$ の長方形の面積は、どのように表せるだろうか？', guide: '4つの小さな長方形の面積の和として表してみよう。', thinkingSpaceHeight: 90, answer: '$(a+b)(c+d) = ac + ad + bc + bd$' } },
              { type: 'point-box', data: { badge: '板書まとめ', title: '多項式の展開の基本', content: '$(a+b)(c+d) = ac + ad + bc + bd$<br>一方のカッコの各項に、他方の各項をもれなくかけて同類項をまとめる！' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の式を展開しなさい。<br>(1) $(x + 2)(y + 3)$<br>(2) $(2x - 1)(x + 4)$', answer: '(1) $xy + 3x + 2y + 6$<br>(2) $2x^2 + 7x - 4$', spaceHeight: 65 } },
              { type: 'question', data: { qNum: '問 2', text: '$(a - 3)(b - 2)$ を展開しなさい。符号に注意！', answer: '$ab - 2a - 3b + 6$', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          },
          {
            hour: 3,
            title: '乗法公式① (x+a)(x+b)',
            leftBlocks: [
              { type: 'objective', data: { text: '公式 $(x+a)(x+b) = x^2 + (a+b)x + ab$ を理解し、素早く展開できる。' } },
              { type: 'review', data: { title: '前時の確認', content: '$(x+2)(x+3) = x^2 + 3x + 2x + 6 = x^2 + 5x + 6$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '$(x+a)(x+b)$ を展開したとき、$x$ の係数と数の項にはどのようなきまりがあるだろうか？', guide: '$5 = 2+3$、$6 = 2 \\times 3$。たし算とかけ算の関係に注目！', thinkingSpaceHeight: 85, answer: '$x$ の係数は「和 $a+b$」、最後の項は「積 $ab$」になる。' } },
              { type: 'point-box', data: { badge: '重要公式①', title: '乗法公式 1 (和と積の公式)', content: '<strong>$(x + a)(x + b) = x^2 + (a + b)x + ab$</strong><br>真ん中は「たして」、最後は「かけて」！' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1 (基本演習)', text: '公式を使って次の式を展開しなさい。<br>(1) $(x + 3)(x + 4)$<br>(2) $(x - 5)(x + 2)$<br>(3) $(x - 3)(x - 7)$', answer: '(1) $x^2 + 7x + 12$<br>(2) $x^2 - 3x - 10$<br>(3) $x^2 - 10x + 21$', spaceHeight: 80 } },
              { type: 'question', data: { qNum: '問 2 (符号注意)', text: '$(a + 6)(a - 4)$ を計算しなさい。', answer: '$a^2 + 2a - 24$', spaceHeight: 45 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          },
          {
            hour: 4,
            title: '乗法公式②③ 平方の公式・和と差の積',
            leftBlocks: [
              { type: 'objective', data: { text: '平方の公式 $(a \\pm b)^2$ および和と差の積 $(a+b)(a-b)$ を理解し活用できる。' } },
              { type: 'review', data: { title: '前時のふりかえり', content: '$(x+3)(x+3) = x^2 + 6x + 9$　/　$(x+3)(x-3) = x^2 - 9$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '正方形の面積をもとに、$(a+b)^2$ の展開公式を導こう。真ん中の項はどうなる？', guide: 'たて $a+b$、横 $a+b$ の正方形は、4つのパーツに分かれるね。', thinkingSpaceHeight: 85, answer: '$(a+b)^2 = a^2 + 2ab + b^2$。長方形が2つあるので $2ab$ になる。' } },
              { type: 'point-box', data: { badge: '重要公式②③', title: '平方の公式 & 和と差の積', content: '② <strong>$(a + b)^2 = a^2 + 2ab + b^2$</strong><br>③ <strong>$(a - b)^2 = a^2 - 2ab + b^2$</strong><br>④ <strong>$(a + b)(a - b) = a^2 - b^2$</strong>' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '公式を使って展開しなさい。<br>(1) $(x + 5)^2$<br>(2) $(x - 4)^2$<br>(3) $(x + 7)(x - 7)$', answer: '(1) $x^2 + 10x + 25$<br>(2) $x^2 - 8x + 16$<br>(3) $x^2 - 49$', spaceHeight: 80 } },
              { type: 'question', data: { qNum: '問 2 (ミス防止)', text: '$(2x + 3)^2$ を展開しなさい。先頭の項は $(2x)^2$ だよ！', answer: '$4x^2 + 12x + 9$', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          },
          {
            hour: 5,
            title: '式の展開の工夫（置き換えの利用）',
            leftBlocks: [
              { type: 'objective', data: { text: '共通な部分に着目して文字におきかえ、乗法公式を使って工夫して展開できる。' } },
              { type: 'review', data: { title: '前時の公式確認', content: '$(M+2)(M-5) = M^2 - 3M - 10$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '式 $(a+b+2)(a+b-5)$ を展開するにはどうすればよいだろうか？共通な部分を見つけて工夫しよう。', guide: '着眼点: $a+b$ がどちらのカッコにもあるね。1つのまとまり $M$ とおいてみよう。', thinkingSpaceHeight: 90, answer: '$a+b=M$ とおくと、$(M+2)(M-5) = M^2 - 3M - 10$。元に戻して $(a+b)^2 - 3(a+b) - 10 = a^2 + 2ab + b^2 - 3a - 3b - 10$' } },
              { type: 'point-box', data: { badge: '板書まとめ', title: '置き換えによる工夫のポイント', content: '式の中に同じまとまりがあるときは、それを <strong>1つの文字 $M$</strong> とおくことで、知っている乗法公式にあてはめて簡単に展開できる！' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1 (確かめ)', text: '置き換えを利用して展開しなさい。<br>$(x + y + 3)(x + y - 3)$', answer: '$x+y=M$ とおくと $(M+3)(M-3) = M^2 - 9 = (x+y)^2 - 9 = x^2 + 2xy + y^2 - 9$', spaceHeight: 65 } },
              { type: 'question', data: { qNum: '問 2 (発展に挑戦)', text: '$(a - b + 2)^2$ を展開しなさい。', answer: '$a-b=M$ とおくと $(M+2)^2 = M^2 + 4M + 4 = a^2 - 2ab + b^2 + 4a - 4b + 4$', spaceHeight: 65 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          },
          {
            hour: 6,
            title: '因数分解の導入・共通因数のくくり出し',
            leftBlocks: [
              { type: 'objective', data: { text: '因数分解の意味を理解し、各項に共通な因数をくくり出して式を因数分解できる。' } },
              { type: 'review', data: { title: '展開と因数分解', content: '展開: $ma + mb \\leftarrow m(a+b)$　この逆の変形を考えよう！' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '$ax + ay$ をかけ算の形（積の形）になおすにはどうすればよいだろうか？', guide: '共通に含まれている文字 $a$ に着目しよう。', thinkingSpaceHeight: 85, answer: '$a(x + y)$ と積の形にできる。この $a$ や $x+y$ を因数といい、因数の積になおすことを「因数分解する」という。' } },
              { type: 'point-box', data: { badge: '重要定義', title: '因数分解と共通因数', content: '・ <strong>因数分解</strong>: 多項式をいくつかの因数の積の形に表すこと。<br>・ <strong>共通因数のくくり出し</strong>: すべての項に共通な文字や数をカッコの外に出す。<br>$ma + mb = m(a + b)$' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の式を因数分解しなさい。<br>(1) $ax - ay$<br>(2) $3x^2 + 6x$<br>(3) $2ab - 4bc + 6b$', answer: '(1) $a(x - y)$<br>(2) $3x(x + 2)$<br>(3) $2b(a - 2c + 3)$', spaceHeight: 80 } },
              { type: 'question', data: { qNum: '問 2 (注意点)', text: '$4x^2 - 2x$ を $2(2x^2 - x)$ とした。どこが不十分？正しく直しなさい。', answer: '文字 $x$ も共通因数なので外に出す。正解: $2x(2x - 1)$', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          }
        ]
      },
      {
        id: 'u_3_2',
        unitName: '第2章 平方根',
        totalHours: 7,
        bookRef: CLOUD_DOC_LINKS.boardBooks['3'],
        pointRef: CLOUD_DOC_LINKS.pointBooks['3'],
        lessons: [
          {
            hour: 1,
            title: '平方根の意味と根号の表し方',
            leftBlocks: [
              { type: 'objective', data: { text: '平方根の意味を理解し、根号 $\\sqrt{}$ を用いて正しく表すことができる。' } },
              { type: 'review', data: { title: '2乗の計算', content: '$3^2 = 9$、$(-3)^2 = 9$。2乗して9になる数は $3$ と $-3$。' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '面積が $5$ の正方形の1辺の長さは、どのような数になるだろうか？', guide: '2乗して5になる正の数。小数で表せるかな？表せないときは新しい記号 $\\sqrt{}$ を使おう！', thinkingSpaceHeight: 90, answer: '1辺の長さを $\\sqrt{5}$ と表す。2乗して $a$ になる数を $a$ の平方根といい、$\\pm\\sqrt{a}$ と表す。' } },
              { type: 'point-box', data: { badge: '板書まとめ', title: '平方根と根号', content: '・ $a > 0$ のとき、$a$ の平方根は正と負の2つある（絶対値が等しい）。<br>・ 記号 $\\sqrt{}$ を <strong>根号（ルート）</strong> という。<br>・ 正の平方根を $\\sqrt{a}$、負の平方根を $-\\sqrt{a}$ と表す。' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の数の平方根を答えなさい。<br>(1) $25$<br>(2) $0.49$<br>(3) $7$', answer: '(1) $\\pm 5$<br>(2) $\\pm 0.7$<br>(3) $\\pm \\sqrt{7}$', spaceHeight: 65 } },
              { type: 'question', data: { qNum: '問 2', text: '次の値を求めなさい。<br>(1) $\\sqrt{36}$　(2) $-\\sqrt{64}$　(3) $(\\sqrt{11})^2$', answer: '(1) $6$　(2) $-8$　(3) $11$', spaceHeight: 65 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          },
          {
            hour: 3,
            title: '根号をふくむ式の乗法と除法',
            leftBlocks: [
              { type: 'objective', data: { text: '$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$ の性質を理解し、根号を含む式の計算ができる。' } },
              { type: 'review', data: { title: '平方根の定義', content: '面積2の正方形の1辺は $\\sqrt{2}$、面積3の正方形の1辺は $\\sqrt{3}$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '$\\sqrt{2} \\times \\sqrt{3} = \\sqrt{6}$ になる理由を、面積や2乗の計算をもとに説明しよう。', guide: '2乗して6になる正の数は何だろう？ $(\\sqrt{2} \\times \\sqrt{3})^2$ を計算してみよう。', thinkingSpaceHeight: 90, answer: '$(\\sqrt{2}\\times\\sqrt{3})^2 = 2 \\times 3 = 6$。2乗して6になる正の数だから $\\sqrt{6}$ である。' } },
              { type: 'point-box', data: { badge: '計算公式', title: '根号の乗法・除法（$a>0, b>0$）', content: '① <strong>$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$</strong><br>② <strong>$\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$</strong>' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の計算をしなさい。<br>(1) $\\sqrt{3} \\times \\sqrt{5}$<br>(2) $\\sqrt{2} \\times \\sqrt{7}$<br>(3) $\\sqrt{18} \\div \\sqrt{2}$', answer: '(1) $\\sqrt{15}$<br>(2) $\\sqrt{14}$<br>(3) $\\sqrt{9} = 3$', spaceHeight: 75 } },
              { type: 'question', data: { qNum: '問 2', text: '$\\sqrt{12} = \\sqrt{4 \\times 3}$ を $a\\sqrt{b}$ の形にしなさい。', answer: '$\\sqrt{4} \\times \\sqrt{3} = 2\\sqrt{3}$', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          }
        ]
      },
      {
        id: 'u_3_3',
        unitName: '第3章 2次方程式',
        totalHours: 6,
        bookRef: CLOUD_DOC_LINKS.boardBooks['3'],
        pointRef: CLOUD_DOC_LINKS.pointBooks['3'],
        lessons: [
          {
            hour: 4,
            title: '因数分解を利用した解き方',
            leftBlocks: [
              { type: 'objective', data: { text: '$AB=0$ ならば $A=0$ または $B=0$ の性質を利用して、2次方程式を因数分解して解くことができる。' } },
              { type: 'review', data: { title: '前時のふりかえり', content: '$x^2 - 5x + 6 = (x - 2)(x - 3)$' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '2次方程式 $x^2 - 5x + 6 = 0$ の解を見つけるには、左辺をどう変形すればよいか？', guide: '2つの数をかけて0になるとき、どちらかは必ず0だね！', thinkingSpaceHeight: 90, answer: '$(x-2)(x-3)=0$ より $x-2=0$ または $x-3=0$。よって $x=2, 3$。' } },
              { type: 'point-box', data: { badge: '解法のポイント', title: '因数分解による2次方程式の解き方', content: '① 方程式を $ax^2 + bx + c = 0$ の形に整理する。<br>② 左辺を因数分解して $(x - \\alpha)(x - \\beta) = 0$ にする。<br>③ 解は <strong>$x = \\alpha, \\beta$</strong> ！' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の方程式を解きなさい。<br>(1) $(x - 3)(x + 5) = 0$<br>(2) $x^2 - 7x + 10 = 0$<br>(3) $x^2 + 6x = 0$', answer: '(1) $x = 3, -5$<br>(2) $(x-2)(x-5)=0 \\rightarrow x=2, 5$<br>(3) $x(x+6)=0 \\rightarrow x=0, -6$', spaceHeight: 85 } },
              { type: 'question', data: { qNum: '問 2 (重解)', text: '$x^2 - 8x + 16 = 0$ を解きなさい。解は何個？', answer: '$(x-4)^2 = 0$ より $x = 4$（解は1個。重解）', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          }
        ]
      }
    ]
  },
  '2': {
    gradeLabel: '第2学年',
    units: [
      {
        id: 'u_2_3',
        unitName: '第3章 一次関数',
        totalHours: 10,
        bookRef: '',
        pointRef: CLOUD_DOC_LINKS.pointBooks['2'],
        officialRef: '数学学習プリント/02_2年生/数学_3-1一次関数とグラフ.pdf',
        lessons: [
          {
            hour: 2,
            title: '一次関数のグラフと傾き・切片',
            leftBlocks: [
              { type: 'objective', data: { text: '一次関数の式 $y = ax + b$ から傾きと切片を読み取り、グラフの特徴を理解する。' } },
              { type: 'review', data: { title: '比例のグラフ', content: '比例 $y = 2x$ は原点 $(0, 0)$ を通る直線。' } },
              { type: 'graph-block', data: { qNum: '【本時の課題】', text: '右の図は $y = 2x + 1$ のグラフである。<br>① 切片の座標を答えなさい。<br>② 傾き（$x$が1増えるときの$y$の増加量）を答えなさい。', answer: '① $(0, 1)$　② 傾き $= 2$', svgHtml: '' } },
              { type: 'point-box', data: { badge: '板書まとめ', title: '一次関数のグラフ', content: '・ <strong>$a$（傾き）</strong>: 変化の割合。右に1進むと上下にどれだけ進むか。<br>・ <strong>$b$（切片）</strong>: $y$軸との交点 $(0, b)$。' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '次の直線の傾きと切片を答えなさい。<br>(1) $y = 3x - 5$<br>(2) $y = -2x + 4$', answer: '(1) 傾き: $3$, 切片: $-5$<br>(2) 傾き: $-2$, 切片: $4$', spaceHeight: 65 } },
              { type: 'question', data: { qNum: '問 2', text: '傾きが $-1$ で、切片が $3$ の直線の式を求めなさい。', answer: '$y = -x + 3$', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          }
        ]
      }
    ]
  },
  '1': {
    gradeLabel: '第1学年',
    units: [
      {
        id: 'u_1_3',
        unitName: '第3章 一次方程式',
        totalHours: 8,
        bookRef: '',
        pointRef: CLOUD_DOC_LINKS.pointBooks['1'],
        officialRef: '数学学習プリント/01_1年生/数学_3-1方程式.pdf',
        lessons: [
          {
            hour: 3,
            title: '移項を利用した方程式の解き方',
            leftBlocks: [
              { type: 'objective', data: { text: '等式の性質をもとに「移項」の仕組みを理解し、方程式をスムーズに解くことができる。' } },
              { type: 'review', data: { title: '等式の性質', content: '両辺に同じ数をたしてもひいても等式は成り立つ。' } },
              { type: 'board-task', data: { qNum: '【本時の課題】', text: '$3x - 5 = 7$ を解くとき、両辺に $+5$ すると項はどう動いたように見える？', guide: '左辺の $-5$ が消えて、右辺に $+5$ が現れるね！', thinkingSpaceHeight: 85, answer: '符号を変えて他方の辺へ移すことができる。これを「移項」という。' } },
              { type: 'point-box', data: { badge: '移項のルール', title: '方程式を解く手順', content: '① <strong>移項</strong>: $x$の項を左辺へ、数の項を右辺へ符号を変えて移す。<br>② <strong>整理</strong>: $ax = b$ の形にまとめる。<br>③ <strong>割る</strong>: $x = \\frac{b}{a}$ を求める。' } }
            ],
            rightBlocks: [
              { type: 'question', data: { qNum: '問 1', text: '移項を利用して次の方程式を解きなさい。<br>(1) $4x - 3 = 9$<br>(2) $5x + 2 = 2x + 11$', answer: '(1) $4x = 12 \\rightarrow x = 3$<br>(2) $3x = 9 \\rightarrow x = 3$', spaceHeight: 70 } },
              { type: 'question', data: { qNum: '問 2', text: '方程式 $7x - 4 = 3x + 12$ を解きなさい。', answer: '$4x = 16 \\rightarrow x = 4$', spaceHeight: 50 } },
              { type: 'reflection', data: { title: '本時の自己評価 & 振り返り' } }
            ]
          }
        ]
      }
    ]
  }
};

// 状態管理: 選択中の学年・単元・時数
let currentB4Grade = '3';
let currentB4UnitId = 'u_3_1';
let currentB4Hour = 5; // デフォルト: 3年多項式 5時間目 (工夫して展開)

// マイ授業プリント保存データ（localStorage管理）
const SAVED_WORKSHEETS_KEY = 'math_portal_saved_worksheets';

function getSavedWorksheets() {
  try {
    const raw = localStorage.getItem(SAVED_WORKSHEETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveWorksheetToStorage(customName = null) {
  const currentTitle = document.getElementById('paperTitle')?.textContent || '数学 授業プリント';
  const unitInfo = getUnitInfo(currentB4Grade, currentB4UnitId);
  const name = customName || prompt('保存する授業プリントの名前を入力してください:', currentTitle);
  if (!name) return;

  const savedList = getSavedWorksheets();
  const newEntry = {
    id: 'ws_' + Date.now(),
    name: name,
    title: currentTitle,
    grade: currentB4Grade,
    unitId: currentB4UnitId,
    unitName: unitInfo ? unitInfo.unitName : '',
    hour: currentB4Hour,
    totalHours: unitInfo ? unitInfo.totalHours : 10,
    savedAt: new Date().toLocaleString('ja-JP'),
    blocksLeft: state.blocksLeft || [],
    blocksRight: state.blocksRight || []
  };

  savedList.unshift(newEntry);
  localStorage.setItem(SAVED_WORKSHEETS_KEY, JSON.stringify(savedList));
  renderSavedWorksheetsModalList();
  showToast('<i class="fa-solid fa-floppy-disk text-success"></i> 「' + name + '」をマイプリントに保存しました！');
}

function deleteSavedWorksheet(id) {
  if (!confirm('この保存済みプリントを削除しますか？')) return;
  let list = getSavedWorksheets();
  list = list.filter(item => item.id !== id);
  localStorage.setItem(SAVED_WORKSHEETS_KEY, JSON.stringify(list));
  renderSavedWorksheetsModalList();
  showToast('保存済みプリントを削除しました');
}

function loadSavedWorksheet(id) {
  const list = getSavedWorksheets();
  const item = list.find(w => w.id === id);
  if (!item) return;

  currentB4Grade = item.grade;
  currentB4UnitId = item.unitId;
  currentB4Hour = item.hour;

  // 用紙に反映
  state.blocksLeft = item.blocksLeft || [];
  state.blocksRight = item.blocksRight || [];
  // 互換性用
  state.blocks = [...state.blocksLeft, ...state.blocksRight];

  // タイトル等
  document.getElementById('paperTitle').textContent = item.title;
  document.getElementById('paperGradeBadge').textContent = '第' + item.grade + '学年 数学科 授業プリント';
  document.getElementById('paperUnitBadge').textContent = item.unitName;
  document.getElementById('paperHourBadge').textContent = '【第 ' + item.hour + ' 時 / 全 ' + item.totalHours + ' 時】';

  renderWorksheetB4();
  closeSavedWorksheetsModal();
  showToast('<i class="fa-solid fa-folder-open text-primary"></i> 「' + item.name + '」を読み込みました');
}

// データベースから単元情報を取得
function getUnitInfo(grade, unitId) {
  const gData = boardLessonDatabase[grade];
  if (!gData) return null;
  return gData.units.find(u => u.id === unitId) || gData.units[0];
}

// データベースから時数情報を取得
function getLessonInfo(grade, unitId, hour) {
  const unit = getUnitInfo(grade, unitId);
  if (!unit) return null;
  return unit.lessons.find(l => l.hour === Number(hour)) || unit.lessons[0];
}

// 学年・単元・時数を選んだ時のテンプレート自動流し込み
function loadBoardLessonPreset(grade, unitId, hour) {
  currentB4Grade = String(grade);
  currentB4UnitId = unitId;
  currentB4Hour = Number(hour);

  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit) return;

  const lesson = getLessonInfo(currentB4Grade, currentB4UnitId, currentB4Hour);
  if (!lesson) return;

  // タイトルとバッジを更新
  const titleEl = document.getElementById('paperTitle');
  if (titleEl) titleEl.textContent = lesson.title;

  const gradeBadge = document.getElementById('paperGradeBadge');
  if (gradeBadge) gradeBadge.textContent = '第' + currentB4Grade + '学年 数学科 授業プリント';

  const unitBadge = document.getElementById('paperUnitBadge');
  if (unitBadge) unitBadge.textContent = unit.unitName;

  const hourBadge = document.getElementById('paperHourBadge');
  if (hourBadge) hourBadge.textContent = '【第 ' + lesson.hour + ' 時 / 全 ' + unit.totalHours + ' 時】';

  // 左面・右面のブロックを初期化＆複製流し込み
  state.blocksLeft = JSON.parse(JSON.stringify(lesson.leftBlocks)).map(b => {
    b.id = generateBlockId();
    if (b.type === 'graph-block' && !b.data.svgHtml) {
      b.data.svgHtml = generateLinearSvg(2, 1, true, true, 190, 180);
    }
    return b;
  });

  state.blocksRight = JSON.parse(JSON.stringify(lesson.rightBlocks)).map(b => {
    b.id = generateBlockId();
    return b;
  });

  state.blocks = [...state.blocksLeft, ...state.blocksRight];

  // UIドロップダウンの同期
  updateB4SelectorUI();

  // B4横見開きレンダリング
  renderWorksheetB4();

  showToast('<i class="fa-solid fa-wand-magic-sparkles text-primary"></i> 【' + unit.unitName + ' 第' + lesson.hour + '時】の板書テンプレートを展開しました');
}

// B4横見開きの描画関数
function renderWorksheetB4() {
  const leftCol = document.getElementById('blocksLeftCol');
  const rightCol = document.getElementById('blocksRightCol');
  if (!leftCol || !rightCol) return;

  leftCol.innerHTML = renderBlockColumn(state.blocksLeft || [], 'left');
  rightCol.innerHTML = renderBlockColumn(state.blocksRight || [], 'right');

  // KaTeXの数式レンダリングを必ず適用（ドル記号 $...$ を数式に変換）
  const sheet = document.getElementById('printableSheet');
  if (sheet) {
    applyKaTeXIfAvailable(sheet);
  }
}

// カラム内ブロックのHTML生成
function renderBlockColumn(blocks, colSide) {
  if (blocks.length === 0) {
    return '<div class="empty-col-drop" onclick="addBlockToSide(\'question\', \'' + colSide + '\')"><i class="fa-solid fa-plus"></i> パーツを追加</div>';
  }

  return blocks.map((block, index) => {
    let blockContentHtml = '';

    if (block.type === 'objective') {
      blockContentHtml = `
        <div class="objective-box">
          <span class="objective-label">めあて</span>
          <div class="objective-text" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
            ${block.data.text}
          </div>
        </div>
      `;
    } else if (block.type === 'review') {
      blockContentHtml = `
        <div class="review-box">
          <div class="review-title" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerHTML)">
            <i class="fa-solid fa-clock-rotate-left"></i> ${block.data.title}
          </div>
          <div class="q-body" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'board-task') {
      blockContentHtml = `
        <div class="board-task-box">
          <div class="board-task-header">
            <span class="board-task-badge"><i class="fa-solid fa-chalkboard-user"></i> ${block.data.qNum}</span>
            <div class="board-task-text" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
              ${block.data.text}
            </div>
          </div>
          ${block.data.guide ? `
            <div class="board-task-guide" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'guide', this.innerHTML)">
              <i class="fa-solid fa-compass text-primary"></i> ${block.data.guide}
            </div>
          ` : ''}
          <div class="board-task-canvas" style="min-height: ${block.data.thinkingSpaceHeight || 85}px;">
            <div class="canvas-grid-label">【自分の考え・途中式・説明】</div>
            <div class="answer-space answer-text-inline">
              <span class="answer-label">【板書まとめ・模範解】</span>
              <span class="answer-text">${block.data.answer}</span>
            </div>
          </div>
        </div>
      `;
    } else if (block.type === 'point-box') {
      blockContentHtml = `
        <div class="point-summary-box">
          <div class="point-summary-header">
            <span class="point-badge"><i class="fa-solid fa-bookmark"></i> ${block.data.badge || '要点公式'}</span>
            <strong contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)">${block.data.title}</strong>
          </div>
          <div class="point-summary-body" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'question') {
      blockContentHtml = `
        <div class="question-item">
          <div class="q-header">
            <span class="q-num" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
            <div class="q-body" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
              ${block.data.text}
            </div>
          </div>
          <div class="answer-space" style="min-height: ${block.data.spaceHeight || 50}px;">
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
                <span class="q-num" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
                <div class="q-body" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
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
            <span contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)">${block.data.title}</span>
          </div>
          <div class="summary-content" contenteditable="true" onblur="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)">
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
          <button class="block-ctrl-btn" onclick="moveColBlock('${colSide}', ${index}, -1)" title="上へ"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="block-ctrl-btn" onclick="moveColBlock('${colSide}', ${index}, 1)" title="下へ"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="block-ctrl-btn" onclick="transferColBlock('${colSide}', ${index})" title="反対側の面へ移動"><i class="fa-solid fa-arrows-left-right"></i></button>
          <button class="block-ctrl-btn danger" onclick="removeColBlock('${colSide}', ${index})" title="削除"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${blockContentHtml}
      </div>
    `;
  }).join('');
}

function updateColBlockData(colSide, index, field, value) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (blocks && blocks[index]) {
    blocks[index].data[field] = value;
  }
}

function moveColBlock(colSide, index, direction) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= blocks.length) return;
  const temp = blocks[index];
  blocks[index] = blocks[targetIndex];
  blocks[targetIndex] = temp;
  renderWorksheetB4();
}

function transferColBlock(colSide, index) {
  const source = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  const target = colSide === 'left' ? state.blocksRight : state.blocksLeft;
  const item = source.splice(index, 1)[0];
  if (item) {
    target.push(item);
    renderWorksheetB4();
  }
}

function removeColBlock(colSide, index) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  blocks.splice(index, 1);
  renderWorksheetB4();
}

function addBlockToSide(type, colSide = 'left') {
  let block = { id: generateBlockId(), type: type, data: {} };
  if (type === 'objective') block.data = { text: '本時の学習目標を入力してください。' };
  else if (type === 'review') block.data = { title: '前時のふりかえり', content: '前時の重要公式や既習内容' };
  else if (type === 'board-task') block.data = { qNum: '【本時の課題】', text: '板書の発問・生徒が取り組む活動課題', guide: '着眼点・見通し', thinkingSpaceHeight: 90, answer: '解決のポイント' };
  else if (type === 'point-box') block.data = { badge: '板書まとめ', title: '重要ポイント・公式', content: '公式や定理の整理' };
  else if (type === 'question') block.data = { qNum: '問', text: '練習問題・適用問題を入力してください。', answer: '解答例', spaceHeight: 55 };
  else if (type === 'graph-block') block.data = { qNum: '問', text: 'グラフの直線の式を答えなさい。', answer: 'y = 2x + 1', svgHtml: generateLinearSvg(2, 1, true, true, 190, 180) };
  else if (type === 'summary') block.data = { title: '本時のまとめ', content: '授業のまとめ・ポイント' };
  else if (type === 'reflection') block.data = { title: '本時の自己評価 & 振り返り' };

  if (colSide === 'left') state.blocksLeft.push(block);
  else state.blocksRight.push(block);
  renderWorksheetB4();
}

// 学年ピルボタン切り替え
function selectB4Grade(grade) {
  currentB4Grade = String(grade);
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('b4GradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentB4Grade === g);
  });
  updateB4UnitDropdown();
  applyB4LessonSelection();
}

// 単元ドロップダウンの更新
function updateB4UnitDropdown() {
  const unitSelect = document.getElementById('b4UnitSelect');
  if (!unitSelect) return;

  const gData = boardLessonDatabase[currentB4Grade];
  if (!gData || !gData.units) return;

  unitSelect.innerHTML = gData.units.map((u, idx) => {
    return '<option value="' + u.id + '">' + u.unitName + ' (全' + u.totalHours + '時)</option>';
  }).join('');

  currentB4UnitId = gData.units[0].id;
  updateB4HourDropdown();
}

// ◯時間目ドロップダウンの更新
function updateB4HourDropdown() {
  const hourSelect = document.getElementById('b4HourSelect');
  if (!hourSelect) return;

  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit || !unit.lessons) return;

  hourSelect.innerHTML = unit.lessons.map(l => {
    return '<option value="' + l.hour + '">第 ' + l.hour + ' 時: ' + l.title + '</option>';
  }).join('');

  currentB4Hour = unit.lessons[0].hour;
  updateReferenceLinksUI(unit);
}

function onB4UnitChange() {
  const unitSelect = document.getElementById('b4UnitSelect');
  if (unitSelect) {
    currentB4UnitId = unitSelect.value;
    updateB4HourDropdown();
    applyB4LessonSelection();
  }
}

function onB4HourChange() {
  const hourSelect = document.getElementById('b4HourSelect');
  if (hourSelect) {
    currentB4Hour = Number(hourSelect.value);
    applyB4LessonSelection();
  }
}

// 「この時間のプリントを生成」ボタン押下
function applyB4LessonSelection() {
  loadBoardLessonPreset(currentB4Grade, currentB4UnitId, currentB4Hour);
}

// 教材リファレンスリンクの更新
function updateReferenceLinksUI(unit) {
  const btnBoard = document.getElementById('btnWsViewBoard');
  const btnPoint = document.getElementById('btnWsViewPoint');
  const btnOfficial = document.getElementById('btnWsViewOfficial');

  if (btnBoard) btnBoard.style.display = (unit && unit.bookRef) ? 'inline-flex' : 'none';
  if (btnPoint) btnPoint.style.display = (unit && unit.pointRef) ? 'inline-flex' : 'none';
  if (btnOfficial) btnOfficial.style.display = (unit && unit.officialRef) ? 'inline-flex' : 'none';
}

function openCurrentB4BoardPdf() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (unit && unit.bookRef) {
    openPdfPreviewModal(encodeURIComponent(unit.bookRef), '【中' + currentB4Grade + ' 板書＆展開例】' + unit.unitName);
  } else {
    showToast('この単元の板書書籍PDFは準備中です');
  }
}

function openCurrentB4PointPdf() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (unit && unit.pointRef) {
    openPdfPreviewModal(encodeURIComponent(unit.pointRef), '【中' + currentB4Grade + ' 要点ブック】' + unit.unitName);
  }
}

function openCurrentB4OfficialPdf() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (unit && unit.officialRef) {
    openPdfPreviewModal(encodeURIComponent(unit.officialRef), '【中' + currentB4Grade + ' 公式学習プリント】' + unit.unitName);
  }
}

// UIのセレクターの状態を最新に同期
function updateB4SelectorUI() {
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('b4GradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentB4Grade === g);
  });

  const unitSelect = document.getElementById('b4UnitSelect');
  if (unitSelect) unitSelect.value = currentB4UnitId;

  const hourSelect = document.getElementById('b4HourSelect');
  if (hourSelect) hourSelect.value = String(currentB4Hour);

  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  updateReferenceLinksUI(unit);
}

// ========================================================
// 保存済みマイ授業プリント モーダル管理
// ========================================================
function openSavedWorksheetsModal() {
  renderSavedWorksheetsModalList();
  document.getElementById('savedWorksheetsModal')?.classList.remove('hidden');
}

function closeSavedWorksheetsModal() {
  document.getElementById('savedWorksheetsModal')?.classList.add('hidden');
}

function renderSavedWorksheetsModalList() {
  const container = document.getElementById('savedWorksheetsList');
  if (!container) return;

  const list = getSavedWorksheets();
  if (list.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2.5rem; color: var(--text-muted);"><i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.8rem; color: #cbd5e1; display: block;"></i><p>まだ保存されたマイプリントはありません。<br>「マイプリントに保存」ボタンを押すとここに蓄積されます。</p></div>';
    return;
  }

  container.innerHTML = list.map(item => {
    return `
      <div class="saved-ws-item-card">
        <div class="saved-ws-item-header">
          <div class="saved-ws-item-meta">
            <span class="saved-ws-grade-badge">中${item.grade}</span>
            <span class="saved-ws-unit-text">${item.unitName} (第${item.hour}時)</span>
            <span class="saved-ws-date-text">${item.savedAt}</span>
          </div>
          <h4 class="saved-ws-item-title">${item.name}</h4>
        </div>
        <div class="saved-ws-item-actions">
          <button class="btn btn-sm btn-primary" onclick="loadSavedWorksheet('${item.id}')">
            <i class="fa-solid fa-folder-open"></i> 開いて編集
          </button>
          <button class="btn btn-sm btn-ghost text-danger" onclick="deleteSavedWorksheet('${item.id}')" title="削除">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 全プリントのJSONバックアップ書き出し
function exportWorksheetsBackup() {
  const list = getSavedWorksheets();
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '中学数学_マイ授業プリントバックアップ_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('マイプリントのバックアップファイルを保存しました');
}

// 全プリントのJSONバックアップ読み込み
function importWorksheetsBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        const existing = getSavedWorksheets();
        const merged = [...imported, ...existing.filter(ex => !imported.some(im => im.id === ex.id))];
        localStorage.setItem(SAVED_WORKSHEETS_KEY, JSON.stringify(merged));
        renderSavedWorksheetsModalList();
        showToast('マイプリントデータを復元・追加しました（' + imported.length + '件）');
      }
    } catch (err) {
      alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
    }
  };
  reader.readAsText(file);
}


// ========================================================
// 授業プリント B4 表示倍率（ズーム）制御
// ========================================================
let currentWorksheetZoom = 1.0;

function setWorksheetZoom(scale) {
  currentWorksheetZoom = scale;
  const container = document.getElementById('b4ZoomScaledContainer');
  if (container) {
    container.style.transform = scale === 1.0 ? 'none' : `scale(${scale})`;
    container.style.transformOrigin = 'top center';
    // 縮小時に余計な下部余白を詰める
    if (scale < 1.0) {
      const approxHeight = 840;
      container.style.marginBottom = `-${Math.round((1 - scale) * approxHeight)}px`;
    } else {
      container.style.marginBottom = '0px';
    }
  }

  ['100', '85', '75'].forEach(z => {
    const btn = document.getElementById('zoomBtn_' + z);
    if (btn) btn.classList.toggle('active', Math.round(scale * 100) === Number(z));
  });
}


// ========================================================
// TAB 7: 📚 教材資料室 (デジタルライブラリ) ロジック
// ========================================================
let currentDigitalLibraryGrade = 'all';
let currentDigitalLibrarySearch = '';

function renderDigitalLibrary() {
  renderMeijiBookshelf();
  renderGakkenBookshelf();
  renderOfficialBookshelf();
}

function filterDigitalLibrary(grade) {
  currentDigitalLibraryGrade = grade;
  ['all', '1', '2', '3'].forEach(g => {
    const btn = document.getElementById('libFilterBtn_' + g);
    if (btn) btn.classList.toggle('active', currentDigitalLibraryGrade === g);
  });
  renderDigitalLibrary();
}

function onDigitalLibrarySearch() {
  const input = document.getElementById('digitalLibrarySearchInput');
  currentDigitalLibrarySearch = (input?.value || '').toLowerCase().trim();
  renderDigitalLibrary();
}

// 1. 明治図書『板書＆展開例』本棚
function renderMeijiBookshelf() {
  const container = document.getElementById('meijiBookshelfGrid');
  if (!container) return;

  const books = [
    {
      grade: '3',
      gradeLabel: '中3',
      title: '板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 3年上',
      desc: '多項式・平方根・2次方程式・関数y=ax²の全授業展開案と黒板レイアウトを収録。発問・活動の工夫が満載。',
      file: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
      units: ['多項式', '平方根', '2次方程式', '関数 y=ax²']
    },
    {
      grade: '2',
      gradeLabel: '中2',
      title: '板書＆展開例でよくわかる 365日の全授業 中学校数学 2年 (近日追加)',
      desc: '式の計算・連立方程式・一次関数・図形の証明・確率の板書計画と指導案。',
      file: '',
      units: ['式の計算', '連立方程式', '一次関数', '図形の合同', '確率']
    },
    {
      grade: '1',
      gradeLabel: '中1',
      title: '板書＆展開例でよくわかる 365日の全授業 中学校数学 1年 (近日追加)',
      desc: '正負の数・文字と式・方程式・比例と反比例・平面空間図形・データの活用の板書計画。',
      file: '',
      units: ['正負の数', '文字と式', '一次方程式', '比例と反比例', '空間図形']
    }
  ];

  let filtered = books;
  if (currentDigitalLibraryGrade !== 'all') {
    filtered = filtered.filter(b => b.grade === currentDigitalLibraryGrade);
  }
  if (currentDigitalLibrarySearch) {
    filtered = filtered.filter(b => 
      b.title.toLowerCase().includes(currentDigitalLibrarySearch) ||
      b.desc.toLowerCase().includes(currentDigitalLibrarySearch) ||
      b.units.some(u => u.toLowerCase().includes(currentDigitalLibrarySearch))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; padding: 1.5rem; text-align: center; color: var(--text-muted);">該当する書籍はありません</div>';
    return;
  }

  container.innerHTML = filtered.map(b => {
    const enc = encodeURIComponent(b.file);
    const unitTags = b.units.map(u => `<span class="badge" style="background:#e0f2fe; color:#0369a1; font-size:0.72rem; padding:2px 6px;">${u}</span>`).join(' ');
    const actionBtns = b.file ? `
      <button class="btn btn-sm btn-outline text-primary" onclick="openPdfPreviewModal('${enc}', '${b.title}')">
        <i class="fa-solid fa-eye"></i> プレビュー
      </button>
      <button class="btn btn-sm btn-primary" onclick="openPdfInNewTab('${enc}')">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 別タブ / 印刷
      </button>
    ` : `
      <button class="btn btn-sm btn-ghost text-muted" disabled style="font-size:0.78rem;">
        <i class="fa-solid fa-clock"></i> 順次追加予定
      </button>
    `;

    return `
      <div class="library-book-card theme-meiji">
        <div class="library-card-header">
          <div class="library-card-meta">
            <span class="library-grade-tag" style="background:#0284c7;">${b.gradeLabel}</span>
            <span class="library-category-tag">明治図書 指導書</span>
          </div>
          <h4 class="library-book-title">${b.title}</h4>
          <p class="library-book-desc">${b.desc}</p>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">${unitTags}</div>
        </div>
        <div class="library-card-actions">
          ${actionBtns}
        </div>
      </div>
    `;
  }).join('');
}

// 2. 学研『数学をひとつひとつわかりやすく。』本棚
function renderGakkenBookshelf() {
  const container = document.getElementById('gakkenBookshelfGrid');
  if (!container) return;

  const books = [
    {
      grade: '1',
      gradeLabel: '中1',
      title: '中1数学をひとつひとつわかりやすく。',
      desc: '中学1年生の全単元をスモールステップで超基礎から解説。左ページに要点、右ページに基本練習の安心構成。',
      file: CLOUD_DOC_LINKS.pointBooks['1'],
      features: ['スモールステップ', '基本の穴埋め', 'つまずき防止']
    },
    {
      grade: '2',
      gradeLabel: '中2',
      title: '中2数学をひとつひとつわかりやすく。',
      desc: '式の計算・連立方程式・一次関数・合同証明・確率を図解でわかりやすく解説。苦手な生徒の個別指導に最適。',
      file: CLOUD_DOC_LINKS.pointBooks['2'],
      features: ['図解まとめ', '式の変形', '証明の書き方ステップ']
    },
    {
      grade: '3',
      gradeLabel: '中3',
      title: '中3数学をひとつひとつわかりやすく。',
      desc: '展開・因数分解・平方根・2次方程式・関数y=ax²・相似・円・三平方を網羅。高校入試対策の土台固めに。',
      file: CLOUD_DOC_LINKS.pointBooks['3'],
      features: ['公式の導き方', '置き換えの工夫', '計算ミス防止']
    }
  ];

  let filtered = books;
  if (currentDigitalLibraryGrade !== 'all') {
    filtered = filtered.filter(b => b.grade === currentDigitalLibraryGrade);
  }
  if (currentDigitalLibrarySearch) {
    filtered = filtered.filter(b => 
      b.title.toLowerCase().includes(currentDigitalLibrarySearch) ||
      b.desc.toLowerCase().includes(currentDigitalLibrarySearch)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; padding: 1.5rem; text-align: center; color: var(--text-muted);">該当する書籍はありません</div>';
    return;
  }

  container.innerHTML = filtered.map(b => {
    const enc = encodeURIComponent(b.file);
    const featTags = b.features.map(f => `<span class="badge" style="background:#ecfdf5; color:#065f46; font-size:0.72rem; padding:2px 6px;">${f}</span>`).join(' ');

    return `
      <div class="library-book-card theme-gakken">
        <div class="library-card-header">
          <div class="library-card-meta">
            <span class="library-grade-tag" style="background:#10b981;">${b.gradeLabel}</span>
            <span class="library-category-tag">学研 要点ブック</span>
          </div>
          <h4 class="library-book-title">${b.title}</h4>
          <p class="library-book-desc">${b.desc}</p>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">${featTags}</div>
        </div>
        <div class="library-card-actions">
          <button class="btn btn-sm btn-outline text-success" onclick="openPdfPreviewModal('${enc}', '${b.title}')">
            <i class="fa-solid fa-eye"></i> プレビュー
          </button>
          <button class="btn btn-sm btn-primary" onclick="openPdfInNewTab('${enc}')" style="background:#10b981; border-color:#059669;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> 別タブ / 印刷
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 3. 単元別 数学学習プリント本棚
function renderOfficialBookshelf() {
  const container = document.getElementById('officialBookshelfGrid');
  if (!container) return;

  // OneDrive 共有フォルダバナーの追加
  const folderBannerHtml = `
    <div style="grid-column: 1 / -1; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1.5px solid #bfdbfe; border-radius: var(--radius-md); padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.5rem; box-shadow: var(--shadow-sm);">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="background: #0284c7; color: #ffffff; width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
          <i class="fa-solid fa-cloud-arrow-down"></i>
        </div>
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; color: #1e3a8a; margin-bottom: 0.25rem;">
            OneDrive 数学学習プリント 共有フォルダ（全学年・全単元）
          </h4>
          <p style="font-size: 0.82rem; color: #1e40af; margin: 0;">
            1年生・2年生・3年生のすべての単元プリント＆解答PDFをオンラインフォルダからまとめて閲覧・印刷できます。
          </p>
        </div>
      </div>
      <a href="${CLOUD_DOC_LINKS.officialPrintsFolder}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="background: #0284c7; border-color: #0284c7; font-weight: 700; padding: 0.6rem 1.2rem; display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none;">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> OneDrive共有フォルダを開く
      </a>
    </div>
  `;


  // officialPrintLibrary から取得
  const allPrints = [];
  ['1', '2', '3'].forEach(g => {
    const list = officialPrintLibrary[g] || [];
    list.forEach(p => {
      allPrints.push({ ...p, grade: g, gradeLabel: '中' + g });
    });
  });

  let filtered = allPrints;
  if (currentDigitalLibraryGrade !== 'all') {
    filtered = filtered.filter(p => p.grade === currentDigitalLibraryGrade);
  }
  if (currentDigitalLibrarySearch) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(currentDigitalLibrarySearch) ||
      p.unit.toLowerCase().includes(currentDigitalLibrarySearch) ||
      p.category.toLowerCase().includes(currentDigitalLibrarySearch)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted);">一致する単元プリントはありません</div>';
    return;
  }

  // 最大12件表示 + 全件表示
  container.innerHTML = folderBannerHtml + filtered.map(p => {
    const enc = encodeURIComponent(p.file);
    return `
      <div class="library-book-card theme-official">
        <div class="library-card-header">
          <div class="library-card-meta">
            <span class="library-grade-tag" style="background:#f59e0b;">${p.gradeLabel}</span>
            <span class="library-category-tag">${p.unit}</span>
          </div>
          <h4 class="library-book-title" style="font-size: 0.95rem;">${p.title}</h4>
          <p class="library-book-desc" style="font-size: 0.76rem; margin-bottom: 0.5rem;">領域: ${p.category} | 問題・解答付き</p>
        </div>
        <div class="library-card-actions">
          <button class="btn btn-sm btn-outline" onclick="openPdfPreviewModal('${enc}', '【${p.gradeLabel}】${p.unit} ${p.title}')">
            <i class="fa-solid fa-eye"></i> プレビュー
          </button>
          <button class="btn btn-sm btn-primary" onclick="openPdfInNewTab('${enc}')" style="background:#f59e0b; border-color:#d97706;">
            <i class="fa-solid fa-print"></i> 印刷 / 開く
          </button>
        </div>
      </div>
    `;
  }).join('');
}


// ========================================================
// 『ひとつひとつわかりやすく』＆『数学学習プリント』分析に基づく
// 多彩な問い方ジェネレーター（穴埋め・つまずき・工夫・文章題）
// ========================================================

// 【穴埋め・基礎】展開公式・因数分解の空欄穴埋め
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
