// ==========================================
// // PDCAメモの保存

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
// // 授業用タイマー

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