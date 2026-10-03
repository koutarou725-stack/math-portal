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
// // トースト通知（画面右下の保存完了メッセージ）
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
// // Googleスプレッドシート連携（クラウド自動同期）

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