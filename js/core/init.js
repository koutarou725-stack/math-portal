// ==========================================
// // 初期化

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
  loadSampleSheet(true);
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
// // サーバー環境チェック（GitHub Pages等で開かれた時の親切バナー）

function checkServerEnvironment() {
  const host = window.location.hostname;
  const port = window.location.port;
  const isLocalServer = (host === 'localhost' || host === '127.0.0.1') && port === '3000';
  const isGitHubPages = host.includes('github.io');

  if (isGitHubPages) {
    const banner = document.createElement('div');
    banner.id = 'serverEnvironmentBanner';
    banner.className = 'no-print';
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

boardLessonDatabase = {
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
        "unitName": "多項式",
        "totalHours": 17,
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
                                                                                "text": "【第1時】多項式と単項式の乗法・除法について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "多項式と単項式の乗法・除法の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "多項式と単項式の乗法・除法",
                                                                                "content": "多項式と単項式の乗法・除法のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "title": "(a+b)(c+d)の展開",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第2時】(a+b)(c+d)の展開について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "(a+b)(c+d)の展開の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "(a+b)(c+d)の展開",
                                                                                "content": "(a+b)(c+d)の展開のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "title": "(a+b)(c+d+e)の展開",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第3時】(a+b)(c+d+e)の展開について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "(a+b)(c+d+e)の展開の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "(a+b)(c+d+e)の展開",
                                                                                "content": "(a+b)(c+d+e)の展開のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 4,
                                      "title": "平方の公式と和と差の積の公式",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第4時】平方の公式と和と差の積の公式について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "平方の公式と和と差の積の公式の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "平方の公式と和と差の積の公式",
                                                                                "content": "平方の公式と和と差の積の公式のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "title": "(x+a)(x+b)の展開",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第5時】(x+a)(x+b)の展開について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "(x+a)(x+b)の展開の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "(x+a)(x+b)の展開",
                                                                                "content": "(x+a)(x+b)の展開のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 6,
                                      "title": "いろいろな式の計算",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第6時】いろいろな式の計算について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "いろいろな式の計算の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "いろいろな式の計算",
                                                                                "content": "いろいろな式の計算のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 7,
                                      "title": "展開の公式の活用",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第7時】展開の公式の活用について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "展開の公式の活用の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "展開の公式の活用",
                                                                                "content": "展開の公式の活用のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "title": "共通因数をくくり出すこと",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第8時】共通因数をくくり出すことについて理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "共通因数をくくり出すことの計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "共通因数をくくり出すこと",
                                                                                "content": "共通因数をくくり出すことのポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 9,
                                      "title": "平方の公式の利用",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第9時】平方の公式の利用について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "平方の公式の利用の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "平方の公式の利用",
                                                                                "content": "平方の公式の利用のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "title": "和と差の積の公式の利用",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第10時】和と差の積の公式の利用について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "和と差の積の公式の利用の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "和と差の積の公式の利用",
                                                                                "content": "和と差の積の公式の利用のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 11,
                                      "title": "x²+(a+b)x+ab の因数分解①",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第11時】x²+(a+b)x+ab の因数分解①について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "x²+(a+b)x+ab の因数分解①の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "x²+(a+b)x+ab の因数分解①",
                                                                                "content": "x²+(a+b)x+ab の因数分解①のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 12,
                                      "title": "x²+(a+b)x+ab の因数分解②",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第12時】x²+(a+b)x+ab の因数分解②について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "x²+(a+b)x+ab の因数分解②の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "x²+(a+b)x+ab の因数分解②",
                                                                                "content": "x²+(a+b)x+ab の因数分解②のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 13,
                                      "title": "いろいろな因数分解",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第13時】いろいろな因数分解について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "いろいろな因数分解の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "いろいろな因数分解",
                                                                                "content": "いろいろな因数分解のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 14,
                                      "title": "数の性質①",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第14時】数の性質①について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "数の性質①の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "数の性質①",
                                                                                "content": "数の性質①のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 15,
                                      "title": "数の性質②",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第15時】数の性質②について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "数の性質②の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "数の性質②",
                                                                                "content": "数の性質②のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 16,
                                      "title": "図形の性質①",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第16時】図形の性質①について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "図形の性質①の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "図形の性質①",
                                                                                "content": "図形の性質①のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
                                      "hour": 17,
                                      "title": "図形の性質②",
                                      "leftBlocks": [
                                                    {
                                                                  "type": "objective",
                                                                  "data": {
                                                                                "text": "【第17時】図形の性質②について理解し、問題を解くことができる。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "board-task",
                                                                  "data": {
                                                                                "qNum": "【本時の課題】",
                                                                                "text": "図形の性質②の計算方法や考え方を身につけよう。",
                                                                                "guide": "教科書の例題を参考にしながら考えてみよう。",
                                                                                "thinkingSpaceHeight": 85,
                                                                                "answer": "計算の過程をしっかり残すこと。"
                                                                  }
                                                    },
                                                    {
                                                                  "type": "point-box",
                                                                  "data": {
                                                                                "badge": "板書まとめ",
                                                                                "title": "図形の性質②",
                                                                                "content": "図形の性質②のポイントを整理しよう。<br>・重要な公式や手順を確認する。<br>・ミスしやすい点に注意する。"
                                                                  }
                                                    }
                                      ],
                                      "rightBlocks": [
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 1",
                                                                                "text": "次の問題を解きなさい。",
                                                                                "answer": "各自で解答を確認する。",
                                                                                "spaceHeight": 65
                                                                  }
                                                    },
                                                    {
                                                                  "type": "question",
                                                                  "data": {
                                                                                "qNum": "問 2",
                                                                                "text": "少し応用的な問題に挑戦しよう。",
                                                                                "answer": "途中の式も書くこと。",
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
let currentB4Hour = 1; // デフォルト: 3年多項式 5時間目 (工夫して展開)

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
        <div class="objective-box" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
          <span class="objective-label">めあて</span>
          <div class="objective-text" contenteditable="true" data-field="text" oninput="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
            ${block.data.text}
          </div>
        </div>
      `;
    } else if (block.type === 'review') {
      blockContentHtml = `
        <div class="review-box" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
          <div class="review-title" contenteditable="true" data-field="title" oninput="updateColBlockData('${colSide}', ${index}, 'title', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerHTML)">
            <i class="fa-solid fa-clock-rotate-left"></i> ${block.data.title}
          </div>
          <div class="q-body" contenteditable="true" data-field="content" oninput="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'board-task') {
      blockContentHtml = `
        <div class="board-task-box">
          <div class="board-task-header">
            <span class="board-task-badge"><i class="fa-solid fa-chalkboard-user"></i> ${block.data.qNum}</span>
            <div class="board-task-text" contenteditable="true" data-field="text" oninput="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
              ${block.data.text}
            </div>
          </div>
          ${block.data.guide ? `
            <div class="board-task-guide" contenteditable="true" data-field="guide" oninput="updateColBlockData('${colSide}', ${index}, 'guide', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'guide', this.innerHTML)">
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
            <strong contenteditable="true" data-field="title" oninput="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)">${block.data.title}</strong>
          </div>
          <div class="point-summary-body" contenteditable="true" data-field="content" style="min-height: ${block.data.customHeight || 40}px;" oninput="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'question') {
      blockContentHtml = `
        <div class="question-item">
          <div class="q-header">
            <span class="q-num" contenteditable="true" data-field="qNum" oninput="updateColBlockData('${colSide}', ${index}, 'qNum', this.innerText)" onblur="updateColBlockData('${colSide}', ${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
            <div class="q-body" contenteditable="true" data-field="text" oninput="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
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
                <span class="q-num" contenteditable="true" data-field="qNum" oninput="updateColBlockData('${colSide}', ${index}, 'qNum', this.innerText)" onblur="updateColBlockData('${colSide}', ${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
                <div class="q-body" contenteditable="true" data-field="text" oninput="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'text', this.innerHTML)">
                  ${block.data.text}
                </div>
              </div>
              <div class="answer-space" style="min-height: ${block.data.spaceHeight || 45}px;">
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
        <div class="summary-box" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
          <div class="summary-header">
            <i class="fa-solid fa-lightbulb"></i>
            <span contenteditable="true" data-field="title" oninput="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)">${block.data.title}</span>
          </div>
          <div class="summary-content" contenteditable="true" data-field="content" oninput="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)" onblur="updateColBlockData('${colSide}', ${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'reflection') {
      blockContentHtml = `
        <div class="reflection-box">
          <div class="reflection-scales">
            <strong contenteditable="true" data-field="title" oninput="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)" onblur="updateColBlockData('${colSide}', ${index}, 'title', this.innerText)">${block.data.title}</strong>
            <div class="scale-options">
              理解度: <span>[ A: よくわかった ]</span> <span>[ B: だいたい ]</span> <span>[ C: もう少し ]</span>
            </div>
          </div>
          <div class="reflection-comment-line" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
            今日の授業で学んだこと・疑問点:
          </div>
        </div>
      `;
    }

    return `
      <div class="sheet-block" id="${block.id}" data-col="${colSide}" data-index="${index}">
        <div class="block-hover-controls no-print">
          <button class="block-ctrl-btn" onclick="moveColBlock('${colSide}', ${index}, -1)" title="上へ"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="block-ctrl-btn" onclick="moveColBlock('${colSide}', ${index}, 1)" title="下へ"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="block-ctrl-btn" onclick="transferColBlock('${colSide}', ${index})" title="反対側の面へ移動"><i class="fa-solid fa-arrows-left-right"></i></button>
          <button class="block-ctrl-btn danger" onclick="removeColBlock('${colSide}', ${index})" title="削除"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${blockContentHtml}
        <div class="sheet-resize-handle no-print" data-col="${colSide}" data-index="${index}" title="ドラッグしてブロックの高さを変更">
          <div class="resize-handle-pill">
            <i class="fa-solid fa-grip-lines"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateColBlockData(colSide, index, field, value) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (blocks && blocks[index]) {
    if (!blocks[index].data) blocks[index].data = {};
    blocks[index].data[field] = value;
    state.blocks = [...(state.blocksLeft || []), ...(state.blocksRight || [])];
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