// ==========================================
// 時間割マネージャー (3層構造システム)
// ==========================================
// 3層時間割: サブビュー切り替え

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

function goToLessonPrep(className, subjectName, lessonPlan = '', dateStr = '', period = '') {
  let grade = extractGradeFromClassName(className) || '3';
  const key = (dateStr && period) ? `${dateStr}_${period}` : '';
  const printRefs = state.lessonPlanPrintRefs || JSON.parse(localStorage.getItem('math_portal_lesson_plan_prints') || '{}');
  const printRef = key ? printRefs[key] : null;

  switchTab('worksheet');

  if (printRef && printRef.grade && printRef.unitId) {
    selectB4Grade(printRef.grade);
    loadBoardLessonPreset(printRef.grade, printRef.unitId, printRef.hour || 1);
    showToast(`📄 紐付けられた第${printRef.hour}時の授業プリントを開きました`);
  } else {
    state.editingLessonPlan = { className, subjectName, dateStr, period };
    jumpToWorksheetFromSlot();
  }
}

function jumpToWorksheetFromSlot() {
  let className = state.editingLessonPlan ? (state.editingLessonPlan.className || '') : '';
  let grade = extractGradeFromClassName(className);
  const input = document.getElementById('lessonPlanInput');
  const planKeyword = (input ? input.value : (state.editingLessonPlan ? state.editingLessonPlan.planKeyword || '' : '')).trim();

  // もしモーダルで授業プリントが選択されていればダイレクトに開く
  const selectedPrint = state.editingLessonPlan?.selectedPrintRef;
  const slotKey = (state.editingLessonPlan?.dateStr && state.editingLessonPlan?.period) ? `${state.editingLessonPlan.dateStr}_${state.editingLessonPlan.period}` : '';
  const printRefs = state.lessonPlanPrintRefs || JSON.parse(localStorage.getItem('math_portal_lesson_plan_prints') || '{}');
  const directRef = selectedPrint || (slotKey ? printRefs[slotKey] : null);

  if (directRef && directRef.grade && directRef.unitId) {
    closeLessonPlanModal();
    switchTab('worksheet');
    selectB4Grade(directRef.grade);
    loadBoardLessonPreset(directRef.grade, directRef.unitId, directRef.hour || 1);
    showToast(`📄 授業プリント（第${directRef.hour}時）を開きました`);
    return;
  }

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
// 実時間割・今日の一コマ・週送り・スロット編集 (app.legacy.js から移植)
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
  renderExamCountdownBar();
  updateHeroExamStatus();

  thead.innerHTML = `
    <tr>
      <th class="time-col">校時</th>
      ${weekDays.map(w => {
        const override = state.dateOverrides[w.dateStr];
        const activeClass = w.isToday ? 'col-active' : '';
        return `
          <th class="${activeClass} ${override ? 'th-has-override' : ''}">
            <div class="tt-header-date-wrap">
              <span>${w.month}/${w.date} (${w.dayName})</span>
              ${override ? `<span class="override-dot" title="${escapeHtml(override.memo || '特時・校時振替日課あり')}"></span>` : ''}
            </div>
          </th>
        `;
      }).join('')}
    </tr>
    <tr class="tt-header-event-row">
      <th class="time-col event-label-col">行事・特時</th>
      ${weekDays.map(w => {
        const override = state.dateOverrides[w.dateStr];
        const memoVal = override?.memo || '';
        return `
          <th class="event-input-col ${w.isToday ? 'col-active' : ''}">
            <input type="text" class="tt-header-event-input ${memoVal ? 'has-memo' : ''}" 
                   value="${escapeHtml(memoVal)}" 
                   placeholder="行事メモ…" 
                   onchange="updateTimetableDayMemo('${w.dateStr}', this.value)" 
                   title="${w.month}/${w.date}の行事・特時メモ（入力で自動保存）">
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
              <div class="tt-cell-meta-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <span class="${isShiftBadge ? 'override-badge' : 'slot-code-badge'}" style="margin: 0;">${badgeText}</span>
                ${slot.subject ? `<span class="tt-subject-badge" style="margin: 0;">${escapeHtml(slot.subject)}</span>` : ''}
              </div>
              ${slot.class ? `<div class="tt-class-name">${escapeHtml(slot.class)}</div>` : ''}
            </div>

            <!-- 週案・学習内容入力枠 (クリックで予定を打てる) -->
            <div class="tt-lesson-plan" onclick="openLessonPlanModal('${w.dateStr}', ${t.p}, '${escapeHtml(slot.class)}', '${escapeHtml(slot.subject)}')" title="クリックしてこの時間の学習予定・単元名を入力">
              <div class="lesson-plan-text ${currentPlan ? '' : 'placeholder'}">
                ${currentPlan ? `<i class="fa-solid fa-book-open" style="font-size: 0.65rem; margin-right: 2px;"></i>${escapeHtml(currentPlan)}` : '＋ 予定入力'}
              </div>
            </div>

            ${isMath ? `
              <div class="tt-actions">
                <button class="tt-action-btn" onclick="goToLessonPrep('${escapeHtml(slot.class)}', '${escapeHtml(slot.subject)}', '${escapeHtml(currentPlan)}', '${w.dateStr}', ${t.p})" title="この時間の授業プリントを作成">
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
// 時間割ヘッダー直接入力: 行事・特時メモ
// ------------------------------------------
function updateTimetableDayMemo(dateStr, value) {
  const memo = (value || '').trim();
  if (!state.dateOverrides[dateStr]) {
    state.dateOverrides[dateStr] = {
      memo: memo,
      slots: {}
    };
  } else {
    state.dateOverrides[dateStr].memo = memo;
  }

  // メモが空かつ振替スロットも空ならオブジェクトを削除
  const cur = state.dateOverrides[dateStr];
  const hasSlots = cur.slots && Object.keys(cur.slots).some(k => cur.slots[k] && cur.slots[k] !== 'none');
  if (!memo && !hasSlots) {
    delete state.dateOverrides[dateStr];
  }

  localStorage.setItem('math_portal_date_overrides', JSON.stringify(state.dateOverrides));
  showToast(memo ? `📌 ${memo} を保存しました` : '行事メモをクリアしました');
  renderRealTimetableGrid();
  triggerAutoCloudSync();
}

// ------------------------------------------
// 特時・校時振替 ＆ 祝日・お休みマネージャー (複数週スクロール対応)
// ------------------------------------------
function openDayOverrideModal() {
  const modal = document.getElementById('dayOverrideModal');
  const weekDays = getWeekDays(state.currentWeekOffset);
  
  const rangeText = document.getElementById('overrideWeekRangeText');
  if (rangeText) {
    rangeText.textContent = `${weekDays[0].month}月${weekDays[0].date}日(${weekDays[0].dayName})〜 の特時・校時振替とお休み設定`;
  }

  // 今週から向こう6週間分（約1ヶ月半、月またぎ対応）を生成
  renderMultiWeekOverride(6);
  modal.classList.remove('hidden');
}

function closeDayOverrideModal() {
  document.getElementById('dayOverrideModal').classList.add('hidden');
}

function renderMultiWeekOverride(numberOfWeeks = 6) {
  const container = document.getElementById('weekOverrideColumnsContainer');
  if (!container) return;

  const daysOptions = [
    { code: 'mon', label: '月', num: 1 },
    { code: 'tue', label: '火', num: 2 },
    { code: 'wed', label: '水', num: 3 },
    { code: 'thu', label: '木', num: 4 },
    { code: 'fri', label: '金', num: 5 }
  ];

  const specialOptions = [
    { code: 'special_総合', label: '総合' },
    { code: 'special_学活', label: '学活' },
    { code: 'special_道徳', label: '道徳' },
    { code: 'special_行事', label: '行事' },
    { code: 'special_学年', label: '学年' },
    { code: 'special_自習', label: '自習' },
    { code: 'none', label: '（カット/空欄）' }
  ];

  const holidayPresets = [
    { label: '授業あり', val: '' },
    { label: 'お休み', val: 'お休み' }
  ];

  let allSectionsHtml = '';

  for (let wIdx = 0; wIdx < numberOfWeeks; wIdx++) {
    const offset = state.currentWeekOffset + wIdx;
    const weekDays = getWeekDays(offset);
    const isCurrentWeek = (wIdx === 0);

    let tbodyRowsHtml = '';

    weekDays.forEach(w => {
      const existing = state.dateOverrides[w.dateStr];
      const isToday = w.isToday;

      // 既存のメモがお休みか、またはコマがすべて none か
      const existingMemo = existing?.memo || '';
      const isAllCut = existing?.slots && Object.keys(existing.slots).length >= 5 && Object.values(existing.slots).every(v => v === 'none');
      const isHoliday = (existingMemo === 'お休み' || existingMemo.includes('休') || existingMemo.includes('祝') || isAllCut);
      const matchedHoliday = isHoliday ? 'お休み' : '';

      // お休みセレクトボックス（授業あり / お休みのシンプル2択）
      let holidayOpts = holidayPresets.map(h => 
        `<option value="${h.val}" ${h.val === matchedHoliday ? 'selected' : ''}>${h.label}</option>`
      ).join('');

      let periodTds = '';
      for (let p = 1; p <= 6; p++) {
        const currentVal = existing?.slots ? existing.slots[p] : `${w.dayKey}_${p}`;
        const isShifted = (currentVal !== `${w.dayKey}_${p}` && currentVal !== 'none' && !currentVal.startsWith('special_'));
        const isSpecial = currentVal.startsWith('special_');
        const isCut = (currentVal === 'none');

        let classAttr = 'excel-slot-select';
        if (isShifted) classAttr += ' is-shifted';
        else if (isSpecial) classAttr += ' is-special';
        else if (isCut) classAttr += ' is-cut';

        // オプション構築
        let optGroupsHtml = '';

        // 通常（この曜日のコマ）
        optGroupsHtml += `<optgroup label="通常"><option value="${w.dayKey}_${p}">通常 (${w.dayName}${p})</option></optgroup>`;

        // 他の曜日コマ（51, 12等のExcelコマ番号付き）
        daysOptions.forEach(day => {
          let opts = '';
          for (let pOpt = 1; pOpt <= 6; pOpt++) {
            const val = `${day.code}_${pOpt}`;
            const isSelected = (val === currentVal) ? 'selected' : '';
            const codeNum = `${day.num}${pOpt}`; // 例: 51, 12, 34
            opts += `<option value="${val}" ${isSelected}>${day.label}${pOpt} (${codeNum})</option>`;
          }
          optGroupsHtml += `<optgroup label="${day.label}曜コマ">${opts}</optgroup>`;
        });

        // 特活・総合・学活
        let specialOpts = '';
        specialOptions.forEach(sp => {
          const isSelected = (sp.code === currentVal) ? 'selected' : '';
          specialOpts += `<option value="${sp.code}" ${isSelected}>${sp.label}</option>`;
        });
        optGroupsHtml += `<optgroup label="特活・総合・その他">${specialOpts}</optgroup>`;

        periodTds += `
          <td>
            <select class="${classAttr}" id="ov_slot_${w.dateStr}_${p}" onchange="onExcelSlotSelectChange(this)">
              ${optGroupsHtml}
            </select>
          </td>
        `;
      }

      tbodyRowsHtml += `
        <tr class="${isToday ? 'row-today' : ''} ${isHoliday ? 'row-holiday' : ''}" id="ov_row_${w.dateStr}">
          <td class="excel-day-cell">
            <strong>${w.month}/${w.date} (${w.dayName})</strong>
          </td>
          <td>
            <select class="day-holiday-select ${isHoliday ? 'is-holiday' : ''}" 
                    id="ov_holiday_${w.dateStr}" 
                    onchange="onDayHolidaySelectChange('${w.dateStr}', '${w.dayKey}', this.value)">
              ${holidayOpts}
            </select>
          </td>
          ${periodTds}
        </tr>
      `;
    });

    const weekTitle = `${weekDays[0].month}月${weekDays[0].date}日(${weekDays[0].dayName}) 〜 ${weekDays[4].month}月${weekDays[4].date}日(${weekDays[4].dayName})`;

    allSectionsHtml += `
      <div class="week-override-section">
        <div class="week-section-header">
          <div class="week-section-title">
            <i class="fa-solid fa-calendar-week text-primary"></i> ${weekTitle}
            ${isCurrentWeek ? '<span class="current-week-badge">今週</span>' : ''}
          </div>
        </div>
        <table class="week-override-excel-table">
          <thead>
            <tr>
              <th style="width: 100px;">月日・曜日</th>
              <th style="width: 155px;">お休み設定 (1日)</th>
              <th>1限</th>
              <th>2限</th>
              <th>3限</th>
              <th>4限</th>
              <th>5限</th>
              <th>6限</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyRowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = allSectionsHtml;
}

function onExcelSlotSelectChange(selectEl) {
  const val = selectEl.value;
  selectEl.classList.remove('is-shifted', 'is-special', 'is-cut');
  if (val === 'none') {
    selectEl.classList.add('is-cut');
  } else if (val.startsWith('special_')) {
    selectEl.classList.add('is-special');
  } else if (!val.includes(selectEl.id.split('_')[2])) {
    selectEl.classList.add('is-shifted');
  }
}

function onDayHolidaySelectChange(dateStr, defaultDayKey, holidayVal) {
  const row = document.getElementById(`ov_row_${dateStr}`);
  const holidaySelect = document.getElementById(`ov_holiday_${dateStr}`);

  if (holidayVal) {
    // 休日設定: 1〜6限をすべて none（お休み）にする
    for (let p = 1; p <= 6; p++) {
      const sel = document.getElementById(`ov_slot_${dateStr}_${p}`);
      if (sel) {
        sel.value = 'none';
        onExcelSlotSelectChange(sel);
      }
    }
    if (row) row.classList.add('row-holiday');
    if (holidaySelect) holidaySelect.classList.add('is-holiday');
  } else {
    // 通常に戻す: 1〜6限を defaultDayKey_p に戻す
    for (let p = 1; p <= 6; p++) {
      const sel = document.getElementById(`ov_slot_${dateStr}_${p}`);
      if (sel) {
        sel.value = `${defaultDayKey}_${p}`;
        onExcelSlotSelectChange(sel);
      }
    }
    if (row) row.classList.remove('row-holiday');
    if (holidaySelect) holidaySelect.classList.remove('is-holiday');
  }
}

function saveWeekOverrides() {
  // 画面上の全 select (ov_slot_*) から日付を取得
  const allSlotSelects = document.querySelectorAll('[id^="ov_slot_"]');
  const dateSet = new Set();
  allSlotSelects.forEach(sel => {
    const parts = sel.id.split('_'); // ov, slot, dateStr, period
    if (parts.length >= 4) {
      dateSet.add(parts[2]);
    }
  });

  let changedCount = 0;

  dateSet.forEach(dateStr => {
    const holidaySelect = document.getElementById(`ov_holiday_${dateStr}`);
    const holidayVal = holidaySelect ? holidaySelect.value : '';
    const existingMemo = state.dateOverrides[dateStr]?.memo || '';
    
    // メモ: 休日が選ばれていれば「お休み」、解除された場合はお休み系メモをクリア
    let finalMemo = existingMemo;
    if (holidayVal) {
      finalMemo = 'お休み';
    } else if (existingMemo === 'お休み' || existingMemo.includes('休') || existingMemo.includes('祝')) {
      finalMemo = '';
    }

    const d = new Date(dateStr);
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const defaultDayKey = dayKeys[d.getDay()];

    const slots = {};
    let isDifferentFromDefault = false;

    for (let p = 1; p <= 6; p++) {
      const sel = document.getElementById(`ov_slot_${dateStr}_${p}`);
      const val = sel ? sel.value : `${defaultDayKey}_${p}`;
      slots[p] = val;
      if (val !== `${defaultDayKey}_${p}`) isDifferentFromDefault = true;
    }

    if (isDifferentFromDefault || finalMemo) {
      state.dateOverrides[dateStr] = {
        memo: finalMemo,
        slots: slots
      };
      changedCount++;
    } else {
      delete state.dateOverrides[dateStr];
    }
  });

  localStorage.setItem('math_portal_date_overrides', JSON.stringify(state.dateOverrides));
  closeDayOverrideModal();
  renderRealTimetableGrid();
  showToast('<i class="fa-solid fa-circle-check text-success"></i> 翌月までの特時・お休み設定を一括保存しました！');
  triggerAutoCloudSync();
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
// 週案・授業プリントセット モーダル (実時間割での進度・予定管理)
// ------------------------------------------
function openLessonPlanModal(dateStr, period, className, subjectName) {
  state.editingLessonPlan = { dateStr, period, className, subjectName };
  const key = `${dateStr}_${period}`;
  state.lessonPlanPrintRefs = state.lessonPlanPrintRefs || JSON.parse(localStorage.getItem('math_portal_lesson_plan_prints') || '{}');
  const existingPrintRef = state.lessonPlanPrintRefs[key] || null;

  const banner = document.getElementById('lessonPlanMetaBanner');
  if (banner) {
    const d = new Date(dateStr);
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dateFormatted = `${d.getMonth() + 1}/${d.getDate()} (${dayNames[d.getDay()]}) ${period}限`;
    banner.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div><strong>${dateFormatted}</strong> : <span style="font-size: 1.05rem; font-weight: 800;">${escapeHtml(className)}</span></div>
        <div><span class="tt-subject-badge" style="background:#dbeafe; color:#1d4ed8; font-weight:700;">${escapeHtml(subjectName)}</span></div>
      </div>
    `;
  }

  // 2段階選択（単元 ➔ 時数）の初期化
  initTwoStepLessonPrintSelect(className, subjectName, existingPrintRef);

  document.getElementById('lessonPlanModal').classList.remove('hidden');
}

function initTwoStepLessonPrintSelect(className, subjectName, existingPrintRef) {
  let grade = existingPrintRef?.grade || extractGradeFromClassName(className) || '2';
  if (!boardLessonDatabase[grade]) grade = '2';

  state.editingLessonPlan.currentGrade = grade;

  const gradeSelect = document.getElementById('lessonPlanGradeSelect');
  if (gradeSelect) {
    gradeSelect.value = grade;
  }

  const unitSelect = document.getElementById('lessonPlanUnitSelect');
  if (!unitSelect) return;

  const gData = boardLessonDatabase[grade];
  if (!gData || !gData.units || gData.units.length === 0) return;

  // 単元セレクトのオプション生成
  unitSelect.innerHTML = gData.units.map((u, idx) => {
    const isSelected = existingPrintRef && existingPrintRef.unitId === u.id ? 'selected' : (!existingPrintRef && idx === 0 ? 'selected' : '');
    return `<option value="${u.id}" ${isSelected}>${escapeHtml(u.unitName)}</option>`;
  }).join('');

  const targetUnitId = (existingPrintRef && existingPrintRef.unitId) ? existingPrintRef.unitId : gData.units[0].id;
  const targetHour = (existingPrintRef && existingPrintRef.hour) ? Number(existingPrintRef.hour) : null;

  // 時数セレクトの生成とプレビュー更新
  updateLessonPlanHourSelect(grade, targetUnitId, targetHour);
}

function onLessonPlanGradeSelectChange() {
  const gradeSelect = document.getElementById('lessonPlanGradeSelect');
  if (!gradeSelect) return;
  const grade = gradeSelect.value;
  state.editingLessonPlan.currentGrade = grade;

  const unitSelect = document.getElementById('lessonPlanUnitSelect');
  if (!unitSelect) return;

  const gData = boardLessonDatabase[grade];
  if (!gData || !gData.units || gData.units.length === 0) {
    unitSelect.innerHTML = '<option value="">（単元がありません）</option>';
    updateLessonPlanHourSelect(grade, '', null);
    return;
  }

  unitSelect.innerHTML = gData.units.map(u => {
    return `<option value="${u.id}">${escapeHtml(u.unitName)}</option>`;
  }).join('');

  const targetUnitId = gData.units[0].id;
  updateLessonPlanHourSelect(grade, targetUnitId, null);
}

function updateLessonPlanHourSelect(grade, unitId, selectedHour = null) {
  const hourSelect = document.getElementById('lessonPlanHourSelect');
  if (!hourSelect) return;

  const lessons = (typeof getUnitLessons === 'function') ? getUnitLessons(grade, unitId) : [];
  if (lessons.length === 0) {
    hourSelect.innerHTML = '<option value="">（この単元にはプリントがありません）</option>';
    updateLessonPreviewBox(null, null);
    return;
  }

  hourSelect.innerHTML = lessons.map((l, idx) => {
    const isSelected = selectedHour !== null ? (Number(l.hour) === Number(selectedHour) ? 'selected' : '') : (idx === 0 ? 'selected' : '');
    return `<option value="${l.hour}" ${isSelected}>第${l.hour}時: ${escapeHtml(l.title)}</option>`;
  }).join('');

  const currentHour = hourSelect.value ? Number(hourSelect.value) : lessons[0].hour;
  const currentLesson = lessons.find(l => Number(l.hour) === currentHour) || lessons[0];
  const unit = (boardLessonDatabase[grade]?.units || []).find(u => u.id === unitId);

  updateLessonPreviewBox(unit, currentLesson);
}

function updateLessonPreviewBox(unit, lesson) {
  const box = document.getElementById('selectedLessonSummaryBox');
  if (!box) return;

  if (!lesson || !unit) {
    box.innerHTML = '<span class="text-muted">プリントを選択してください</span>';
    return;
  }

  const objBlock = (lesson.leftBlocks || []).find(b => b.type === 'objective');
  const objText = objBlock?.data?.text || '本時のめあてを設定して学習を進めます';

  box.innerHTML = `
    <div style="font-weight: 700; color: #1e293b; margin-bottom: 0.25rem;">
      <i class="fa-solid fa-file-lines text-primary"></i> 【${escapeHtml(unit.unitName)}】第${lesson.hour}時: ${escapeHtml(lesson.title)}
    </div>
    <div style="color: #64748b; font-size: 0.78rem;">
      <strong>めあて:</strong> ${escapeHtml(objText)}
    </div>
  `;

  // 一時ステートに保持
  state.editingLessonPlan.selectedPrintRef = {
    grade: state.editingLessonPlan.currentGrade,
    unitId: unit.id,
    hour: Number(lesson.hour),
    title: lesson.title
  };
}

function onLessonPlanUnitSelectChange() {
  const grade = document.getElementById('lessonPlanGradeSelect')?.value || state.editingLessonPlan?.currentGrade || '2';
  const unitSelect = document.getElementById('lessonPlanUnitSelect');
  if (!unitSelect) return;
  updateLessonPlanHourSelect(grade, unitSelect.value, null);
}

function onLessonPlanHourSelectChange() {
  const grade = document.getElementById('lessonPlanGradeSelect')?.value || state.editingLessonPlan?.currentGrade || '2';
  const unitSelect = document.getElementById('lessonPlanUnitSelect');
  const hourSelect = document.getElementById('lessonPlanHourSelect');
  if (!unitSelect || !hourSelect) return;

  const lessons = (typeof getUnitLessons === 'function') ? getUnitLessons(grade, unitSelect.value) : [];
  const currentLesson = lessons.find(l => Number(l.hour) === Number(hourSelect.value));
  const unit = (boardLessonDatabase[grade]?.units || []).find(u => u.id === unitSelect.value);

  updateLessonPreviewBox(unit, currentLesson);
}

function closeLessonPlanModal() {
  document.getElementById('lessonPlanModal').classList.add('hidden');
}

function clearCurrentLessonPlan() {
  const { dateStr, period } = state.editingLessonPlan;
  const key = `${dateStr}_${period}`;
  delete state.lessonPlans[key];
  if (state.lessonPlanPrintRefs) {
    delete state.lessonPlanPrintRefs[key];
    localStorage.setItem('math_portal_lesson_plan_prints', JSON.stringify(state.lessonPlanPrintRefs));
  }
  localStorage.setItem('math_portal_lesson_plans', JSON.stringify(state.lessonPlans));
  renderRealTimetableGrid();
  closeLessonPlanModal();
  showToast('🗑️ 授業予定をクリアしました');
  triggerAutoCloudSync();
}

function saveLessonPlan() {
  const { dateStr, period, selectedPrintRef } = state.editingLessonPlan;
  const key = `${dateStr}_${period}`;

  if (selectedPrintRef) {
    const text = `第${selectedPrintRef.hour}時: ${selectedPrintRef.title}`;
    state.lessonPlans[key] = text;
    state.lessonPlanPrintRefs = state.lessonPlanPrintRefs || {};
    state.lessonPlanPrintRefs[key] = selectedPrintRef;
    localStorage.setItem('math_portal_lesson_plan_prints', JSON.stringify(state.lessonPlanPrintRefs));
    localStorage.setItem('math_portal_lesson_plans', JSON.stringify(state.lessonPlans));
    showToast(`📝 【${text}】をセットしました`);
  }

  renderRealTimetableGrid();
  closeLessonPlanModal();
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

// ==========================================
// 定期考査カウントダウン & クラス別進度管理
// ==========================================

function calculateExamCountdown() {
  const settings = state.examSettings;
  if (!settings || !settings.examDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = settings.examDate.split('-').map(Number);
  if (parts.length !== 3) return null;
  const examDate = new Date(parts[0], parts[1] - 1, parts[2]);
  examDate.setHours(0, 0, 0, 0);

  const diffMs = examDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return {
      isPast: true,
      examName: settings.examName || '定期テスト',
      examDateStr: settings.examDate,
      diffDays: diffDays,
      totalLessons: 0,
      classCounts: {}
    };
  }

  const classCounts = {};
  let totalLessons = 0;
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const targetSubj = (settings.targetSubject || '数学').trim();

  // 今日からテスト前日（examDate - 1日）までを走査
  const cur = new Date(today);
  while (cur < examDate) {
    const dayNum = cur.getDay();
    if (dayNum !== 0 && dayNum !== 6) { // 月〜金
      const yStr = cur.getFullYear();
      const mStr = String(cur.getMonth() + 1).padStart(2, '0');
      const dStr = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${yStr}-${mStr}-${dStr}`;
      const dayKey = dayKeys[dayNum];

      const dayData = getActualSlotsForDate(dateStr, dayKey);
      for (let p = 1; p <= 6; p++) {
        const slot = dayData.slots[p];
        if (slot && slot.class && slot.class.trim() !== '') {
          const s = slot.subject || '';
          if (!targetSubj || s.includes(targetSubj) || s === targetSubj) {
            const cls = slot.class.trim();
            classCounts[cls] = (classCounts[cls] || 0) + 1;
            totalLessons++;
          }
        }
      }
    }
    cur.setDate(cur.getDate() + 1);
  }

  return {
    isPast: false,
    examName: settings.examName || '定期テスト',
    examDateStr: settings.examDate,
    diffDays: diffDays,
    totalLessons: totalLessons,
    classCounts: classCounts
  };
}

function renderExamCountdownBar() {
  const container = document.getElementById('examCountdownCard');
  if (!container) return;

  const data = calculateExamCountdown();
  if (!data) {
    container.innerHTML = `
      <div class="exam-countdown-left">
        <span class="exam-countdown-title"><i class="fa-solid fa-calendar-check text-primary"></i> 定期テスト進度カウントダウン:</span>
        <span style="font-size: 0.78rem; color: #64748b;">日程が未設定です</span>
      </div>
      <button type="button" class="exam-setting-link-btn" onclick="openExamSettingModal()">
        <i class="fa-solid fa-gear"></i> 日程を設定する
      </button>
    `;
    return;
  }

  if (data.isPast) {
    container.innerHTML = `
      <div class="exam-countdown-left">
        <span class="exam-countdown-title"><i class="fa-solid fa-flag-checkered text-success"></i> ${escapeHtml(data.examName)} (${escapeHtml(data.examDateStr)}):</span>
        <span style="font-size: 0.78rem; color: #10b981; font-weight: 700;">実施終了（お疲れ様でした！）</span>
      </div>
      <button type="button" class="exam-setting-link-btn" onclick="openExamSettingModal()">
        <i class="fa-solid fa-calendar-plus"></i> 次回テスト日程を設定
      </button>
    `;
    return;
  }

  const sortedClasses = Object.keys(data.classCounts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  const pillsHtml = sortedClasses.map(cls => {
    const c = data.classCounts[cls];
    return `
      <div class="exam-class-pill" title="${cls}: テストまでに予定されている授業コマ数">
        <span class="cls-name">${escapeHtml(cls)}</span>
        <span class="cls-count">${c}コマ</span>
      </div>
    `;
  }).join('');

  // クラス間での進度のズレ（最大と最小の差）を判定
  let diffNotice = '';
  if (sortedClasses.length >= 2) {
    const counts = sortedClasses.map(cls => data.classCounts[cls]);
    const maxC = Math.max(...counts);
    const minC = Math.min(...counts);
    const gap = maxC - minC;
    if (gap > 0) {
      diffNotice = `<span style="font-size: 0.72rem; color: #d97706; font-weight: 700; margin-left: 0.35rem;" title="クラス間で実施コマ数に差があります。特時・振替で調整を検討できます"><i class="fa-solid fa-triangle-exclamation"></i> クラス差: ${gap}コマ</span>`;
    }
  }

  container.innerHTML = `
    <div class="exam-countdown-left">
      <div class="exam-countdown-title">
        <i class="fa-solid fa-bullseye text-primary"></i>
        <span>${escapeHtml(data.examName)} (${escapeHtml(data.examDateStr)}) まで:</span>
        <span class="exam-countdown-days-badge">あと ${data.diffDays}日</span>
        ${diffNotice}
      </div>
      <div class="exam-class-pills">
        ${pillsHtml || '<span style="font-size: 0.78rem; color: #94a3b8;">対象クラスのコマなし</span>'}
      </div>
    </div>
    <button type="button" class="exam-setting-link-btn" onclick="openExamSettingModal()" title="定期考査の日程・名称を変更">
      <i class="fa-solid fa-gear"></i> 日程変更
    </button>
  `;
}

function updateHeroExamStatus() {
  const textEl = document.getElementById('heroExamStatusText');
  if (!textEl) return;

  const data = calculateExamCountdown();
  if (!data || data.isPast) {
    textEl.innerHTML = `次回定期テスト: <strong>日程設定はこちら</strong>`;
    return;
  }

  const sortedClasses = Object.keys(data.classCounts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  if (sortedClasses.length === 0) {
    textEl.innerHTML = `${escapeHtml(data.examName)}まで: <strong>あと ${data.diffDays}日</strong>`;
    return;
  }

  const counts = sortedClasses.map(cls => data.classCounts[cls]);
  const minC = Math.min(...counts);
  const maxC = Math.max(...counts);
  const rangeStr = (minC === maxC) ? `各クラス ${minC}コマ` : `各クラス ${minC}〜${maxC}コマ`;

  textEl.innerHTML = `${escapeHtml(data.examName)}まで: <strong>残り ${rangeStr}</strong> (計${data.totalLessons}コマ)`;
}

// モーダル操作
function openExamSettingModal() {
  const modal = document.getElementById('examSettingModal');
  if (!modal) return;

  const settings = state.examSettings || {};
  const nameInput = document.getElementById('examNameInput');
  const dateInput = document.getElementById('examDateInput');
  const subjInput = document.getElementById('examSubjectInput');

  if (nameInput) nameInput.value = settings.examName || '2学期 中間テスト';
  if (dateInput) dateInput.value = settings.examDate || '';
  if (subjInput) subjInput.value = settings.targetSubject || '数学';

  modal.classList.remove('hidden');
}

function closeExamSettingModal() {
  document.getElementById('examSettingModal')?.classList.add('hidden');
}

function saveExamSettings() {
  const name = document.getElementById('examNameInput')?.value.trim() || '定期テスト';
  const date = document.getElementById('examDateInput')?.value || '';
  const subj = document.getElementById('examSubjectInput')?.value.trim() || '数学';

  if (!date) {
    alert('テストの実施初日（開始日）を選択してください。');
    return;
  }

  state.examSettings = {
    examName: name,
    examDate: date,
    targetSubject: subj
  };

  localStorage.setItem('math_portal_exam_settings', JSON.stringify(state.examSettings));
  renderExamCountdownBar();
  updateHeroExamStatus();
  closeExamSettingModal();
  triggerAutoCloudSync();

  showToast(`📅 【${name} (${date})】までの授業カウントダウンを設定しました！`);
}

function clearExamSettings() {
  if (confirm('定期考査の日程設定をクリアしますか？')) {
    state.examSettings = { examName: '', examDate: '', targetSubject: '数学' };
    localStorage.removeItem('math_portal_exam_settings');
    renderExamCountdownBar();
    updateHeroExamStatus();
    closeExamSettingModal();
    triggerAutoCloudSync();
    showToast('定期考査の設定をクリアしました。');
  }
}

window.calculateExamCountdown = calculateExamCountdown;
window.renderExamCountdownBar = renderExamCountdownBar;
window.updateHeroExamStatus = updateHeroExamStatus;
window.openExamSettingModal = openExamSettingModal;
window.closeExamSettingModal = closeExamSettingModal;
window.saveExamSettings = saveExamSettings;
window.clearExamSettings = clearExamSettings;


// 授業プリント工房への直結
