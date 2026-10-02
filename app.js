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

  selectB4Grade('3', true);
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

// ========================================================
// 練習プリント専用 インライン図・表作図エンジン
// ========================================================

// 1. 一次関数グラフ問題用 SVG (軸・格子点・直線をコンパクトに描画)
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
    const adVal = 4;
    const dbVal = 2;
    const deVal = pickRandom([3, 5, 6]);
    // AD : AB = DE : BC -> 4 : 6 = deVal : bcVal -> bcVal = deVal * 1.5
    const bcVal = (deVal * 6) / 4;
    const svg = generateSimilarityTriangleSvg(adVal, dbVal, 'c', 'd', deVal, 'x', 'x', 180, 130);

    return {
      level: 2,
      q: `右の図において、DE // BC のとき、線分 BC の長さを求めなさい。`,
      ans: `BC ＝ ${bcVal} cm`,
      figureHtml: svg,
      steps: [
        `DE // BC より △ADE ∽ △ABC (2組の角がそれぞれ等しい)`,
        `対応する辺の比: AD : AB ＝ DE : BC`,
        `AD ＝ ${adVal}, AB ＝ ${adVal} ＋ ${dbVal} ＝ ${adVal + dbVal}`,
        `${adVal} : ${adVal + dbVal} ＝ ${deVal} : x → ${adVal}x ＝ ${(adVal + dbVal) * deVal} → x ＝ ${bcVal}`,
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

// ========================================================
// 単元別ジェネレーター厳密マッピングテーブル
// （他単元の誤混入を100%防止）
// ========================================================
const subUnitGeneratorMap = {
  // --- 中1 ---
  'g1_all_mix': ['g1_pos_neg_add_sub', 'g1_pos_neg_mul_div', 'g1_pos_neg_four_ops', 'g1_letters_expression', 'g1_letters_value', 'g1_eq_linear', 'g1_eq_word', 'g1_prop_direct', 'g1_prop_inverse', 'g1_data_frequency_table', 'g1_data_relative_freq'],
  'g1_pos_neg_all': ['g1_pos_neg_add_sub', 'g1_pos_neg_mul_div', 'g1_pos_neg_four_ops'],
  'g1_pos_neg_add_sub': ['g1_pos_neg_add_sub'],
  'g1_pos_neg_mul_div': ['g1_pos_neg_mul_div'],
  'g1_pos_neg_four_ops': ['g1_pos_neg_four_ops'],
  'g1_letters_all': ['g1_letters_expression', 'g1_letters_value'],
  'g1_letters_expression': ['g1_letters_expression'],
  'g1_letters_value': ['g1_letters_value'],
  'g1_eq_all': ['g1_eq_linear', 'g1_eq_word'],
  'g1_eq_linear': ['g1_eq_linear'],
  'g1_eq_word': ['g1_eq_word'],
  'g1_prop_all': ['g1_prop_direct', 'g1_prop_inverse'],
  'g1_prop_direct': ['g1_prop_direct'],
  'g1_prop_inverse': ['g1_prop_inverse'],
  'g1_plane_all': ['g1_plane_sector_area', 'g1_plane_symmetry'],
  'g1_plane_sector_area': ['g1_plane_sector_area'],
  'g1_plane_symmetry': ['g1_plane_symmetry'],
  'g1_solid_all': ['g1_solid_cylinder_volume', 'g1_solid_cone_volume', 'g1_solid_sphere_surface_vol'],
  'g1_solid_cylinder_volume': ['g1_solid_cylinder_volume'],
  'g1_solid_cone_volume': ['g1_solid_cone_volume'],
  'g1_solid_sphere_surface_vol': ['g1_solid_sphere_surface_vol'],
  'g1_data_all': ['g1_data_mean_median_mode', 'g1_data_relative_freq', 'g1_data_frequency_table'],
  'g1_data_mean_median_mode': ['g1_data_mean_median_mode'],
  'g1_data_relative_freq': ['g1_data_relative_freq'],
  'g1_data_frequency_table': ['g1_data_frequency_table'],

  // --- 中2 ---
  'g2_all_mix': ['g2_poly_add_sub', 'g2_poly_mul_div', 'g2_poly_transform', 'g2_simul_add_sub', 'g2_simul_subst', 'g2_simul_complex', 'g2_simul_word', 'g2_lfunc_rate', 'g2_lfunc_graph', 'g2_lfunc_find_eq', 'g2_lfunc_graph_read', 'g2_lfunc_intersect', 'g2_geom_parallel_angles', 'g2_geom_parallel_chevron', 'g2_geom_polygon_angles', 'g2_geom_triangle_prop', 'g2_quad_parallelogram', 'g2_quad_special', 'g2_prob_dice_coin', 'g2_prob_balls', 'g2_data_boxplot', 'g2_data_boxplot_svg'],
  'g2_poly_all': ['g2_poly_add_sub', 'g2_poly_mul_div', 'g2_poly_transform'],
  'g2_poly_add_sub': ['g2_poly_add_sub'],
  'g2_poly_mul_div': ['g2_poly_mul_div'],
  'g2_poly_transform': ['g2_poly_transform'],
  'g2_simul_all': ['g2_simul_add_sub', 'g2_simul_subst', 'g2_simul_complex', 'g2_simul_word'],
  'g2_simul_add_sub': ['g2_simul_add_sub'],
  'g2_simul_subst': ['g2_simul_subst'],
  'g2_simul_complex': ['g2_simul_complex'],
  'g2_simul_word': ['g2_simul_word'],
  // ★ 一次関数は一次関数のみを厳密指定！図形は絶対に混入しない！
  'g2_lfunc_all': ['g2_lfunc_rate', 'g2_lfunc_graph', 'g2_lfunc_find_eq', 'g2_lfunc_graph_read', 'g2_lfunc_intersect'],
  'g2_lfunc_rate': ['g2_lfunc_rate'],
  'g2_lfunc_graph': ['g2_lfunc_graph', 'g2_lfunc_graph_read'],
  'g2_lfunc_find_eq': ['g2_lfunc_find_eq'],
  'g2_lfunc_intersect': ['g2_lfunc_intersect'],
  // ★ 図形
  'g2_geom_all': ['g2_geom_parallel_angles', 'g2_geom_parallel_chevron', 'g2_geom_polygon_angles', 'g2_geom_triangle_prop', 'g2_geom_triangle_fig'],
  'g2_geom_parallel_angles': ['g2_geom_parallel_angles', 'g2_geom_parallel_chevron'],
  'g2_geom_polygon_angles': ['g2_geom_polygon_angles'],
  'g2_geom_triangle_prop': ['g2_geom_triangle_prop', 'g2_geom_triangle_fig'],
  'g2_quad_all': ['g2_quad_parallelogram', 'g2_quad_special'],
  'g2_quad_parallelogram': ['g2_quad_parallelogram'],
  'g2_quad_special': ['g2_quad_special'],
  // ★ データの活用・確率
  'g2_prob_all': ['g2_prob_dice_coin', 'g2_prob_balls', 'g2_data_boxplot', 'g2_data_boxplot_svg'],
  'g2_prob_dice_coin': ['g2_prob_dice_coin'],
  'g2_prob_balls': ['g2_prob_balls'],
  'g2_data_boxplot': ['g2_data_boxplot', 'g2_data_boxplot_svg'],

  // --- 中3 ---
  'g3_all_mix': ['g3_poly_expand_formula', 'g3_poly_common_factor', 'g3_poly_factor_formula', 'g3_poly_value_calc', 'g3_sqrt_meaning', 'g3_sqrt_simplify', 'g3_sqrt_mul_div', 'g3_sqrt_add_sub', 'g3_qeq_factor_method', 'g3_qeq_formula_method', 'g3_qeq_word', 'g3_qfunc_graph', 'g3_qfunc_domain', 'g3_qfunc_rate_change', 'g3_sim_ratio', 'g3_sim_triangle_fig', 'g3_sim_area_volume', 'g3_circle_angle', 'g3_circle_angle_fig', 'g3_pyth_calc', 'g3_pyth_triangle_fig', 'g3_pyth_special_ratios', 'g3_sample_estimation'],
  'g3_poly_all': ['g3_poly_expand_formula', 'g3_poly_common_factor', 'g3_poly_factor_formula', 'g3_poly_value_calc'],
  'g3_poly_expand_formula': ['g3_poly_expand_formula'],
  'g3_poly_common_factor': ['g3_poly_common_factor'],
  'g3_poly_factor_formula': ['g3_poly_factor_formula'],
  'g3_poly_value_calc': ['g3_poly_value_calc'],
  'g3_sqrt_all': ['g3_sqrt_meaning', 'g3_sqrt_simplify', 'g3_sqrt_mul_div', 'g3_sqrt_add_sub'],
  'g3_sqrt_meaning': ['g3_sqrt_meaning'],
  'g3_sqrt_simplify': ['g3_sqrt_simplify'],
  'g3_sqrt_mul_div': ['g3_sqrt_mul_div'],
  'g3_sqrt_add_sub': ['g3_sqrt_add_sub'],
  'g3_qeq_all': ['g3_qeq_factor_method', 'g3_qeq_formula_method', 'g3_qeq_word'],
  'g3_qeq_factor_method': ['g3_qeq_factor_method'],
  'g3_qeq_formula_method': ['g3_qeq_formula_method'],
  'g3_qeq_word': ['g3_qeq_word'],
  'g3_qfunc_all': ['g3_qfunc_graph', 'g3_qfunc_domain', 'g3_qfunc_rate_change'],
  'g3_qfunc_graph': ['g3_qfunc_graph'],
  'g3_qfunc_domain': ['g3_qfunc_domain'],
  'g3_qfunc_rate_change': ['g3_qfunc_rate_change'],
  // ★ 相似は相似のみを厳密指定！図形SVGも含む！
  'g3_sim_all': ['g3_sim_ratio', 'g3_sim_triangle_fig', 'g3_sim_area_volume'],
  'g3_sim_ratio': ['g3_sim_ratio', 'g3_sim_triangle_fig'],
  'g3_sim_area_volume': ['g3_sim_area_volume'],
  'g3_circle_all': ['g3_circle_angle', 'g3_circle_angle_fig'],
  'g3_circle_angle': ['g3_circle_angle', 'g3_circle_angle_fig'],
  'g3_pyth_all': ['g3_pyth_calc', 'g3_pyth_triangle_fig', 'g3_pyth_special_ratios'],
  'g3_pyth_calc': ['g3_pyth_calc', 'g3_pyth_triangle_fig'],
  'g3_pyth_special_ratios': ['g3_pyth_special_ratios'],
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
    const genFn = problemGenerators[key] || problemGenerators['g1_pos_neg_add_sub'];
    const item = genFn();

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


// 中学数学科 板書＆展開例 授業データベース（B4横見開きプリント完全対応）
// 明治図書『板書＆展開例でよくわかる 365日の全授業』シリーズ準拠
// ========================================================
const boardLessonDatabase = {
  "1": {
    "gradeLabel": "第1学年",
    "units": [
      {
        "id": "u_1_3",
        "unitName": "第3章 一次方程式",
        "totalHours": 8,
        "bookRef": "",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQC4gcHZTgFoRoBOL7FbI00uAYAo4hpgqWuZtjHhb4r7J_0?e=Ak1hV9",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "方程式とその解の意味",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "方程式と解の意味を理解し、代入によって等式を成り立たせる数を確かめることができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "文字式の計算",
                  "content": "$3x + 2$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "1個 $x$ 円のりんご3個と100円のかごを買ったら代金が 700円だった。方程式に表そう。",
                  "guide": "代金の合計を表す式をつくって、700 とイコール（＝）で結ぼう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$3x + 100 = 700$。$x = 200$ を代入すると等式が成り立つね。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "方程式と解",
                  "content": "文字に当てはめる値によって成り立ったり成り立たなかったりする等式を <strong>方程式</strong>、等式を成り立たせる文字の値をその <strong>解</strong> という。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次のうち、方程式 $2x - 3 = 7$ の解はどれですか。<br>2, $\\quad$ 4, $\\quad$ 5",
                  "answer": "$x = 5$ （$2 \\times 5 - 3 = 7$ となり等式が成り立つ）",
                  "spaceHeight": 70
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "ある数 $x$ の 4倍から 5をひいた数は 15である。方程式をつくりなさい。",
                  "answer": "$4x - 5 = 15$",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 2,
            "title": "等式の性質（天びんのつり合い）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "等式の4つの性質（両辺に同じ数を足す・引く・かける・割る）を理解する。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "天びんのイメージ",
                  "content": "つり合っている天びんの両皿に同じ重さを足してもつり合いは保たれる"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "天びんのつり合いをもとに、$x + 5 = 12$ から $x =$ の形を導くにはどうすればよいか？",
                  "guide": "両方の皿から 5 を取りのぞけば、$x$ だけが残るね！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x + 5 - 5 = 12 - 5 \\implies x = 7$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "等式の4つの性質",
                  "content": "$A = B$ ならば<br>① $A + C = B + C$（両辺に同じ数を加えても成り立つ）<br>② $A - C = B - C$（両辺から同じ数を引いても成り立つ）<br>③ $AC = BC$（両辺に同じ数をかけても成り立つ）<br>④ $\\frac{A}{C} = \\frac{B}{C}$（両辺を同じ数で割っても成り立つ）"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "等式の性質を使って解きなさい。<br>(1) $x - 6 = 2$<br>(2) $5x = 35$<br>(3) $\\frac{x}{3} = 4$",
                  "answer": "(1) 両辺に 6 を加えて $x = 8$<br>(2) 両辺を 5 で割って $x = 7$<br>(3) 両辺に 3 をかけて $x = 12$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 3,
            "title": "等式の性質を使った方程式の解き方",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "等式の性質を組み合わせて、一次方程式をシステマティックに解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "前時の確認",
                  "content": "加減と乗除の性質の順序: 先に足し引きを整理する！"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "方程式 $3x + 2 = 14$ は、どの順番で等式の性質を使えば解けるだろうか？",
                  "guide": "① まず両辺から 2 を引く ➔ ② そのあと両辺を 3 で割る！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$3x = 14 - 2 \\implies 3x = 12 \\implies x = 4$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "解き方のステップ",
                  "content": "① まず $x$ を含まない数（定数項）を反対側に移す。<br>② $x$ の係数で両辺を割る！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の一次方程式を解きなさい。<br>(1) $2x + 5 = 11$<br>(2) $4x - 7 = 9$<br>(3) $-3x + 8 = -4$",
                  "answer": "(1) $2x = 6 \\implies x = 3$<br>(2) $4x = 16 \\implies x = 4$<br>(3) $-3x = -12 \\implies x = 4$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 4,
            "title": "移項を使った一次方程式の解き方",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "「移項（いこう）」の仕組みを理解し、符号を変えて反対側の辺に移すことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "等式の性質",
                  "content": "$x + 5 = 8 \\iff x = 8 - 5$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$5x - 4 = 2x + 5$ のように両辺に $x$ があるとき、どう変形すれば解けるか？",
                  "guide": "文字の項を左辺に、数の項を右辺に集めよう！符号が変わるよ。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$5x - 2x = 5 + 4 \\implies 3x = 9 \\implies x = 3$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "移項のルール",
                  "content": "一方の辺にある項を、<strong>符号を変えて</strong>他方の辺に移すことを <strong>移項</strong> という。<br>左辺に文字の項、右辺に数の項を集めて $ax = b$ の形にする！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "移項を使って次の一次方程式を解きなさい。<br>(1) $7x - 5 = 4x + 7$<br>(2) $3x + 8 = 5x - 2$",
                  "answer": "(1) $7x - 4x = 7 + 5 \\implies 3x = 12 \\implies x = 4$<br>(2) $3x - 5x = -2 - 8 \\implies -2x = -10 \\implies x = 5$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (注意)",
                  "text": "移項するときの符号のミスに注意して解きなさい。<br>$2x - 9 = -3x + 1$",
                  "answer": "$2x + 3x = 1 + 9 \\implies 5x = 10 \\implies x = 2$",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 5,
            "title": "かっこを含む一次方程式",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "分配法則を使ってカッコをはずし、同類項を整理して一次方程式を解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "分配法則",
                  "content": "$3(x - 2) = 3x - 6, \\quad -(2x - 1) = -2x + 1$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "方程式 $4(x - 3) = 2x + 6$ を解く手順を考えよう。",
                  "guide": "まず分配法則でカッコをはずしてから移項しよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$4x - 12 = 2x + 6 \\implies 4x - 2x = 6 + 12 \\implies 2x = 18 \\implies x = 9$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "かっこ付き方程式の手順",
                  "content": "① 分配法則でカッコをはずす（符号に特に注意！）。<br>② 文字の項を左辺、数の項を右辺に移項する。<br>③ $ax = b$ の形にして両辺を $a$ で割る。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の一次方程式を解きなさい。<br>(1) $3(x + 2) = 15$<br>(2) $5(x - 1) = 2(x + 5)$<br>(3) $2x - (x - 3) = 7$",
                  "answer": "(1) $3x + 6 = 15 \\implies 3x = 9 \\implies x = 3$<br>(2) $5x - 5 = 2x + 10 \\implies 3x = 15 \\implies x = 5$<br>(3) $2x - x + 3 = 7 \\implies x = 4$",
                  "spaceHeight": 85
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 6,
            "title": "小数や分数を含む一次方程式",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "両辺に10や100をかけたり、分母の公倍数をかけて係数を整数にして解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "等式の性質",
                  "content": "両辺に同じ数をかけても等式は成り立つ！"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "方程式 $\\frac{x - 1}{2} = \\frac{x + 2}{3}$ を簡単に解くにはどうすればよいか？",
                  "guide": "分母の 2 と 3 の最小公倍数である 6 を両辺にまるごとかけてみよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$3(x - 1) = 2(x + 2) \\implies 3x - 3 = 2x + 4 \\implies x = 7$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "分数・小数の処理",
                  "content": "・小数は両辺を 10倍、100倍して整数にする。<br>・分数は <strong>分母の最小公倍数を両辺にかける</strong>！<br>分子が多項式のときはカッコをつけてからかけること！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の一次方程式を解きなさい。<br>(1) $0.3x - 0.5 = 0.1x + 0.7$<br>(2) $\\frac{2}{3}x - 1 = \\frac{1}{2}x$",
                  "answer": "(1) 両辺10倍: $3x - 5 = x + 7 \\implies 2x = 12 \\implies x = 6$<br>(2) 両辺6倍: $4x - 6 = 3x \\implies x = 6$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$\\frac{x + 1}{4} = \\frac{2x - 3}{5}$ を解きなさい。",
                  "answer": "両辺20倍: $5(x + 1) = 4(2x - 3) \\implies 5x + 5 = 8x - 12 \\implies -3x = -17 \\implies x = \\frac{17}{3}$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 7,
            "title": "一次方程式の利用①（代金・個数・過不足）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文章題の数量関係を捉えて方程式をつくり、解が適切か確かめることができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "代金の公式",
                  "content": "単価 $\\times$ 個数 ＝ 合計金額"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "1個 120円のりんごと1個 80円のオレンジを合わせて 10個買い、代金が 1040円だった。りんごの個数は？",
                  "guide": "りんごを $x$ 個とおくと、オレンジは $(10 - x)$ 個だね。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$120x + 80(10 - x) = 1040 \\implies 120x + 800 - 80x = 1040 \\implies 40x = 240 \\implies x = 6$ 個。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "文章題の解き方4ステップ",
                  "content": "① 求めたい数量を文字 $x$ で表す。<br>② 数量の等しい関係を見つけて方程式をつくる。<br>③ 方程式を解く。<br>④ 解が問題の条件（正の整数など）に適しているか確かめる。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "生徒に折り紙を配る。1人に 4枚ずつ配ると 9枚余り、5枚ずつ配ると 6枚たりない。生徒の人数を求めなさい。",
                  "answer": "生徒を $x$ 人とおくと、折り紙の枚数は $4x + 9 = 5x - 6 \\implies -x = -15 \\implies x = 15$ 人。",
                  "spaceHeight": 80
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 8,
            "title": "一次方程式の利用②（速さ・道のり・割合）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "速さ・時間・道のりの関係や割合を文字式で表し、一次方程式を立てて解決できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "み・は・じ",
                  "content": "時間 ＝ 道のり $\\div$ 速さ"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "家から駅まで分速 60m で歩くと、分速 180m で自転車で行くより 20分多くかかった。家から駅までの道のりは？",
                  "guide": "道のりを $x\\text{m}$ とおいて、「かかった時間の差が 20分」という方程式をつくろう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$\\frac{x}{60} - \\frac{x}{180} = 20 \\implies 3x - x = 3600 \\implies 2x = 3600 \\implies x = 1800\\text{m}$。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "速さの問題のポイント",
                  "content": "・時間を表す式（$\\frac{\\text{道のり}}{\\text{速さ}}$）を作って等式にする。<br>・単位（分速と分、時速と時間、mとkm）がそろっているか必ずチェック！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "A地点から B地点まで往復した。行きは時速 4km で歩き、帰りは時速 12km で走ったら、往復で 4時間かかった。AB間の道のりを求めなさい。",
                  "answer": "道のりを $x\\text{km}$ とおくと $\\frac{x}{4} + \\frac{x}{12} = 4 \\implies 3x + x = 48 \\implies 4x = 48 \\implies x = 12\\text{km}$。",
                  "spaceHeight": 85
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "章の総まとめ",
                  "text": "一次方程式の解き方と利用のステップを振り返り、学習のまとめをノートに記述しよう。",
                  "answer": "移項・カッコ・分数・文章題の立式を完全にマスター！",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "2": {
    "gradeLabel": "第2学年",
    "units": [
      {
        "id": "u_2_3",
        "unitName": "第3章 一次関数",
        "totalHours": 10,
        "bookRef": "",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCGShIQnCM6Ro_fEPW9OmVhAUe0_xiCbUTJC7fY-2_AnUI?e=XJU1aJ",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "一次関数の意味 (y=ax+b)",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "$y$ が $x$ の一次式 $y = ax + b$ で表される関数を一次関数と理解できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "1年の復習",
                  "content": "比例: $y = ax$, $\\quad$ 反比例: $y = \\frac{a}{x}$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "長さ $15\\text{cm}$ のろうそくに火をつけると、1分間に $0.5\\text{cm}$ ずつ短くなる。$x$ 分後の長さを $y\\text{cm}$ として式に表そう。",
                  "guide": "$x$ 分間に短くなる長さは $0.5x\\text{cm}$ だね。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$y = 15 - 0.5x$ （または $y = -0.5x + 15$）"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "一次関数の定義",
                  "content": "<strong>$y = ax + b$</strong>（$a, b$ は定数、$a \\neq 0$）の形で表されるとき、$y$ は $x$ の <strong>一次関数</strong> であるという。<br>$b = 0$ のとき比例 $y = ax$ となる（比例は一次関数の特別な場合）。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次のうち、$y$ が $x$ の一次関数であるものをすべて選びなさい。<br>(1) $y = 3x - 5$<br>(2) $y = \\frac{6}{x}$<br>(3) $y = 4x$",
                  "answer": "(1) と (3)。(2)は反比例なので一次関数ではない。",
                  "spaceHeight": 70
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "底面の半径が $x\\text{cm}$ の円の面積 $y\\text{cm}^2$ は一次関数ですか。理由も答えなさい。",
                  "answer": "一次関数ではない。式が $y = \\pi x^2$ となり $x$ の2次式になるため。",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 2,
            "title": "一次関数の変化の割合",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "変化の割合の意味を理解し、一次関数では変化の割合が一定で $a$ に等しいことを捉える。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "表の読み取り",
                  "content": "$x$ が 1 増えるごとに $y$ は一定の数ずつ増える"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "一次関数 $y = 2x + 1$ で、$x$ の値が 1 から 4 まで増加するとき、変化の割合を調べよう。",
                  "guide": "変化の割合 ＝ $\\frac{y \\text{の増加量}}{x \\text{の増加量}}$ を計算してみよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x$ の増加量: $4 - 1 = 3$, $y$ の増加量: $9 - 3 = 6$。変化の割合: $\\frac{6}{3} = 2$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "変化の割合",
                  "content": "<strong>変化の割合 ＝ $\\frac{y \\text{の増加量}}{x \\text{の増加量}}$ ＝ $a$（一定！）</strong><br>一次関数 $y = ax + b$ では、どの区間をとっても変化の割合は常に $a$ になる。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "一次関数 $y = -3x + 4$ について答えなさい。<br>(1) 変化の割合を答えなさい。<br>(2) $x$ の値が 1 から 5 まで増加するときの $x$ の増加量と $y$ の増加量を求めなさい。",
                  "answer": "(1) $-3$<br>(2) $x$ の増加量: $5-1=4$, $y$ の増加量: $-3 \\times 4 = -12$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "一次関数 $y = 5x - 2$ で、$x$ が 3 増加するとき $y$ はどれだけ増加するか。",
                  "answer": "$5 \\times 3 = 15$ 増加する。",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 3,
            "title": "一次関数のグラフと傾き・切片",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "一次関数のグラフが直線になること、および傾き $a$ と切片 $b$ の幾何学的意味を理解する。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "比例のグラフ",
                  "content": "$y = ax$ は原点を通る直線"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$y = 2x + 3$ のグラフは、$y = 2x$ のグラフと比べてどのような位置関係にあるだろうか？",
                  "guide": "同じ $x$ の値に対する $y$ の値を比べると、すべて 3 だけ上にずれているね！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$y = 2x$ のグラフを $y$ 軸の正の方向に 3 だけ平行移動した直線。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "グラフの傾きと切片",
                  "content": "一次関数 $y = ax + b$ のグラフは、<strong>傾き $a$、切片 $b$ の直線</strong>。<br>・切片 $b$: $y$ 軸と交わる点の $y$ 座標 $(0, b)$<br>・傾き $a$: 右に 1 進んだときの上下の変化量"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の直線の傾きと切片を答えなさい。<br>(1) $y = 4x - 5$<br>(2) $y = -\\frac{2}{3}x + 1$",
                  "answer": "(1) 傾き: 4, 切片: $-5$<br>(2) 傾き: $-\\frac{2}{3}$, 切片: 1",
                  "spaceHeight": 70
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "直線 $y = -2x + 4$ が $x$ 軸、$y$ 軸と交わる点の座標をそれぞれ求めなさい。",
                  "answer": "$y$ 軸との交点: $(0, 4)$, $\\quad x$ 軸との交点 ($y=0$): $(2, 0)$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 4,
            "title": "一次関数のグラフのかき方",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "切片と傾きを利用して、方眼紙上にすばやく正確に直線のグラフをかくことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "傾きの読み方",
                  "content": "傾きが $\\frac{3}{2}$ ➔ 右へ 2、上へ 3 進む"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "直線 $y = -\\frac{3}{4}x + 2$ のグラフを、最も手際よくかくにはどうすればよいだろうか？",
                  "guide": "① まず切片 $(0, 2)$ に点をとる！ ② 傾き $-\\frac{3}{4}$ だから、右へ 4、下へ 3 進んだ点を見つける！",
                  "thinkingSpaceHeight": 85,
                  "answer": "点 $(0, 2)$ と点 $(4, -1)$ を直線で結ぶ。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "グラフのかき方手順",
                  "content": "① $y$ 軸上に切片 $(0, b)$ をとる。<br>② その点から傾き（分母だけ右、分子だけ上/下）に従って2つ目の点をとる。<br>③ 2点を通る直線をまっすぐ引く！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "graph-block",
                "data": {
                  "qNum": "問 1",
                  "text": "直線 $y = \\frac{2}{3}x - 1$ のグラフをかきなさい。",
                  "answer": "切片 $(0, -1)$ から右へ 3、上へ 2 進んだ点 $(3, 1)$ を通る直線。",
                  "svgHtml": ""
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 5,
            "title": "直線の式の求め方①（傾きと1点、変化の割合と1点）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "傾き（変化の割合）と通る1点の座標から、一次関数の式を求めることができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "基本形",
                  "content": "直線の式: $y = ax + b$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "傾きが $-2$ で、点 $(3, 1)$ を通る直線の式を求めよう。",
                  "guide": "傾きが $-2$ だから $y = -2x + b$ とおけるね。通る点の座標 $(3, 1)$ を代入しよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$1 = -2 \\times 3 + b \\implies 1 = -6 + b \\implies b = 7$。答: $y = -2x + 7$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "傾きと1点からの決定",
                  "content": "① 傾き $a$ をあてはめて $y = ax + b$ とおく。<br>② 点 $(x_1, y_1)$ を代入して方程式を解き、切片 $b$ を求める！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の直線の式を求めなさい。<br>(1) 傾きが 3 で、点 $(2, 5)$ を通る直線<br>(2) 変化の割合が $-4$ で、点 $(1, -2)$ を通る直線",
                  "answer": "(1) $y = 3x - 1$<br>(2) $y = -4x + 2$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (表現パターン)",
                  "text": "$x$ が 1 増加するとき $y$ は 2 増加し、点 $(3, 8)$ を通る直線の式を求めなさい。",
                  "answer": "傾きが 2 なので $y = 2x + b$。代入して $8 = 6 + b \\implies b = 2$。答: $y = 2x + 2$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 6,
            "title": "直線の式の求め方②（2点を通る直線、平行な直線）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "通る2点の座標から傾きを計算して式を求め、平行な直線の条件を活用できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "傾きの公式",
                  "content": "傾き $a = \\frac{y_2 - y_1}{x_2 - x_1}$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "2点 $(1, 3)$ と $(3, 7)$ を通る直線の式を求めよう。",
                  "guide": "方法A: 2点から傾きを計算する。 方法B: 2点の座標を代入して連立方程式で解く！",
                  "thinkingSpaceHeight": 90,
                  "answer": "傾き: $\\frac{7 - 3}{3 - 1} = \\frac{4}{2} = 2$。$y = 2x + b$ に $(1, 3)$ を代入して $b = 1$。答: $y = 2x + 1$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "2点を通る直線",
                  "content": "・2直線が平行 ➔ <strong>傾き $a$ が等しい</strong>！<br>・2点を通る直線は「傾きを求めてから代入」または「連立方程式」で確実に求まる。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "2点 $(-2, -5)$、$(2, 3)$ を通る直線の式を求めなさい。",
                  "answer": "傾き: $\\frac{3 - (-5)}{2 - (-2)} = \\frac{8}{4} = 2$。$y = 2x + b$ に代入して $b = -1$。答: $y = 2x - 1$",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (平行条件)",
                  "text": "直線 $y = -3x + 1$ に平行で、点 $(2, -4)$ を通る直線の式を求めなさい。",
                  "answer": "平行なので傾きは $-3$。$y = -3x + b$ に代入して $-4 = -6 + b \\implies b = 2$。答: $y = -3x + 2$",
                  "spaceHeight": 70
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 7,
            "title": "二元一次方程式 ax+by=c のグラフ",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二元一次方程式 $ax+by=c$ を $y = mx+n$ の形に変形し、そのグラフが直線であることを理解する。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "等式の変形",
                  "content": "$2x + y = 6 \\implies y = -2x + 6$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "方程式 $2x - 3y = 6$ の解を座標とする点の集まりは、どんな図形になるだろうか？",
                  "guide": "$y$ について解いて、一次関数の形に直してみよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$-3y = -2x + 6 \\implies y = \\frac{2}{3}x - 2$。傾き $\\frac{2}{3}$、切片 $-2$ の直線になる！"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "方程式のグラフ",
                  "content": "二元一次方程式 $ax + by = c$ のグラフは直線になる！<br>・$y =$ の形に変形して傾きと切片を読み取る。<br>・$x = k$ は $y$ 軸に平行な直線、$y = k$ は $x$ 軸に平行な直線。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の方程式を $y$ について解き、傾きと切片を答えなさい。<br>(1) $3x + y = 5$<br>(2) $4x - 2y = 8$",
                  "answer": "(1) $y = -3x + 5$ (傾き: $-3$, 切片: 5)<br>(2) $-2y = -4x + 8 \\implies y = 2x - 4$ (傾き: 2, 切片: $-4$)",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "方程式 $x = 3$ および $y = -2$ のグラフの特徴を答えなさい。",
                  "answer": "$x = 3$: 点 $(3, 0)$ を通り $y$ 軸に平行な直線。 $y = -2$: 点 $(0, -2)$ を通り $x$ 軸に平行な直線。",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 8,
            "title": "連立方程式の解と2直線の交点",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "2直線の交点の座標が、その2式を連立方程式としたときの解と一致することを捉える。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "連立方程式",
                  "content": "2つの式を同時に成り立たせる文字の値の組"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "2つの直線 $y = x + 1$ と $y = -x + 5$ の交点の座標は、グラフをかかずにどう計算できるだろうか？",
                  "guide": "交点は両方の直線上にあるから、2つの式を連立方程式として解けばいいね！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x + 1 = -x + 5 \\implies 2x = 4 \\implies x = 2$。$y = 3$。交点の座標は $(2, 3)$。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "グラフの交点と連立方程式",
                  "content": "<strong>2直線の交点の座標 ＝ 連立方程式の解 $(x, y)$</strong><br>代入法や加減法で解くことで、グラフ用紙の目盛りに頼らず正確な交点が得られる！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の2直線の交点の座標を求めなさい。<br>$y = 2x - 1$, $\\quad y = -x + 5$",
                  "answer": "$2x - 1 = -x + 5 \\implies 3x = 6 \\implies x = 2$。$y = 3$。答: $(2, 3)$",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "2直線 $x + y = 4$ と $2x - y = 5$ の交点を求めなさい。",
                  "answer": "足し算して $3x = 9 \\implies x = 3$。$y = 1$。答: $(3, 1)$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 9,
            "title": "一次関数の利用①（具体的な事象の数量関係）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "水槽の給水や通話料金など身の回りの事象を一次関数としてモデル化し、問題を解決できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "モデル化の手順",
                  "content": "初期値 ＝ 切片 $b$, $\\quad$ 単位あたりの変化量 ＝ 傾き $a$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "水が $10\\text{L}$ 入っている水槽に、毎分 $3\\text{L}$ の割合で水を入れる。$x$ 分後の水量を $y\\text{L}$ として、$y$ を $x$ の式で表し、$28\\text{L}$ になる時間を求めよう。",
                  "guide": "切片は $10$、変化の割合は $3$ だね。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$y = 3x + 10$。$y = 28$ を代入: $28 = 3x + 10 \\implies 3x = 18 \\implies x = 6$ 分後。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "文章題の立式",
                  "content": "「初めの量」が切片 $b$、「1あたり増える（減る）量」が傾き $a$ になる！<br>$x$ や $y$ の変域にも気を配ろう。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "標高が $100\\text{m}$ 上がるごとに気温は $0.6^\\circ\\text{C}$ 下がる。地上の気温が $20^\\circ\\text{C}$ のとき、標高 $x\\text{m}$ の気温を $y^\\circ\\text{C}$ として式に表し、標高 $1500\\text{m}$ の気温を求めなさい。",
                  "answer": "$y = 20 - 0.006x$。$x=1500$ を代入して $y = 20 - 9 = 11^\\circ\\text{C}$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "容量 $50\\text{L}$ の水槽が満水になるのは何分後ですか。（課題の水槽）",
                  "answer": "$50 = 3x + 10 \\implies 3x = 40 \\implies x = \\frac{40}{3}$ 分後 (13分20秒後)",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 10,
            "title": "一次関数の利用②（動点と面積の変化、ダイヤグラム）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "図形上を動く点（動点）による三角形の面積の変化を、変域ごとに場合分けして式とグラフで表せる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "三角形の面積",
                  "content": "$S = \\frac{1}{2} \\times \\text{底辺} \\times \\text{高さ}$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "長方形 ABCD（AB=4cm, BC=6cm）の辺上を、点 P が毎秒 1cm で A から B を通って C まで動く。$x$ 秒後の $\\triangle\\text{APD}$ の面積 $y$ を式に表そう。",
                  "guide": "P が辺 AB 上にあるとき（$0 \\le x \\le 4$）と、辺 BC 上にあるとき（$4 \\le x \\le 10$）で場合分けしよう！",
                  "thinkingSpaceHeight": 90,
                  "answer": "・$0 \\le x \\le 4$: 底辺 $AD=6$, 高さ $AP=x$ より $y = \\frac{1}{2} \\times 6 \\times x = 3x$\n・$4 \\le x \\le 10$: 底辺 $AD=6$, 高さは常に $AB=4$ 一定より $y = \\frac{1}{2} \\times 6 \\times 4 = 12$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "動点問題の解法",
                  "content": "点 P がどの辺上にあるかで <strong>変域を区切る</strong>！<br>変域ごとに底辺と高さを $x$ で表して式を作り、折れ線のグラフで変化を可視化しよう。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "課題の動点問題について、$\\triangle\\text{APD}$ の面積が $9\\text{cm}^2$ になるのは何秒後か求めなさい。",
                  "answer": "$0 \\le x \\le 4$ のとき $3x = 9 \\implies x = 3$ 秒後。",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "章の総まとめ",
                  "text": "一次関数の「表」「式」「グラフ」の相互のつながりを振り返ってまとめよう。",
                  "answer": "傾き・切片・変化の割合・交点がすべて連動していることを確認！",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          }
        ]
      }
    ]
  },
  "3": {
    "gradeLabel": "第3学年",
    "units": [
      {
        "id": "u_3_1",
        "unitName": "第1章 多項式・展開と因数分解",
        "totalHours": 11,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "多項式と単項式の乗法・除法",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "分配法則を利用して、多項式と単項式の乗法・除法を正確に計算できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "1・2年の復習",
                  "content": "分配法則: $a(b+c) = ab + ac$, $\\quad (a+b) \\div c = \\frac{a}{c} + \\frac{b}{c}$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "たて $2x$、横 $x + 3y$ の長方形の面積はどのように表せるだろうか？",
                  "guide": "2つの小さな長方形の面積の和として計算してみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$2x(x + 3y) = 2x^2 + 6xy$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "多項式と単項式の計算",
                  "content": "カッコの中の <strong>すべての項に単項式をかける（または割る）</strong>。<br>符号のミス（特にマイナスで割るとき）に注意する！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の計算をしなさい。<br>(1) $3a(2a - b)$<br>(2) $(4x^2 - 6xy) \\div 2x$",
                  "answer": "(1) $6a^2 - 3ab$<br>(2) $2x - 3y$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (発展)",
                  "text": "次の式を展開して整理しなさい。<br>$x(x + 2) + 2x(x - 3)$",
                  "answer": "$x^2 + 2x + 2x^2 - 6x = 3x^2 - 4x$",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 2,
            "title": "多項式どうしの乗法 (a+b)(c+d)",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "多項式どうしの積 $(a+b)(c+d)$ を、面積図や文字の置き換えを用いて展開できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "前時のふりかえり",
                  "content": "$M(c+d) = Mc + Md$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "たて $a+b$、横 $c+d$ の長方形の面積は、どのように表せるだろうか？",
                  "guide": "4つの小さな長方形の面積の和として表してみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$(a+b)(c+d) = ac + ad + bc + bd$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "多項式の展開の基本",
                  "content": "$(a+b)(c+d) = ac + ad + bc + bd$<br>一方のカッコの各項に、他方の各項をもれなくかけて同類項をまとめる！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の式を展開しなさい。<br>(1) $(x + 2)(y + 3)$<br>(2) $(2x - 1)(x + 4)$",
                  "answer": "(1) $xy + 3x + 2y + 6$<br>(2) $2x^2 + 8x - x - 4 = 2x^2 + 7x - 4$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$(a - 3)(b - 2)$ を展開しなさい。符号に注意！",
                  "answer": "$ab - 2a - 3b + 6$",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 3,
            "title": "乗法公式① (x+a)(x+b) の展開",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "乗法公式 $(x+a)(x+b) = x^2 + (a+b)x + ab$ を理解し、素早く計算できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "展開の基本",
                  "content": "$(x+2)(x+3) = x^2 + 3x + 2x + 6 = x^2 + 5x + 6$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$(x+a)(x+b)$ を展開したとき、$x$ の係数と定数項にはどんな決まりがあるだろうか？",
                  "guide": "$x$ の係数は $a$ と $b$ の「和」、定数項は「積」になっているね！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$(x+a)(x+b) = x^2 + (a+b)x + ab$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "乗法公式 1",
                  "title": "(x+a)(x+b) の公式",
                  "content": "<strong>$(x+a)(x+b) = x^2 + (\\text{和})x + (\\text{積})$</strong><br>符号を含めて和と積を暗算で計算しよう！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "公式を利用して、次の式を展開しなさい。<br>(1) $(x + 3)(x + 4)$<br>(2) $(x - 5)(x + 2)$<br>(3) $(a - 6)(a - 3)$",
                  "answer": "(1) $x^2 + 7x + 12$<br>(2) $x^2 - 3x - 10$<br>(3) $a^2 - 9a + 18$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (注意)",
                  "text": "$(x - 7)(x + 7)$ を公式①を使って展開してみよう。",
                  "answer": "$x^2 + 0x - 49 = x^2 - 49$",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 4,
            "title": "乗法公式② (a+b)², (a-b)² 平方の公式",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "平方の乗法公式を展開の意味から導き、正しく活用できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "公式の確認",
                  "content": "$(a+b)^2 = (a+b)(a+b)$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "1辺が $a+b$ の正方形の面積を、4つの部分に分けて考えてみよう。",
                  "guide": "面積は $a^2$ が1個、$b^2$ が1個、$ab$ が2個あるね！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$(a+b)^2 = a^2 + 2ab + b^2$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "乗法公式 2",
                  "title": "平方の公式",
                  "content": "<strong>$(a+b)^2 = a^2 + 2ab + b^2$</strong><br><strong>$(a-b)^2 = a^2 - 2ab + b^2$</strong><br>真ん中の項は「2倍の積」！符号に注意！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の式を展開しなさい。<br>(1) $(x + 5)^2$<br>(2) $(x - 4)^2$<br>(3) $(2a + 3)^2$",
                  "answer": "(1) $x^2 + 10x + 25$<br>(2) $x^2 - 8x + 16$<br>(3) $4a^2 + 12a + 9$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (つまずき注意)",
                  "text": "次の計算の間違いを直しなさい。<br>誤: $(x - 6)^2 = x^2 - 36$",
                  "answer": "正: $x^2 - 12x + 36$ (真ん中の項 $-2ab$ が抜けており、最後は正)",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 5,
            "title": "乗法公式③ (a+b)(a-b) & 式の展開の工夫（置き換え）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "和と差の積の公式を活用し、共通部分を文字でおく工夫して展開できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "前時の公式確認",
                  "content": "$(M+2)(M-5) = M^2 - 3M - 10$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "式 $(a+b+2)(a+b-5)$ を展開するにはどうすればよいだろうか？共通な部分を見つけて工夫しよう。",
                  "guide": "着眼点: $a+b$ がどちらのカッコにもあるね。1つのまとまり $M$ とおいてみよう。",
                  "thinkingSpaceHeight": 90,
                  "answer": "$(M+2)(M-5) = M^2 - 3M - 10 = (a+b)^2 - 3(a+b) - 10 = a^2 + 2ab + b^2 - 3a - 3b - 10$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "置き換えによる工夫のポイント",
                  "content": "式の中に同じまとまりがあるときは、それを <strong>1つの文字 $M$</strong> とおくことで、乗法公式にあてはめて簡単に展開できる！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1 (確かめ)",
                  "text": "置き換えを利用して展開しなさい。<br>$(x + y + 3)(x + y - 3)$",
                  "answer": "$x+y=M$ とおくと $(M+3)(M-3) = M^2 - 9 = (x+y)^2 - 9 = x^2 + 2xy + y^2 - 9$",
                  "spaceHeight": 70
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (発展に挑戦)",
                  "text": "$(a - b + 2)^2$ を展開しなさい。",
                  "answer": "$a-b=M$ とおくと $(M+2)^2 = M^2 + 4M + 4 = a^2 - 2ab + b^2 + 4a - 4b + 4$",
                  "spaceHeight": 70
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 6,
            "title": "因数分解の意味と共通因数のくくり出し",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "因数分解が「展開の逆」であることを理解し、共通因数をくくり出すことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "分配法則",
                  "content": "$m(a+b) = ma + mb$ 展開 ⇄ 因数分解"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "多項式 $ax + ay$ を、いくつかの式の積の形に変形するにはどうすればよいだろうか？",
                  "guide": "各項に共通してかけられている因数（共通因数）に着目しよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$ax + ay = a(x + y)$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "共通因数のくくり出し",
                  "content": "多項式の各項に共通な因数があるときは、カッコの外にくくり出す！<br><strong>最大の共通因数</strong>を確実にくくり出すことがポイント。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の式を因数分解しなさい。<br>(1) $mx + my$<br>(2) $2ab - 4b^2$<br>(3) $6x^2y + 9xy^2$",
                  "answer": "(1) $m(x + y)$<br>(2) $2b(a - 2b)$<br>(3) $3xy(2x + 3y)$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (注意)",
                  "text": "$3x^2 - 6x$ を因数分解しなさい。<br>※ $3(x^2 - 2x)$ では不十分！",
                  "answer": "$3x(x - 2)$",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 7,
            "title": "乗法公式による因数分解① x²+(a+b)x+ab",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "和と積の組み合わせを見つけて、$x^2+(a+b)x+ab = (x+a)(x+b)$ の因数分解ができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "乗法公式の復習",
                  "content": "$(x+a)(x+b) = x^2 + (a+b)x + ab$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$x^2 + 5x + 6$ を積の形にするには、$a, b$ をどのように見つければよいだろうか？",
                  "guide": "かけて 6、たして 5 になる 2つの数を探そう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "積が 6: (1, 6), (2, 3) ➔ 和が 5 になるのは 2 と 3！ 答: $(x+2)(x+3)$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "因数分解の手順",
                  "content": "① まず定数項の <strong>積</strong> になる2数のペアを考える。<br>② その中から、真ん中の <strong>和</strong> になるペアを選ぶ！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の式を因数分解しなさい。<br>(1) $x^2 + 7x + 10$<br>(2) $x^2 - 5x + 6$<br>(3) $x^2 - x - 12$",
                  "answer": "(1) $(x + 2)(x + 5)$<br>(2) $(x - 2)(x - 3)$<br>(3) $(x - 4)(x + 3)$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$x^2 - 8x - 20$ を因数分解しなさい。",
                  "answer": "$(x - 10)(x + 2)$",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 8,
            "title": "乗法公式による因数分解② 平方の公式・平方の差",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "平方の公式や平方の差の公式を利用して、すばやく正確に因数分解できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "公式の確認",
                  "content": "$(a+b)^2 = a^2+2ab+b^2, \\quad (a+b)(a-b) = a^2-b^2$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "多項式 $x^2 - 16$ や $x^2 + 6x + 9$ の形の特徴を見抜いて因数分解しよう。",
                  "guide": "両端が「2乗」になっていることに着目しよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x^2 - 16 = (x+4)(x-4)$, $\\quad x^2 + 6x + 9 = (x+3)^2$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "平方の因数分解公式",
                  "content": "<strong>$a^2 + 2ab + b^2 = (a+b)^2$</strong><br><strong>$a^2 - 2ab + b^2 = (a-b)^2$</strong><br><strong>$a^2 - b^2 = (a+b)(a-b)$</strong>"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の式を因数分解しなさい。<br>(1) $x^2 + 12x + 36$<br>(2) $x^2 - 10x + 25$<br>(3) $x^2 - 49$",
                  "answer": "(1) $(x + 6)^2$<br>(2) $(x - 5)^2$<br>(3) $(x + 7)(x - 7)$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (発展)",
                  "text": "$4x^2 - 25y^2$ を因数分解しなさい。",
                  "answer": "$(2x + 5y)(2x - 5y)$",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 9,
            "title": "因数分解の工夫（くくり出し＋公式、置き換え）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "共通因数をくくり出してから公式を使ったり、置き換えを利用して因数分解できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "手順の原則",
                  "content": "因数分解の第1ステップ: まず「共通因数」がないか調べる！"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$2x^2 + 8x + 6$ や $(x-1)^2 - 4$ はどのように因数分解できるだろうか？",
                  "guide": "① まず共通因数 2 をくくり出す！ ② カッコの中を公式で因数分解！",
                  "thinkingSpaceHeight": 90,
                  "answer": "$2(x^2 + 4x + 3) = 2(x+1)(x+3)$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "発展因数分解の鉄則",
                  "content": "① まず <strong>共通因数をくくり出す</strong>。<br>② 残ったカッコの中を <strong>乗法公式で因数分解</strong> する。<br>③ 共通なカタマリは $M$ とおく！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の式を因数分解しなさい。<br>(1) $3x^2 - 12$<br>(2) $2x^2 - 12x + 18$",
                  "answer": "(1) $3(x^2 - 4) = 3(x + 2)(x - 2)$<br>(2) $2(x^2 - 6x + 9) = 2(x - 3)^2$",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (置き換え)",
                  "text": "$(x + y)^2 - 4(x + y) + 3$ を因数分解しなさい。",
                  "answer": "$x+y=M$ とおくと $M^2 - 4M + 3 = (M - 1)(M - 3) = (x + y - 1)(x + y - 3)$",
                  "spaceHeight": 70
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 10,
            "title": "式の計算の利用①（数の性質の証明、計算の工夫）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文字式を利用して連続する整数の性質を証明し、乗法公式で大きな数を工夫して計算できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "整数の表し方",
                  "content": "偶数: $2n$, $\\quad$ 奇数: $2n+1$, $\\quad$ 連続する2整数: $n, n+1$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "「連続する2つの奇数の積に1を加えた数は、偶数の2乗になる。」ことを証明しよう。",
                  "guide": "奇数を $2n-1, 2n+1$ とおいて、計算式を作ってみよう。",
                  "thinkingSpaceHeight": 90,
                  "answer": "$(2n-1)(2n+1) + 1 = 4n^2 - 1 + 1 = 4n^2 = (2n)^2$。$2n$ は偶数なので偶数の2乗となる。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "証明の流れ",
                  "content": "① 文字を使って数量を表す。<br>② 問題の通りに式を作って計算・変形する。<br>③ 結論の形（(偶数)² など）に合わせてまとめる！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1 (計算の工夫)",
                  "text": "公式を利用して、次の計算をしなさい。<br>(1) $102^2$<br>(2) $53^2 - 47^2$",
                  "answer": "(1) $(100 + 2)^2 = 10000 + 400 + 4 = 10404$<br>(2) $(53 + 47)(53 - 47) = 100 \\times 6 = 600$",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "連続する2つの偶数の積に1を加えると奇数の2乗になることを証明しなさい。",
                  "answer": "$2n(2n+2)+1 = 4n^2+4n+1 = (2n+1)^2$ より奇数の2乗となる。",
                  "spaceHeight": 70
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 11,
            "title": "式の計算の利用②（図形の性質の証明、道幅と面積 S=aℓ）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "図形の面積や道のりの関係を文字式で表し、$S = a\\ell$ が成り立つことを証明できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "円の公式",
                  "content": "円の面積: $S = \\pi r^2$, $\\quad$ 円周の長さ: $\\ell = 2\\pi r$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "半径 $r$ の円形の池のまわりに幅 $a$ の道がある。道の面積を $S$、道の真ん中を通る円周を $\\ell$ とするとき、$S = a\\ell$ となることを証明しよう。",
                  "guide": "① $S = \\text{(外側の円)} - \\text{(内側の円)}$ を計算。 ② $\\ell$ を求めて $a\\ell$ を計算し比べる！",
                  "thinkingSpaceHeight": 90,
                  "answer": "$S = \\pi(r+a)^2 - \\pi r^2 = 2\\pi ar + \\pi a^2 = a(2\\pi r + \\pi a)$。真ん中の円の半径は $r + \\frac{a}{2}$ だから $\\ell = 2\\pi(r + \\frac{a}{2}) = 2\\pi r + \\pi a$。よって $S = a\\ell$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "図形の性質の証明",
                  "content": "左辺 $S$ と右辺 $a\\ell$ をそれぞれ文字式で表し、<strong>計算結果が一致すること</strong>を示すことで証明完了！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "1辺が $p$ の正方形の花だんのまわりに幅 $a$ の道がある。道の面積 $S$ は $S = a\\ell$ となることを確かめなさい。",
                  "answer": "$S = (p+2a)^2 - p^2 = 4ap + 4a^2$。道の真ん中の周長 $\\ell = 4(p+a) = 4p+4a$。よって $a\\ell = a(4p+4a) = S$",
                  "spaceHeight": 85
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "章のまとめ",
                  "text": "第1章で学んだ展開・因数分解の公式をノートに総整理しよう。",
                  "answer": "4大公式と因数分解の手順を確実にマスター！",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "u_3_2",
        "unitName": "第2章 平方根",
        "totalHours": 7,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "平方根の意味と根号（√）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "2乗すると $a$ になる数を平方根といい、根号 $\\sqrt{\\phantom{a}}$ を使って表すことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "2乗の計算",
                  "content": "$3^2 = 9, \\quad (-3)^2 = 9$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "面積が $5\\text{cm}^2$ の正方形の1辺の長さはどのように表せばよいだろうか？",
                  "guide": "2乗して 5 になる数は整数や分数では表せないね。記号 $\\sqrt{\\phantom{a}}$（ルート）を使おう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "1辺の長さは $\\sqrt{5}\\text{cm}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "平方根と根号",
                  "content": "2乗して $a$ になる数を <strong>$a$ の平方根</strong>という。<br>正の数の平方根は正と負の2つあり、$\\pm\\sqrt{a}$ と表す。例: 9の平方根は $\\pm 3$"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の数の平方根を答えなさい。<br>(1) 25<br>(2) 0.16<br>(3) $\\frac{4}{9}$<br>(4) 7",
                  "answer": "(1) $\\pm 5$<br>(2) $\\pm 0.4$<br>(3) $\\pm \\frac{2}{3}$<br>(4) $\\pm \\sqrt{7}$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (注意)",
                  "text": "$\\sqrt{16}$ と「16の平方根」の違いを説明しなさい。",
                  "answer": "$\\sqrt{16} = 4$ (正の方のみ)。「16の平方根」は $\\pm 4$ (2乗して16になる数すべて)。",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 2,
            "title": "有理数と無理数・平方根の大小",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数を有理数と無理数に分類し、平方根の大小関係を不等号を使って表すことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "数の分類",
                  "content": "分数 $\\frac{b}{a}$ で表せる数 ＝ 有理数"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$\\sqrt{7}$ と 3 はどちらが大きいだろうか？不等号で比べよう。",
                  "guide": "両方を2乗して根号の中の数で比べてみよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$(\\sqrt{7})^2 = 7$, $3^2 = 9$。$7 < 9$ より $\\sqrt{7} < 3$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "有理数・無理数と大小",
                  "content": "分数で表せない数（$\\sqrt{2}, \\pi$ など）を <strong>無理数</strong>という。<br>$a < b$ ならば $\\sqrt{a} < \\sqrt{b}$（2乗して比べる）"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の各組の数の大小を不等号で表しなさい。<br>(1) $\\sqrt{15}, \\quad 4$<br>(2) $-\\sqrt{5}, \\quad -\\sqrt{6}$",
                  "answer": "(1) $4 = \\sqrt{16}$ より $\\sqrt{15} < 4$<br>(2) 負の数なので $-\\sqrt{5} > -\\sqrt{6}$",
                  "spaceHeight": 70
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "次のうち無理数をすべて選びなさい。<br>$-\\frac{1}{3}, \\quad \\sqrt{9}, \\quad \\sqrt{10}, \\quad \\pi, \\quad 0.25$",
                  "answer": "$\\sqrt{10}, \\quad \\pi$ (※ $\\sqrt{9}=3$ は有理数)",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 3,
            "title": "平方根の乗法と除法・根号の変形 (a√b)",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "$\\sqrt{a}\\sqrt{b} = \\sqrt{ab}$ を理解し、根号の中をできるだけ簡単な数に変形（$a\\sqrt{b}$）できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "根号の性質",
                  "content": "$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}, \\quad \\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$\\sqrt{12}$ や $\\sqrt{72}$ を、もっと簡単な根号の形に表すにはどうすればよいだろうか？",
                  "guide": "素因数分解して、2乗のペアをルートの外に出そう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$\\sqrt{12} = \\sqrt{4 \\times 3} = \\sqrt{2^2 \\times 3} = 2\\sqrt{3}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "根号の変形 $a\\sqrt{b}$",
                  "content": "根号の中に2乗の因数があれば、根号の外に出す！<br>$\\sqrt{a^2 b} = a\\sqrt{b}$。素因数分解を活用しよう。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "根号の中をできるだけ簡単な整数にしなさい。<br>(1) $\\sqrt{18}$<br>(2) $\\sqrt{48}$<br>(3) $\\sqrt{72}$",
                  "answer": "(1) $3\\sqrt{2}$<br>(2) $4\\sqrt{3}$<br>(3) $6\\sqrt{2}$",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "次の計算をしなさい。<br>(1) $\\sqrt{6} \\times \\sqrt{10}$<br>(2) $\\sqrt{54} \\div \\sqrt{3}$",
                  "answer": "(1) $\\sqrt{60} = 2\\sqrt{15}$<br>(2) $\\sqrt{18} = 3\\sqrt{2}$",
                  "spaceHeight": 65
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 4,
            "title": "分母の有理化",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "分母に根号を含まない形に変形する「分母の有理化」の仕組みを理解し計算できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "分数の性質",
                  "content": "分母と分子に同じ数をかけても分数の大きさは変わらない"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "数 $\\frac{1}{\\sqrt{2}}$ の分母から根号をなくすには、どうすればよいだろうか？",
                  "guide": "分母と分子の両方に $\\sqrt{2}$ をかけてみよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$\\frac{1}{\\sqrt{2}} = \\frac{1 \\times \\sqrt{2}}{\\sqrt{2} \\times \\sqrt{2}} = \\frac{\\sqrt{2}}{2}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "分母の有理化",
                  "content": "分母にある根号と同じ数を、<strong>分母と分子の両方にかける</strong>！<br>$\\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}$。約分ができる場合は最後まで約分する！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "分母を有理化しなさい。<br>(1) $\\frac{3}{\\sqrt{5}}$<br>(2) $\\frac{6}{\\sqrt{3}}$<br>(3) $\\frac{\\sqrt{3}}{\\sqrt{8}}$",
                  "answer": "(1) $\\frac{3\\sqrt{5}}{5}$<br>(2) $\\frac{6\\sqrt{3}}{3} = 2\\sqrt{3}$ (約分！)<br>(3) $\\frac{\\sqrt{3}}{2\\sqrt{2}} = \\frac{\\sqrt{6}}{4}$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$\\frac{12}{\\sqrt{6}}$ を有理化して簡単にしなさい。",
                  "answer": "$\\frac{12\\sqrt{6}}{6} = 2\\sqrt{6}$",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 5,
            "title": "平方根の加法と減法（同類項の整理）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "根号の中が同じ数を同類項のようにまとめて加法・減法の計算ができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "文字式の加法",
                  "content": "$2x + 3x = 5x$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "式 $2\\sqrt{3} + 4\\sqrt{3}$ や $\\sqrt{12} + \\sqrt{27}$ はどのように計算できるだろうか？",
                  "guide": "$\\sqrt{3}$ を文字 $x$ のようにみなそう！ $\\sqrt{12}$ や $\\sqrt{27}$ はまず $a\\sqrt{b}$ に直す！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$2\\sqrt{3} + 4\\sqrt{3} = 6\\sqrt{3}$, $\\quad \\sqrt{12} + \\sqrt{27} = 2\\sqrt{3} + 3\\sqrt{3} = 5\\sqrt{3}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "加減計算の鉄則",
                  "content": "① まず根号の中をできるだけ簡単にする（$a\\sqrt{b}$ に直す）。<br>② <strong>根号の中が同じものどうし</strong>を分配法則でまとめる！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の計算をしなさい。<br>(1) $5\\sqrt{2} - 2\\sqrt{2}$<br>(2) $\\sqrt{20} + \\sqrt{45}$<br>(3) $\\sqrt{48} - \\sqrt{27} + \\sqrt{12}$",
                  "answer": "(1) $3\\sqrt{2}$<br>(2) $2\\sqrt{5} + 3\\sqrt{5} = 5\\sqrt{5}$<br>(3) $4\\sqrt{3} - 3\\sqrt{3} + 2\\sqrt{3} = 3\\sqrt{3}$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (注意)",
                  "text": "$\\sqrt{2} + \\sqrt{3} = \\sqrt{5}$ は正しいですか？理由も答えなさい。",
                  "answer": "誤り。根号の中が異なるためこれ以上足すことはできない。",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 6,
            "title": "乗法公式を利用した平方根の計算",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "分配法則や乗法公式を活用して、根号を含む複雑な四則計算ができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "乗法公式",
                  "content": "$(a+b)(a-b) = a^2 - b^2, \\quad (a+b)^2 = a^2+2ab+b^2$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$(\\sqrt{5} + \\sqrt{2})(\\sqrt{5} - \\sqrt{2})$ や $(\\sqrt{3} + 2)^2$ を展開して計算しよう。",
                  "guide": "乗法公式の文字の部分に根号の数をあてはめてみよう！ $(\\sqrt{5})^2 = 5$ だね。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$(\\sqrt{5})^2 - (\\sqrt{2})^2 = 5 - 2 = 3$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "公式利用のポイント",
                  "content": "根号の2乗は根号がはずれる！ $(\\sqrt{a})^2 = a$<br>公式を使って展開してから、整数どうし・根号どうしをまとめる。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の計算をしなさい。<br>(1) $(\\sqrt{7} + 2)(\\sqrt{7} - 2)$<br>(2) $(\\sqrt{5} + 1)^2$<br>(3) $(\\sqrt{6} - \\sqrt{2})^2$",
                  "answer": "(1) $(\\sqrt{7})^2 - 2^2 = 7 - 4 = 3$<br>(2) $5 + 2\\sqrt{5} + 1 = 6 + 2\\sqrt{5}$<br>(3) $6 - 2\\sqrt{12} + 2 = 8 - 4\\sqrt{3}$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$\\sqrt{2}(\\sqrt{6} + \\sqrt{10})$ を計算しなさい。",
                  "answer": "$\\sqrt{12} + \\sqrt{20} = 2\\sqrt{3} + 2\\sqrt{5}$",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 7,
            "title": "平方根の利用（近似値、黄金比、図形への利用）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "平方根の近似値を利用して現実の問題を解決し、正方形や図形の辺の長さを求められる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "近似値の確認",
                  "content": "$\\sqrt{2} \\approx 1.414, \\quad \\sqrt{3} \\approx 1.732, \\quad \\sqrt{5} \\approx 2.236$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "$\\sqrt{2} = 1.414$ とするとき、$\\sqrt{200}$ と $\\sqrt{0.02}$ の近似値を求めよう。",
                  "guide": "$\\sqrt{200} = \\sqrt{100 \\times 2} = 10\\sqrt{2}$ に着目しよう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$\\sqrt{200} = 10 \\times 1.414 = 14.14$, $\\quad \\sqrt{0.02} = \\frac{\\sqrt{2}}{10} = 0.1414$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "近似値の求め方",
                  "content": "根号の中を $100$ や $10000$（$10^2, 100^2$）の積・商に変形して、ルートの外に $10$ や $\\frac{1}{10}$ を出して計算する！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "$\\sqrt{3} = 1.732$ とするとき、次の値を求めなさい。<br>(1) $\\sqrt{300}$<br>(2) $\\sqrt{27}$<br>(3) $\\frac{3}{\\sqrt{3}}$",
                  "answer": "(1) $10\\sqrt{3} = 17.32$<br>(2) $3\\sqrt{3} = 3 \\times 1.732 = 5.196$<br>(3) $\\sqrt{3} = 1.732$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "章末問題",
                  "text": "面積が $30\\text{m}^2$ の正方形の敷地がある。1辺の長さはおよそ何mか。",
                  "answer": "$\\sqrt{30}\\text{m}$。$5^2=25, 6^2=36$ より約 $5.5\\text{m}$",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          }
        ]
      },
      {
        "id": "u_3_3",
        "unitName": "第3章 2次方程式",
        "totalHours": 6,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "2次方程式の意味とその解",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "未知数の2乗を含む2次方程式の意味を理解し、方程式を成り立たせる解を見つけられる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "1次方程式",
                  "content": "$2x + 3 = 7 \\implies x = 2$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "正方形の1辺を $2\\text{cm}$ 長くしたら、面積が $36\\text{cm}^2$ になった。もとの1辺の長さ $x$ は？",
                  "guide": "方程式 $(x+2)^2 = 36$ を作って、$x$ に当てはまる数を探してみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x+2 = 6 \\implies x = 4\\text{cm}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "2次方程式と解",
                  "content": "整理して $ax^2 + bx + c = 0$ の形になる方程式を <strong>2次方程式</strong>という。<br>一般に解は2つある！（正負や異なる解）"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の数のうち、2次方程式 $x^2 - 3x - 4 = 0$ の解であるものをすべて選びなさい。<br>$-2, \\quad -1, \\quad 1, \\quad 4$",
                  "answer": "$x = -1$ と $x = 4$ を代入すると等式が成り立つため解である。",
                  "spaceHeight": 75
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$x^2 = 16$ の解をすべて答えなさい。",
                  "answer": "$x = \\pm 4$",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 2,
            "title": "平方根の考え方による解き方 (x+m)²=n",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "平方根の考え方を利用して、$x^2 = k$ や $(x+m)^2 = n$ の2次方程式を解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "平方根",
                  "content": "$X^2 = 9 \\implies X = \\pm 3$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "2次方程式 $(x - 3)^2 = 5$ はどのように解けばよいだろうか？",
                  "guide": "$x - 3$ をひとまとまり $X$ とみて平方根をとろう！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x - 3 = \\pm \\sqrt{5} \\implies x = 3 \\pm \\sqrt{5}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "平方根による解法",
                  "content": "$(x+m)^2 = n$ の形を作れば、<br>$x+m = \\pm\\sqrt{n} \\implies x = -m \\pm \\sqrt{n}$ で一発で解ける！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の2次方程式を解きなさい。<br>(1) $x^2 - 7 = 0$<br>(2) $2x^2 = 18$<br>(3) $(x + 2)^2 = 9$",
                  "answer": "(1) $x = \\pm \\sqrt{7}$<br>(2) $x^2 = 9 \\implies x = \\pm 3$<br>(3) $x + 2 = \\pm 3 \\implies x = 1, -5$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$(x - 4)^2 = 7$ を解きなさい。",
                  "answer": "$x = 4 \\pm \\sqrt{7}$",
                  "spaceHeight": 50
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 3,
            "title": "因数分解による解き方 (AB=0)",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "「$AB=0$ ならば $A=0$ または $B=0$」の性質を理解し、因数分解で解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "因数分解",
                  "content": "$x^2 - 5x + 6 = (x-2)(x-3)$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "方程式 $(x - 2)(x - 3) = 0$ を成り立たせる $x$ の値は何だろうか？",
                  "guide": "2つの式をかけて 0 になるのだから、どちらかが 0 になればいいね！",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x - 2 = 0$ または $x - 3 = 0$。よって $x = 2, 3$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "因数分解による解法",
                  "content": "① 右辺を必ず 0 にする（$ax^2+bx+c=0$）。<br>② 左辺を因数分解して $(x-p)(x-q)=0$ とする。<br>③ 答: $x = p, q$（重解のときは1つ）"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "次の2次方程式を解きなさい。<br>(1) $(x - 5)(x + 1) = 0$<br>(2) $x^2 - 7x + 12 = 0$<br>(3) $x^2 + 6x + 9 = 0$",
                  "answer": "(1) $x = 5, -1$<br>(2) $(x-3)(x-4)=0 \\implies x = 3, 4$<br>(3) $(x+3)^2=0 \\implies x = -3$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2 (注意)",
                  "text": "$x^2 - 6x = 0$ を解きなさい。両辺を $x$ で割ってはダメ！",
                  "answer": "$x(x - 6) = 0 \\implies x = 0, 6$",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 4,
            "title": "2次方程式の解の公式の導出と計算",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "2次方程式の解の公式を理解し、因数分解できない方程式を確実に解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "平方完成",
                  "content": "$x^2 + 2mx = (x+m)^2 - m^2$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "因数分解できない $x^2 + 3x - 1 = 0$ を解くにはどうすればよいだろうか？",
                  "guide": "平方完成の考え方を使って一般の $ax^2+bx+c=0$ から公式を導こう！",
                  "thinkingSpaceHeight": 90,
                  "answer": "$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "解の公式",
                  "title": "2次方程式の解の公式",
                  "content": "<strong>$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$</strong><br>どんな2次方程式でも必ず解ける万能の公式！$a, b, c$ を正しく代入しよう。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "解の公式を使って解きなさい。<br>(1) $x^2 + 3x - 1 = 0$<br>(2) $2x^2 + 5x + 1 = 0$",
                  "answer": "(1) $x = \\frac{-3 \\pm \\sqrt{9 - 4(1)(-1)}}{2} = \\frac{-3 \\pm \\sqrt{13}}{2}$<br>(2) $x = \\frac{-5 \\pm \\sqrt{25 - 8}}{4} = \\frac{-5 \\pm \\sqrt{17}}{4}$",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$3x^2 - 7x + 2 = 0$ を解きなさい。",
                  "answer": "$x = \\frac{7 \\pm \\sqrt{49 - 24}}{6} = \\frac{7 \\pm 5}{6} \\implies x = 2, \\frac{1}{3}$",
                  "spaceHeight": 60
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 5,
            "title": "2次方程式の解き方のまとめ・適した解法の選択",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "因数分解・平方根・解の公式の中から、最も適した解法を選んですばやく解くことができる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "3つの解法",
                  "content": "① 平方根の利用 $\\quad$ ② 因数分解 $\\quad$ ③ 解の公式"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "いろいろな2次方程式を見て、どの解法が最も簡単か判断基準を整理しよう。",
                  "guide": "まず因数分解できるかチェック！できなければ解の公式を使おう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "判断順序: ① $x^2=k$ ➔ 平方根、② 因数分解できる ➔ 因数分解、③ それ以外 ➔ 解の公式"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "解法選びのチャート",
                  "content": "まず左辺を因数分解できるか試す！<br>因数分解できれば最も速い。できそうにないときは迷わず解の公式！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "適した方法で次の2次方程式を解きなさい。<br>(1) $x^2 - 9x = 0$<br>(2) $x^2 - 4x - 5 = 0$<br>(3) $x^2 - 4x + 1 = 0$",
                  "answer": "(1) $x(x-9)=0 \\implies x = 0, 9$ (因数分解)<br>(2) $(x-5)(x+1)=0 \\implies x = 5, -1$ (因数分解)<br>(3) $x = \\frac{4 \\pm \\sqrt{16-4}}{2} = 2 \\pm \\sqrt{3}$ (解の公式)",
                  "spaceHeight": 85
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "問 2",
                  "text": "$(x - 2)^2 - 16 = 0$ を簡単に解きなさい。",
                  "answer": "$(x-2)^2 = 16 \\implies x-2 = \\pm 4 \\implies x = 6, -2$",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          },
          {
            "hour": 6,
            "title": "2次方程式の利用（数・図形・動点の問題）",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "具体的な事象から数量関係を2次方程式に表し、解が問題に適しているかを吟味できる。"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "文章題の手順",
                  "content": "① 求めるものを $x$ とおく $\\implies$ ② 方程式をつくる $\\implies$ ③ 解を吟味する"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "大小2つの自然数がある。差が 3 で積が 28 であるとき、この2つの数を求めよう。",
                  "guide": "小さい方を $x$ とおくと、大きい方は $x+3$ だね。$x(x+3) = 28$ を解こう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "$x^2+3x-28=0 \\implies (x+7)(x-4)=0 \\implies x=-7, 4$。自然数なので $x=4$。2数は 4 と 7。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "解の吟味（ぎんみ）の重要性",
                  "content": "2次方程式の2つの解のうち、長さや個数は <strong>正の数</strong> でなければならない。<br>問題文の条件（自然数、正の数など）に合っているか必ず確かめる！"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "横がたてより $4\\text{cm}$ 長い長方形の紙がある。面積が $45\\text{cm}^2$ であるとき、たての長さを求めなさい。",
                  "answer": "たてを $x\\text{cm}$ とおくと $x(x+4) = 45 \\implies x^2+4x-45=0 \\implies (x+9)(x-5)=0$。$x > 0$ よりたては $5\\text{cm}$。",
                  "spaceHeight": 80
                }
              },
              {
                "type": "question",
                "data": {
                  "qNum": "章の総まとめ",
                  "text": "2次方程式の文章題で解を吟味する理由をまとめなさい。",
                  "answer": "数学の計算上は負の解も出るが、現実の長さや個数に負の数はないから。",
                  "spaceHeight": 55
                }
              },
              {
                "type": "reflection",
                "data": {
                  "title": "本時の自己評価 & 振り返り"
                }
              }
            ]
          }
        ]
      }
    ]
  }
};

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
function loadBoardLessonPreset(grade, unitId, hour, isInitialLoad = false) {
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

  if (!isInitialLoad) {
    showToast('<i class="fa-solid fa-wand-magic-sparkles text-primary"></i> 【' + unit.unitName + ' 第' + lesson.hour + '時】の板書テンプレートを展開しました');
  }
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
function selectB4Grade(grade, isInitialLoad = false) {
  currentB4Grade = String(grade);
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('b4GradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentB4Grade === g);
  });
  updateB4UnitDropdown();
  applyB4LessonSelection(isInitialLoad);
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
function applyB4LessonSelection(isInitialLoad = false) {
  loadBoardLessonPreset(currentB4Grade, currentB4UnitId, currentB4Hour, isInitialLoad);
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
