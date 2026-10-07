// ==========================================
// 教材・書籍 OneDrive クラウド共有リンク設定（オンライン完全対応）
// 先生のOneDrive共有URLにより、Webブラウザ上からどこでも直接PDFを参照可能
// ==========================================
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

  // 定期考査設定（次回テスト日・カウントダウン管理）
  examSettings: loadStorage('math_portal_exam_settings', {
    examName: '2学期 中間考査',
    examDate: '2026-10-23',
    targetSubject: '数学'
  }),

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
  
  memos: loadStorage('math_portal_memos', [
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
    },
    {
      id: 3,
      unit: '中2: 連立方程式（加減法）',
      date: '2026/09/10',
      points: '係数を揃えた後の引き算で、下段の式の符号変え忘れが頻発。下段の符号を○で囲んで赤字で書き直す手順を徹底させた。',
      timing: '符号変えの練習に10分追加してちょうど良かった。',
      nextYear: '引き算ではなく「符号を変えて足す」指導法を最初から提示する方が定着が良い。'
    },
    {
      id: 4,
      unit: '中3: 二次方程式（解の公式）',
      date: '2026/09/05',
      points: 'ルートの中の計算 b² - 4ac で、負の数の2乗と -4ac の符号処理でミスが多い。',
      timing: '解の公式のリズム暗記に5分、代入のみの練習に15分。',
      nextYear: '公式代入の1行目は計算せず、カッコをつけてそのまま書かせること。'
    }
  ])
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

// グローバルスコープにも確実に登録（複数ファイル間共有）
if (typeof window !== 'undefined') {
  window.state = state;
  window.CLOUD_DOC_LINKS = CLOUD_DOC_LINKS;
  window.defaultBellSettings = defaultBellSettings;
  window.defaultTermsList = defaultTermsList;
  window.defaultBaseTimetables = defaultBaseTimetables;
  window.defaultOverrides = defaultOverrides;
  window.createEmptyBaseTimetable = createEmptyBaseTimetable;
  window.loadStorage = loadStorage;
  window.extractGradeFromClassName = extractGradeFromClassName;
}