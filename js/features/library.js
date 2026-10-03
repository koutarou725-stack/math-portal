// ==========================================
// // 公式数学学習プリント & 書籍教材ライブラリ

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

// ==========================================
// // 板書・展開例ライブラリ 描画

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

// ==========================================
// // 中学数学科 板書＆展開例 授業データベース（B4横見開きプリント完全対応）
// 明治図書『板書＆展開例でよくわかる 365日の全授業』シリーズ準拠

// ==========================================
// // TAB 7: 📚 教材資料室 (デジタルライブラリ) ロジック

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

// ==========================================
// // 『ひとつひとつわかりやすく』＆『数学学習プリント』分析に基づく
// 多彩な問い方ジェネレーター（穴埋め・つまずき・工夫・文章題）