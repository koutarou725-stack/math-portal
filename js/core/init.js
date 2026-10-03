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
        "unitName": "第3章 一次関数 $y=ax+b$",
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
            "title": "二元一次方程式 $ax+by=c$ のグラフ",
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
        "totalHours": 17,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "式の計算をアップグレードしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "単項式と多項式の乗法，多項式を単項式でわる除法の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の（1）と（2）の式を計算するにはどうすればよいだろう。<br><br>(1) $\\displaystyle (-3a + b) \\times 4a$<br>(2) $\\displaystyle -3a \\times (4a - 5b)$",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "多項式と単項式の乗法・除法は、数と同じように考えて計算できる。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の（3）と（4）の式を計算するにはどうすればよいだろう。<br><br>(3) $\\displaystyle (6x^2 - 4x) \\div 2x$<br>(4) $\\displaystyle (6x^2 - 4x) \\div \\frac{2}{3}x$",
                  "answer": "各自で解答を確認する。",
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
            "hour": 2,
            "title": "式の計算をもっとアップグレードしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な一次式の乗法の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "復習",
                  "content": "$(3a+1)\\times 2b = 6ab+2b$<br>　↓ 単項式を多項式に変えたら？<br>$(3a+1)\\times(2b-4)$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>問題1</strong>　上の式を計算するには，どうすればよいだろう。<br>$(3a+1)(2b-4)$",
                  "guide": "多項式×単項式なら計算できる。$2b-4$ を $M$ にして，多項式×単項式の形にしてみよう。",
                  "thinkingSpaceHeight": 150,
                  "answer": "$(3a+1)(2b-4)$　← $2b-4$ を $M$ に入れる<br>$=(3a+1)M$<br>$=3aM+M$　← $M$ を $2b-4$ にもどす<br>$=3a(2b-4)+(2b-4)$<br>$=6ab-12a+2b-4$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "式の展開",
                  "content": "$(3a+1)(2b-4)=6ab-12a+2b-4$ のように，多項式の積の形の式を単項式の和の形に表すことを<strong>「展開する」</strong>という。<br>$(a+b)(c+d)=ac+ad+bc+bd$"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題2",
                  "text": "下の (1) と (2) の式を展開しよう。<br>(1) $(x-5)(x-6)$<br>(2) $(2a-b)(7a+8b)$",
                  "answer": "(1) $=x(x-6)-5(x-6)$　← $x-6$ を $M$ に入れる<br>$=x^2-6x-5x+30$<br>$=x^2-11x+30$　← 同類項をまとめる<br>(2) $=2a(7a+8b)-b(7a+8b)$<br>$=14a^2+16ab-7ab-8b^2$<br>$=14a^2+9ab-8b^2$",
                  "spaceHeight": 170
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "展開のポイント",
                  "content": "・式の展開でも，<strong>同類項があるときはまとめる</strong>。<br>・式の展開でも，<strong>分配法則と同じように</strong>計算できる。"
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
            "title": "式の計算をもっともっとアップグレードしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な一次式の乗法の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "復習",
                  "content": "$(4x-y)(2x+3y)=8x^2+10xy-3y^2$<br>　↓ 項を増やしたら？<br>$(4x-y)(2x+3y+5)$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>問題</strong>　上の式を計算するには，どうすればよいだろう。<br>$(4x-y)(2x+3y+5)$",
                  "guide": "・方法1 … ビン詰め法（$2x+3y+5$ をビン詰め）を使って計算する。<br>・方法2 … 分配法則と同じように考えて計算する。",
                  "thinkingSpaceHeight": 150,
                  "answer": "【方法1】$=4x(2x+3y+5)-y(2x+3y+5)$<br>$=8x^2+12xy+20x-2xy-3y^2-5y$<br>$=8x^2+10xy+20x-3y^2-5y$<br>【方法2】各項どうしをかけて<br>$=8x^2+12xy+20x-2xy-3y^2-5y$<br>$=8x^2+10xy+20x-3y^2-5y$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "式の展開は，<strong>項の数が増えても，これまでと同じ方法で</strong>計算できる。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "練習",
                  "text": "次の式を展開しよう。<br>(1) $(a+2)(a+b-3)$<br>(2) $(x-2y)(3x+y-4)$",
                  "answer": "(1) $=a^2+ab-3a+2a+2b-6=a^2+ab-a+2b-6$<br>(2) $=3x^2+xy-4x-6xy-2y^2+8y=3x^2-5xy-4x-2y^2+8y$",
                  "spaceHeight": 150
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
            "title": "展開の計算をスピードアップしよう①",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "式の展開の公式を用いて簡単な式の展開をすることができる。（知・技）"
                }
              },
              {
                "type": "review",
                "data": {
                  "title": "復習",
                  "content": "(1) $(a+b)^2=(a+b)(a+b)=a^2+ab+ab+b^2=a^2+2ab+b^2$<br>(2) $(x+7y)^2$ … 上の式で $a$ を $x$，$b$ を $7y$ とみると<br>$=x^2+2\\times x\\times 7y+(7y)^2=x^2+14xy+49y^2$"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>課題</strong>　他にも公式をつくって，式の展開をスピードアップできないか？<br><strong>問題</strong>　次の (1) と (2) の式を展開して公式をつくろう。<br>(1) $(a-b)^2$　　(2) $(a+b)(a-b)$",
                  "guide": "$(a+b)^2$ の公式のつくり方を参考にしよう。",
                  "thinkingSpaceHeight": 150,
                  "answer": "(1) $(a-b)^2=(a-b)(a-b)=a^2-ab-ab+b^2=a^2-2ab+b^2$<br>→ 和の2乗を差の2乗に変えると，$2ab$ の符号が「＋」から「－」に変わる。<br>(2) $(a+b)(a-b)=a^2-ab+ab-b^2=a^2-b^2$<br>→ 和と差の積に変えると，$2ab$ がなくなり，$a^2$ と $b^2$ の差になる。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "展開の公式",
                  "content": "$(a+b)^2=a^2+2ab+b^2$　… 和の平方<br>$(a-b)^2=a^2-2ab+b^2$　… 差の平方<br>$(a+b)(a-b)=a^2-b^2$　… 和と差の積"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "公式を使って，次の式を展開しよう。<br>(1) $(8x-y)^2$<br>(2) $(5x+3)(5x-3)$",
                  "answer": "(1) $a$ を $8x$，$b$ を $y$ とみると<br>$=(8x)^2-2\\times 8x\\times y+y^2=64x^2-16xy+y^2$<br>(2) $a$ を $5x$，$b$ を $3$ とみると<br>$=(5x)^2-3^2=25x^2-9$",
                  "spaceHeight": 150
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
            "title": "展開の計算をスピードアップしよう②",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "式の展開の公式を用いて簡単な式の展開をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>課題</strong>　他にも式の展開をスピードアップできる公式はないだろうか。<br>$(x+2)(x+3)=x^2+5x+6$　　$(x-1)(x+9)=x^2+8x-9$<br>$(x+4)(x-7)=x^2-3x-28$　　$(x-5)(x-8)=x^2-13x+40$<br><strong>問題1</strong>　先生はどうやって素早く展開の計算をしたのだろう。",
                  "guide": "＜予想＞ $(x+a)(x+b)$ の形の式の展開では，$x^2$ の係数は 1，$x$ の係数は $(a+b)$，定数の項は $ab$ になるのではないか？",
                  "thinkingSpaceHeight": 130,
                  "answer": "$(x+a)(x+b)=x^2+bx+ax+ab$<br>$=x^2+(a+b)x+ab$<br>（$x$ の係数 $=a+b$，定数の項 $=ab$）→ 予想はいつでも成り立つ！"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "展開の公式",
                  "content": "<strong>$(x+a)(x+b)=x^2+(a+b)x+ab$</strong><br>例）$(x+1)(x+10)=x^2+11x+10$<br>　　$(x-9)(x+7)=x^2-2x-63$<br>　　$(x-6)(x-3)=x^2-9x+18$"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題2",
                  "text": "$(x+8)(x+2)-(x-4)^2$ を計算しよう。",
                  "answer": "$=x^2+10x+16-(x^2-8x+16)$<br>$=x^2+10x+16-x^2+8x-16$<br>$=18x$<br>※ $(x+a)(x+b)=x^2+(a+b)x+ab$ と $(a-b)^2=a^2-2ab+b^2$ を利用",
                  "spaceHeight": 150
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
            "title": "工夫して計算しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "式の展開の公式を用いて簡単な式の展開をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>問題</strong>　次の式を展開しよう。<br>(1) $(x+y+1)(x+y-1)$",
                  "guide": "共通な部分を $M$ とおくと，展開の公式が使えないかな？",
                  "thinkingSpaceHeight": 160,
                  "answer": "【分配法則】$=x^2+xy-x+xy+y^2-y+x+y-1=x^2+2xy+y^2-1$<br>【$x+y$ を $M$ とすると】<br>$=(M+1)(M-1)=M^2-1$　← $(a+b)(a-b)=a^2-b^2$<br>$=(x+y)^2-1$　← $(a+b)^2=a^2+2ab+b^2$<br>$=x^2+2xy+y^2-1$"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "同じ式の展開でも，<strong>計算の仕方は必ずしも1通りとは限らない</strong>。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題 (2)",
                  "text": "$(a-b-2)(a-b+3)$ を展開しよう。",
                  "answer": "$a-b$ を $M$ とすると<br>$=(M-2)(M+3)=M^2+M-6$　← $(x+a)(x+b)=x^2+(a+b)x+ab$<br>$=(a-b)^2+(a-b)-6$　← $(a-b)^2=a^2-2ab+b^2$<br>$=a^2-2ab+b^2+a-b-6$",
                  "spaceHeight": 160
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
            "title": "面積を半分にしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文字を用いた式で数量及び数量の関係を捉え説明することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "生徒には課題と長方形 ABCD を複数印刷したワークシートを配付し",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "まず，教師が比較的取り組みやすい問いを"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "課題",
                  "text": "AB がa㎝で，AD がb㎝の長方形 ABCD がある。辺BC 上に点P，辺CD 上",
                  "answer": "各自で解答を確認する。",
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
            "hour": 8,
            "title": "逆向きに計算しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な式の因数分解をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　多項式を因数分解する方法を考えよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "「くくる」という言葉を知らない生徒がい"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "課題です。これまでの式の展開を逆向きに見て，これからは因数分解について考えること",
                  "answer": "各自で解答を確認する。",
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
            "title": "平方の公式で因数分解しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な式の因数分解をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の式（板書参照）を因数分解しよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "公式の指導では，それを覚えさせることだ"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "差の平方の公式を逆向きに見ても，因数分解ができるだろうか。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 10,
            "title": "和と差の積の公式を使って因数分解しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な一次式の因数分解をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　和と差の積の公式を逆向きに見ても，",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "前時と同じように，式を言語化して，生徒"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "和と差の積の公式を逆向きに見ても，因数分解ができるだろうか。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 11,
            "title": "$x^2+(a+b)x+ab$ の形の式を因数分解しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な一次式の因数分解をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　（x＋a）（x＋b）の展開の公式を逆向きに見て，因数分解できないだろうか。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "「これまでの公式では因数分解できない式"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の式（板書参照）を因数分解しよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 12,
            "title": "いろいろな式を因数分解しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "簡単な式の因数分解をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の式（板書参照）を因数分解しよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "「因数分解できた式の一部を変えると，因"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の式（板書参照）を因数分解しよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 13,
            "title": "図を使って因数分解を考えよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "因数分解を図と関連付けて考えることができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>課題</strong>　図を使って因数分解を考えよう",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "問題１の図は，事前に拡大印刷してつくっておくか，プロジェクターで投影してもよいでしょう。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 14,
            "title": "暗算名人になろう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文字を用いた式で数量及び数量の関係を捉え説明できることを理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　先生はなぜ素早く計算できるのだろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "ここまでの教師の演出が，生徒の「先生は"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "次の式（板書参照）を素早く計算できるしくみを考えよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 15,
            "title": "数の性質を証明しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文字を用いた式で数量及び数量の関係を捉え説明できることを理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　連続した２つの偶数の積に１をたすと，どんな数になるだろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "久し振りの文字式の証明で，どうすればい"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "連続した２つの偶数の積に１をたすと，２つの偶数の間にある奇数の２乗になる",
                  "answer": "各自で解答を確認する。",
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
            "hour": 16,
            "title": "面積をくらべよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文字を用いた式で数量及び数量の関係を捉え説明できることを理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　２辺の長さがa㎝とb㎝の長方形のベンチを，下の四角形ABCD とEFGH のよ",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "裏にマグネットをつけた長方形を14個準備しておき，四角形をつくります。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "問題を解決するための見通しを立てます。・a とb を使って，四角形P とQ の面積を表し，",
                  "answer": "各自で解答を確認する。",
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
            "hour": 17,
            "title": "公式が正しいか確かめよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "文字を用いた式で数量及び数量の関係を捉え説明できることを理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　道の面積を求める公式S＝aℓが，いつでも成り立つことを証明しよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "まず，なぜこのような公式を考えるのか，"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "課題",
                  "text": "円をほかの図形に変えても，道の面積を求める公式は成り立つだろうか。",
                  "answer": "各自で解答を確認する。",
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
          }
        ]
      },
      {
        "id": "u_3_2",
        "unitName": "第2章 平方根と無理数",
        "totalHours": 14,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "正方形の面積と辺の長さを求めよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根の必要性と意味を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　１㎝の方眼紙を使って，いろいろな大きさの正方形をつくろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "（2）と（3）の四角形が正方形であることの"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "次の（1）～（3）（板書参照）の正方形の面積と１辺の長さを求めよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 2,
            "title": "いろいろな数の平方根を求めよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根の必要性と意味を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　平方根を根号を用いないで表すことができるのは，どんな数だろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "平方根の意味を理解していれば簡単な問題"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の数（板書参照）の平方根を求めよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 3,
            "title": "根号を使って平方根を表そう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "根号を用いて数の平方根を表すことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>課題</strong>　根号を使って平方根を表そう",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "課題では，ICT を活用して正方形をつくってもよいでしょう。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "title": "$\\sqrt{2}$ や $\\sqrt{3}$ の近似値を求めよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根の近似値を求めることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題２　$\\sqrt{3}$ を小数で表そう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "問題１の解決方法を参考にしながら，問題２の解決に取り組めるようにします。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 5,
            "title": "数の世界のひろがりについて考えよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "有理数と無理数について理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　2 や3 も，分数で表すことがで",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "この問題を生徒に解決させることは困難で"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "2 や3 も，分数で表すことができるだろうか。",
                  "answer": "各自で解答を確認する。",
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
            "title": "求めた値の正確さを考えよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "誤差や近似値，$a\\times10^n$ の形の表し方を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　ある無理数を小数で表して，小数第 １位で四捨五入して近似値を求めたら32にな",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "ここで指導する内容はトピック的で，生徒"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "（ここに板書の問題を入力してください）",
                  "answer": "各自で解答を確認する。",
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
            "title": "$\\sqrt{\\quad}$ のついた数の乗除の計算の仕方を考えよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を含む簡単な式の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　a× bはどのように計算すればよいだろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "問題１を生徒に委ねて解決させることはな"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "どんな数でも，a× b＝a×b が成り立つことを説明しよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 8,
            "title": "$\\sqrt{\\quad}$ のついた数の乗除の計算をしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を含む簡単な式の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の計算（板書参照）をしよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "（3）と（4）の計算は，次の指導につなげる"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "title": "$\\sqrt{\\quad}$ の中の数を外に出そう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を含む簡単な式の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の数（板書参照）のの中を簡単な数にしよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "教師が次々問題を与えるだけではなく，発"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の計算（板書参照）をしよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 10,
            "title": "$\\sqrt{\\quad}$ のついた数の大きさをくらべよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "分母の有理化について理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　1",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "この比較は，生徒が16 について考える"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "1 2 ，13 ，16 の中で一番大きい数は ",
                  "answer": "各自で解答を確認する。",
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
            "hour": 11,
            "title": "$\\sqrt{\\quad}$ のついた数の近似値を求めよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を含む簡単な式の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題２　次の数（板書参照）のの外の数を中に入れよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "根号の外の数が２乗されて根号の中に入ったことがわかるように，数の対応関係を明確に示します。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "課題",
                  "text": "次ののついた数（板書参照）の近似値を求めよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 12,
            "title": "$\\sqrt{\\quad}$ のついた数の加減の計算をしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を含む式の加法・減法の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題２　次の計算（板書参照）をしよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "面積が８の正方形の図は，事前につくっておいて提示します。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 13,
            "title": "長方形の面積を求めよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を含む簡単な式の計算をすることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　右の図（板書参照）で，正方形 ABCD＝６（㎝",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "ここからは，各自で解決に取り組ませても"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の計算（板書参照）をしよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 14,
            "title": "$\\sqrt{\\quad}$ のついた数を見つけよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "数の平方根を具体的な場面で活用することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　Ａ４判の長方形ABCD の２辺の長さの比を求めよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "学校生活でも利用する機会の多いＡ４判の"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "Ａ４判の長方形は，隣り合う２辺の比が，１：2 になるようにつくられている",
                  "answer": "各自で解答を確認する。",
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
          }
        ]
      },
      {
        "id": "u_3_3",
        "unitName": "第3章 2次方程式と解の公式",
        "totalHours": 11,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "方程式をアップグレードしよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二次方程式の必要性と意味及びその解の意味を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　これまでにどんな方程式を学習しただろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "連立方程式を一次方程式から発展的に考え"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "上の二次方程式（板書参照）を解いてみよう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 2,
            "title": "二次方程式の解き方を考えよう①",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二次方程式を，式を変形して解く方法を考えることができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "課題　二次方程式を，一次方程式や連立方程",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "教師が式変形の仕方を一方的に示すのでは"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "課題",
                  "text": "二次方程式を，一次方程式や連立方程式のように，式を変形して解くことはできな",
                  "answer": "各自で解答を確認する。",
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
            "hour": 3,
            "title": "二次方程式の解き方を考えよう②",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "平方の形に変形して二次方程式を解くことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　次の（1）と（2）の二次方程式（板書参照）を解く方法を考えよう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "ここで行っているのは，式を目的の形に変"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "title": "解の公式をつくろう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "解の公式を知り，それを用いて二次方程式を解くことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の二次方程式（板書参照）を解こう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "前時に指導した方法で解くといっても，こ"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の二次方程式（板書参照）を解こう。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 5,
            "title": "解の公式で解こう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "解の公式を知り，それを用いて二次方程式を解くことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次の（1）〜（3）の二次方程式（板書参照）を解の公式を使って解こう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "ここで，教師が（1）の二次方程式を平方の"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "次の方程式を解こう。 　　　　 x（５x－１）＝－３x＋４",
                  "answer": "各自で解答を確認する。",
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
            "title": "どうして解けるのか考えよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "因数分解して二次方程式を解くことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　先生の解き方で二次方程式が解けるのはなぜだろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "生徒に自力で解決することを求める問題で"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "title": "因数分解で解こう①",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "因数分解して二次方程式を解くことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　次の（1）〜（4）（板書参照）の二次方程式を因数分解を使って解こう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "条件を変えて新しい問題を生み出し，「ち"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 8,
            "title": "解き方を選んで二次方程式を解こう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二次方程式を，式の特徴に応じて適切な方法で解くことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>課題</strong>　解き方を選んで二次方程式を解こう",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "解の公式を使った解き方と因数分解を使った解き方を比較できるように板書します。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "title": "プールをつくろう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二次方程式を具体的な場面で活用することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　ある公園に新たにプールをつくることになった。長方形の土地に，縦の長さが",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "解の吟味は，一次方程式や連立方程式の指"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "問題を解決することを伝えます（有効性）。・まず，「1数量の関係を見つける」と板書し，",
                  "answer": "各自で解答を確認する。",
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
            "hour": 10,
            "title": "整数の問題を二次方程式で解こう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二次方程式を具体的な場面で活用することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　連続した３つの整数の中で，小さい方の２数の積が３数の和に等しくなるような",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "「何を文字で表すか」から生徒に自由に考"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "連続した３つの整数の中で，大きい方の２数の積が３数の和に等しくなるような",
                  "answer": "各自で解答を確認する。",
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
            "hour": 11,
            "title": "線分の長さを求めよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "二次方程式を具体的な場面で活用することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１を印刷したワークシートを生徒に配付します。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "どこから生徒に任せて解決に取り組ませる"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "右の図のように， １辺の長さが20㎝の正方",
                  "answer": "各自で解答を確認する。",
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
          }
        ]
      },
      {
        "id": "u_3_4",
        "unitName": "第4章 関数 $y=ax^2$",
        "totalHours": 13,
        "bookRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY",
        "pointRef": "https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx",
        "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
        "lessons": [
          {
            "hour": 1,
            "title": "関数 $y=ax^2$ の表と式",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "事象の中には関数 $y=ax^2$ として捉えられるものがあることを知る。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　右の図（板書参照）のように，AB の長さがBC の長さの２倍である長方形ABCD",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "生徒にとって久しぶりの関数の学習です。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "左の図（板書参照）の長方形ABCD の面積もBC の長さに比例するだろうか。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 2,
            "title": "$y$ が $x$ の2乗に比例する関数",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$ の意味を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　関数y＝３x と関数y＝３x²の変化と",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "既習の比例と比較しながら考えることは，"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "（ここに板書の問題を入力してください）",
                  "answer": "各自で解答を確認する。",
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
            "hour": 3,
            "title": "関数 $y=ax^2$ のグラフ",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$ のグラフの特徴を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　関数y＝x²のグラフは，右の図（板書",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "第２学年までの指導で，表の対応するx"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "関数y＝ax²のグラフの特徴をまと",
                  "answer": "各自で解答を確認する。",
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
            "title": "関数 $y=ax^2$（$a>0$）のグラフ",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$（$a>0$）のグラフをかくことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　左の表（板書参照）と，右の関数y ＝x",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "問題１を生徒に任せて解決させることはな"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "（ここに板書の問題を入力してください）",
                  "answer": "各自で解答を確認する。",
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
            "hour": 5,
            "title": "関数 $y=ax^2$（$a<0$）のグラフ",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$（$a<0$）のグラフをかくことができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　右の関数y＝x²のグラフ（板書参照）",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "前時の授業で問題を解決する際に用いた，"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "関数y＝２x²と関数y＝1",
                  "answer": "各自で解答を確認する。",
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
            "title": "比例定数とグラフの関係を調べよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "比例定数 $a$ の値とグラフの開き方・向きの関係を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題２　右の図（板書参照）は，４つの関数 y＝３x",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "問題１では，ICT を活用して，比例定数によるグラフの変化を視覚的に捉えられるようにします。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "title": "2乗に比例するとみなして問題を解決しよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "具体的な事象を関数 $y=ax^2$ とみなして問題を解決することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　右上の表（板書参照）は，ある自動車を使って行った走行実験の結果を，時速x㎞",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "重要な公式や手順を確認し、ミスしやすい点に注意する。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 8,
            "title": "関数 $y=ax^2$ の値の増減",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$ の値の増減を理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　次のア〜エの関数うち，下の（1），",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "これまでは，x とy の値の対応の状況に着"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題１",
                  "text": "次のア〜エの関数うち，下の（1），（2）に当てはまるのはどれだろう。",
                  "answer": "各自で解答を確認する。",
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
            "title": "関数 $y=ax^2$ の変域",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$ の変域を求めることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　関数y＝1 2 x２について，x の変域が\u0001",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "変域は既習事項であり，これまでは２年生"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題",
                  "text": "問題に取り組ませます。その際，x の変域を複数設定して，x＝０を含む場合と含まない場合",
                  "answer": "各自で解答を確認する。",
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
            "hour": 10,
            "title": "関数 $y=ax^2$ の変化の割合",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$ の変化の割合を求めることができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題　上の表（板書参照）で，x の値を大きくしていくと，y＝1",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "生徒に任せて解決させるのは難しいでしょ"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 11,
            "title": "平均の速さ",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "関数 $y=ax^2$ の変化の割合を平均の速さとして捉え，説明することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　この実験では，y がx²に比例する",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "ここでは，y がx"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "課題",
                  "text": "ボールが斜面を転がる速さを求めることはできるだろうか？",
                  "answer": "各自で解答を確認する。",
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
            "hour": 12,
            "title": "2つの関数を比べよう",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "2つの関数の対応表とグラフを対比して，関数の特徴を考察することができる。（思・判・表）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "<strong>課題</strong>　2つの関数を比べよう",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "２組の対応表とグラフを，対比しながら考察できるようにします。"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問 1",
                  "text": "本時の内容に関連する練習問題を解きなさい。",
                  "answer": "各自で解答を確認する。",
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
            "hour": 13,
            "title": "グラフが階段状になる関数",
            "leftBlocks": [
              {
                "type": "objective",
                "data": {
                  "text": "いろいろな事象の中に，関数関係があることを理解することができる。（知・技）"
                }
              },
              {
                "type": "board-task",
                "data": {
                  "qNum": "【本時の課題】",
                  "text": "問題１　荷物の重さがxg のときの料金をy 円とすると，x とy の間にはどのような関係",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "板書まとめ",
                  "title": "本時のまとめ",
                  "content": "これまでとはまったく異なった特徴をもつ"
                }
              }
            ],
            "rightBlocks": [
              {
                "type": "question",
                "data": {
                  "qNum": "問題２",
                  "text": "Ｂ運送の料金が下の表（板書参照）の通りであるとき，Ａ，Ｂどちらを利用すれ",
                  "answer": "各自で解答を確認する。",
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

// ============================================================
// ============================================================
// 授業プリント（B4見開き）: テンプレート管理・描画・編集UX v2
// ============================================================

const LESSON_TEMPLATE_KEY = 'math_portal_lesson_templates';

function getLessonTemplates() {
  try {
    return JSON.parse(localStorage.getItem(LESSON_TEMPLATE_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function lessonTemplateKey(grade, unitId, hour) {
  return grade + '_' + unitId + '_' + hour;
}

function getCustomLessonTemplate(grade, unitId, hour) {
  return getLessonTemplates()[lessonTemplateKey(grade, unitId, hour)] || null;
}

function stripBlockIds(blocks) {
  return (blocks || []).map(b => ({ type: b.type, data: JSON.parse(JSON.stringify(b.data || {})) }));
}

function saveCurrentAsLessonTemplate() {
  flushActiveEditableB4();
  const titleEl = document.getElementById('paperTitle');
  const rawTitle = titleEl ? (titleEl.getAttribute('data-raw') || titleEl.textContent || '').trim() : '';
  const all = getLessonTemplates();
  all[lessonTemplateKey(currentB4Grade, currentB4UnitId, currentB4Hour)] = {
    title: rawTitle,
    leftBlocks: stripBlockIds(state.blocksLeft),
    rightBlocks: stripBlockIds(state.blocksRight),
    savedAt: new Date().toLocaleString('ja-JP')
  };
  localStorage.setItem(LESSON_TEMPLATE_KEY, JSON.stringify(all));
  setB4Dirty(false);
  refreshB4HourDropdownLabels();
  updateTemplateStatusUI();
  showToast('<i class="fa-solid fa-circle-check text-success"></i> 第' + currentB4Hour + '時のテンプレートを上書き保存しました（次回からこの内容で開きます）');
}

function resetLessonTemplateToDefault() {
  const key = lessonTemplateKey(currentB4Grade, currentB4UnitId, currentB4Hour);
  const all = getLessonTemplates();
  if (!all[key]) {
    showToast('この時間は初期テンプレートのままです');
    return;
  }
  if (!confirm('この時間の編集済みテンプレートを削除し、初期テンプレートに戻しますか？')) return;
  delete all[key];
  localStorage.setItem(LESSON_TEMPLATE_KEY, JSON.stringify(all));
  setB4Dirty(false);
  refreshB4HourDropdownLabels();
  loadBoardLessonPreset(currentB4Grade, currentB4UnitId, currentB4Hour, true);
  showToast('<i class="fa-solid fa-rotate-left"></i> 初期テンプレートに戻しました');
}

function setB4Dirty(flag) {
  state.b4Dirty = !!flag;
  updateTemplateStatusUI();
}

function confirmDiscardB4() {
  if (!state.b4Dirty) return true;
  return confirm('保存していない変更があります。\n変更を破棄して別の時間に切り替えますか？\n（残す場合は「キャンセル」→「テンプレート保存」）');
}

function updateTemplateStatusUI() {
  const custom = getCustomLessonTemplate(currentB4Grade, currentB4UnitId, currentB4Hour);
  const chips = document.querySelectorAll('.js-template-status');
  chips.forEach(chip => {
    chip.classList.toggle('is-custom', !!custom);
    chip.classList.toggle('is-dirty', !!state.b4Dirty);
    let html;
    if (state.b4Dirty) {
      html = '<i class="fa-solid fa-circle-exclamation"></i> 未保存の変更あり';
    } else if (custom) {
      const datePart = custom.savedAt ? custom.savedAt.split(' ')[0] : '';
      html = '<i class="fa-solid fa-star"></i> 編集保存済' + (datePart ? ' (' + datePart + ')' : '');
    } else {
      html = '<i class="fa-regular fa-file-lines"></i> 初期テンプレート';
    }
    chip.innerHTML = html;
  });
  const resetBtns = document.querySelectorAll('.js-template-reset');
  resetBtns.forEach(btn => { btn.disabled = !custom; });
}

// ---- 元に戻す（Undo）----
const B4_HISTORY_LIMIT = 40;
let b4History = [];

function pushB4History() {
  b4History.push(JSON.stringify({ l: state.blocksLeft || [], r: state.blocksRight || [] }));
  if (b4History.length > B4_HISTORY_LIMIT) b4History.shift();
  updateUndoButtonUI();
}

function undoB4() {
  if (!b4History.length) {
    showToast('これ以上元に戻せません');
    return;
  }
  const snap = JSON.parse(b4History.pop());
  state.blocksLeft = snap.l;
  state.blocksRight = snap.r;
  syncB4Blocks();
  setB4Dirty(true);
  renderWorksheetB4();
  updateUndoButtonUI();
}

function updateUndoButtonUI() {
  const btn = document.getElementById('b4UndoBtn');
  if (btn) btn.disabled = b4History.length === 0;
}

function syncB4Blocks() {
  state.blocks = [...(state.blocksLeft || []), ...(state.blocksRight || [])];
}

function escapeHtmlB4(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ドロップダウンoption用の簡易TeXプレーンテキスト化
function stripTeXForOption(str) {
  return String(str || '')
    .replace(/\$y=ax\^2\$/g, 'y=ax²')
    .replace(/\$ax\+by=c\$/g, 'ax+by=c')
    .replace(/\$y=ax\+b\$/g, 'y=ax+b')
    .replace(/\$x\^2\+\(a\+b\)x\+ab\$/g, 'x²+(a+b)x+ab')
    .replace(/\$\\sqrt\{2\}\$/g, '√2')
    .replace(/\$\\sqrt\{3\}\$/g, '√3')
    .replace(/\$\\sqrt\{\\quad\}\$/g, '√')
    .replace(/\$a>0\$/g, 'a>0')
    .replace(/\$a<0\$/g, 'a<0')
    .replace(/\$y\$/g, 'y')
    .replace(/\$x\$/g, 'x')
    .replace(/\$([^\$]+)\$/g, '$1');
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
  currentB4Hour = lesson.hour;

  const custom = getCustomLessonTemplate(currentB4Grade, currentB4UnitId, currentB4Hour);
  const source = custom || lesson;

  const rawTitle = (custom && custom.title) || lesson.title;
  const titleEl = document.getElementById('paperTitle');
  if (titleEl) {
    titleEl.setAttribute('data-raw', rawTitle);
    titleEl.innerHTML = rawTitle;
  }

  const gradeBadge = document.getElementById('paperGradeBadge');
  if (gradeBadge) gradeBadge.textContent = '第' + currentB4Grade + '学年 数学科 授業プリント';

  const unitBadge = document.getElementById('paperUnitBadge');
  if (unitBadge) {
    unitBadge.setAttribute('data-raw', unit.unitName);
    unitBadge.innerHTML = unit.unitName;
  }

  const hourBadge = document.getElementById('paperHourBadge');
  if (hourBadge) hourBadge.textContent = '第 ' + lesson.hour + ' 時 / 全 ' + unit.totalHours + ' 時';

  const noBadge = document.getElementById('paperNoDisplay');
  if (noBadge) noBadge.textContent = 'No. ' + lesson.hour;

  const footerCode = document.getElementById('footerLessonCode');
  if (footerCode) footerCode.textContent = 'M' + currentB4Grade + '-' + currentB4UnitId.replace(/^u_\d+_/, 'U') + '-L' + lesson.hour;

  const classCell = document.querySelector('.sheet-student-info .class-cell');
  if (classCell && classCell.firstChild && classCell.firstChild.nodeType === 3) {
    classCell.firstChild.textContent = currentB4Grade + '年 ';
  }

  state.blocksLeft = JSON.parse(JSON.stringify(source.leftBlocks || [])).map(b => {
    b.id = generateBlockId();
    if (b.type === 'graph-block' && !b.data.svgHtml) {
      b.data.svgHtml = generateLinearSvg(2, 1, true, true, 190, 180);
    }
    return b;
  });
  state.blocksRight = JSON.parse(JSON.stringify(source.rightBlocks || [])).map(b => {
    b.id = generateBlockId();
    if (b.type === 'graph-block' && !b.data.svgHtml) {
      b.data.svgHtml = generateLinearSvg(2, 1, true, true, 190, 180);
    }
    return b;
  });
  syncB4Blocks();

  b4History = [];
  updateUndoButtonUI();
  state.b4Dirty = false;

  updateB4SelectorUI();
  renderWorksheetB4();
  updateTemplateStatusUI();

  if (!isInitialLoad) {
    showToast('<i class="fa-solid fa-wand-magic-sparkles text-primary"></i> 第' + lesson.hour + '時を開きました' + (custom ? '（編集済み）' : ''));
  }
}

// ---- 描画 ----
function renderWorksheetB4() {
  const leftCol = document.getElementById('blocksLeftCol');
  const rightCol = document.getElementById('blocksRightCol');
  if (!leftCol || !rightCol) return;

  leftCol.innerHTML = renderBlockColumn(state.blocksLeft || [], 'left');
  rightCol.innerHTML = renderBlockColumn(state.blocksRight || [], 'right');

  const sheet = document.getElementById('printableSheet');
  if (sheet && typeof applyKaTeXIfAvailable === 'function') {
    applyKaTeXIfAvailable(sheet);
  }

  const titleEl = document.getElementById('paperTitle');
  if (titleEl && typeof applyKaTeXIfAvailable === 'function') {
    const raw = titleEl.getAttribute('data-raw') || titleEl.textContent;
    titleEl.innerHTML = raw;
    applyKaTeXIfAvailable(titleEl);
  }

  const unitBadge = document.getElementById('paperUnitBadge');
  if (unitBadge && typeof applyKaTeXIfAvailable === 'function') {
    const raw = unitBadge.getAttribute('data-raw') || unitBadge.textContent;
    unitBadge.innerHTML = raw;
    applyKaTeXIfAvailable(unitBadge);
  }

  ensureSortableB4();
  initB4EditingHandlers();
}

function fmtB4(str) {
  return String(str ?? '').replace(/\r?\n/g, '<br>');
}

function editB4(field, placeholder, mode = 'html') {
  return 'contenteditable="true" spellcheck="false" data-field="' + field + '" data-mode="' + mode + '" data-placeholder="' + placeholder + '"';
}

function renderBlockColumn(blocks, colSide) {
  const emptyHtml = '<div class="empty-col-drop" onclick="addBlockToSide(\'question\', \'' + colSide + '\')"><i class="fa-solid fa-plus"></i> ここにパーツを追加（またはドラッグして移動）</div>';
  if (blocks.length === 0) return emptyHtml;

  return blocks.map((block, index) => {
    const d = block.data || {};
    let html = '';

    if (block.type === 'objective') {
      html = `
        <div class="objective-box" ${d.customHeight ? `style="min-height: ${d.customHeight}px;"` : ''}>
          <span class="objective-label"><i class="fa-solid fa-bullseye"></i> めあて</span>
          <div class="objective-text" ${editB4('text', '本時のめあてを入力')}>${fmtB4(d.text)}</div>
        </div>`;
    } else if (block.type === 'review') {
      html = `
        <div class="review-box" ${d.customHeight ? `style="min-height: ${d.customHeight}px;"` : ''}>
          <div class="review-title"><i class="fa-solid fa-clock-rotate-left"></i><span ${editB4('title', '見出し', 'text')}>${escapeHtmlB4(d.title)}</span></div>
          <div class="review-body" ${editB4('content', '復習の内容を入力')}>${fmtB4(d.content)}</div>
        </div>`;
    } else if (block.type === 'board-task') {
      html = `
        <div class="board-task-box">
          <div class="board-task-header">
            <span class="board-task-badge"><i class="fa-solid fa-chalkboard-user"></i><span ${editB4('qNum', '見出し', 'text')}>${escapeHtmlB4(d.qNum)}</span></span>
            <div class="board-task-text" ${editB4('text', '課題・問題文を入力')}>${fmtB4(d.text)}</div>
          </div>
          ${d.guide ? `
          <div class="board-task-guide"><i class="fa-solid fa-compass"></i><div ${editB4('guide', '見通し・ヒント')}>${fmtB4(d.guide)}</div></div>` : ''}
          <div class="board-task-canvas" style="min-height: ${d.thinkingSpaceHeight || 85}px;">
            <div class="canvas-grid-label">自分の考え・途中式</div>
            <div class="answer-text answer-block"><span class="answer-tag">解答例</span><div ${editB4('answer', '解答例を入力')}>${fmtB4(d.answer)}</div></div>
          </div>
        </div>`;
    } else if (block.type === 'point-box') {
      html = `
        <div class="point-summary-box">
          <div class="point-summary-header">
            <span class="point-badge"><i class="fa-solid fa-bookmark"></i> ${escapeHtmlB4(d.badge || 'まとめ')}</span>
            <strong ${editB4('title', '見出し', 'text')}>${escapeHtmlB4(d.title)}</strong>
          </div>
          <div class="point-summary-body" ${editB4('content', 'まとめを入力')} style="min-height: ${d.customHeight || 40}px;">${fmtB4(d.content)}</div>
        </div>`;
    } else if (block.type === 'question' || block.type === 'graph-block' || block.type === 'geometry-block') {
      const body = `
          <div class="q-header">
            <span class="q-num" ${editB4('qNum', '問', 'text')}>${escapeHtmlB4(d.qNum)}</span>
            <div class="q-body" ${editB4('text', '問題文を入力')}>${fmtB4(d.text)}</div>
          </div>
          <div class="answer-space" style="min-height: ${d.spaceHeight || 50}px;">
            <div class="answer-text answer-block"><span class="answer-tag">解答例</span><div ${editB4('answer', '解答例を入力')}>${fmtB4(d.answer)}</div></div>
          </div>`;
      html = d.svgHtml
        ? `<div class="question-item"><div class="graph-question-layout"><div>${body}</div><div class="sheet-svg-wrapper">${d.svgHtml}</div></div></div>`
        : `<div class="question-item">${body}</div>`;
    } else if (block.type === 'summary') {
      html = `
        <div class="summary-box" ${d.customHeight ? `style="min-height: ${d.customHeight}px;"` : ''}>
          <div class="summary-header"><i class="fa-solid fa-lightbulb"></i><span ${editB4('title', '見出し', 'text')}>${escapeHtmlB4(d.title)}</span></div>
          <div class="summary-content" ${editB4('content', 'まとめを入力')}>${fmtB4(d.content)}</div>
        </div>`;
    } else if (block.type === 'reflection') {
      html = `
        <div class="reflection-box">
          <div class="reflection-scales">
            <strong ${editB4('title', '見出し', 'text')}>${escapeHtmlB4(d.title)}</strong>
            <div class="scale-options">理解度: <span>A よくわかった</span><span>B だいたい</span><span>C もう少し</span></div>
          </div>
          <div class="reflection-comment-line" ${d.customHeight ? `style="min-height: ${d.customHeight}px;"` : ''}>今日の授業で学んだこと・疑問点:</div>
        </div>`;
    }

    return `
      <div class="sheet-block" id="${block.id}" data-col="${colSide}" data-index="${index}" data-type="${block.type}">
        <div class="block-drag-grip drag-handle no-print" title="ドラッグして移動（左右の面にも移動できます）"><i class="fa-solid fa-grip-vertical"></i></div>
        <div class="block-hover-controls no-print">
          <button class="block-ctrl-btn drag-handle" title="ドラッグして移動"><i class="fa-solid fa-up-down-left-right"></i></button>
          <button class="block-ctrl-btn" onclick="moveColBlock('${colSide}', ${index}, -1)" title="上へ"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="block-ctrl-btn" onclick="moveColBlock('${colSide}', ${index}, 1)" title="下へ"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="block-ctrl-btn" onclick="transferColBlock('${colSide}', ${index})" title="${colSide === 'left' ? '右' : '左'}の面へ移動"><i class="fa-solid fa-arrows-left-right"></i></button>
          <button class="block-ctrl-btn" onclick="duplicateColBlock('${colSide}', ${index})" title="複製"><i class="fa-regular fa-copy"></i></button>
          <button class="block-ctrl-btn danger" onclick="removeColBlock('${colSide}', ${index})" title="削除"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        ${html}
        <div class="sheet-resize-handle no-print" data-col="${colSide}" data-index="${index}" title="ドラッグして高さを変更">
          <div class="resize-handle-pill"><i class="fa-solid fa-grip-lines"></i></div>
        </div>
      </div>`;
  }).join('');
}

// ---- KaTeX数式を含むHTMLからTeXコードを復元して保存する関数 ----
function extractHtmlWithTeX(element) {
  if (!element) return '';
  const clone = element.cloneNode(true);
  const katexEls = clone.querySelectorAll('.katex');
  katexEls.forEach(k => {
    const ann = k.querySelector('annotation[encoding="application/x-tex"]') || k.querySelector('annotation');
    const tex = ann ? ann.textContent.trim() : (k.getAttribute('data-tex') || '');
    const textNode = document.createTextNode(tex ? `$${tex}$` : '');
    k.replaceWith(textNode);
  });
  return clone.innerHTML.replace(/(<br\s*\/?>\s*)+$/i, '').trim();
}

// ---- 編集イベント ----
let b4EditingInitialized = false;
let b4EditSnapshotTaken = false;

function getEditTarget(el) {
  if (!el || !el.closest) return null;
  const editable = el.closest('[data-field][contenteditable="true"]');
  if (!editable) return null;
  const blockEl = editable.closest('.sheet-block[data-col]');
  if (!blockEl) return null;
  return {
    editable,
    col: blockEl.getAttribute('data-col'),
    index: parseInt(blockEl.getAttribute('data-index'), 10),
    field: editable.getAttribute('data-field'),
    mode: editable.getAttribute('data-mode') || 'html'
  };
}

function readEditableValue(t) {
  if (t.mode === 'text') return t.editable.innerText.replace(/\n+$/, '').trim();
  return extractHtmlWithTeX(t.editable);
}

function initB4EditingHandlers() {
  if (b4EditingInitialized) return;
  const sheet = document.getElementById('printableSheet');
  if (!sheet) return;
  b4EditingInitialized = true;

  // フォーカス時: 以前の数式コード化（innerHTML = fmtB4）は完全撤廃！
  // KaTeXの美しい描画のまま、テキストをクリックして快適に編集できる。
  sheet.addEventListener('focusin', (e) => {
    const t = getEditTarget(e.target);
    if (!t) return;
    b4EditSnapshotTaken = false;
    t.editable.classList.add('is-editing');
  });

  sheet.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'paperTitle') {
      e.target.setAttribute('data-raw', e.target.innerText.trim());
      setB4Dirty(true);
      return;
    }
    const t = getEditTarget(e.target);
    if (!t) return;
    if (!b4EditSnapshotTaken) {
      pushB4History();
      b4EditSnapshotTaken = true;
    }
    updateColBlockData(t.col, t.index, t.field, readEditableValue(t));
  });

  // フォーカスが外れたら数式を再レンダリング
  sheet.addEventListener('focusout', (e) => {
    if (e.target && e.target.id === 'paperTitle') {
      const raw = e.target.getAttribute('data-raw') || e.target.innerText.trim();
      e.target.innerHTML = raw;
      if (typeof applyKaTeXIfAvailable === 'function') {
        applyKaTeXIfAvailable(e.target);
      }
      return;
    }
    const t = getEditTarget(e.target);
    if (!t) return;
    t.editable.classList.remove('is-editing');
    if (b4EditSnapshotTaken) {
      updateColBlockData(t.col, t.index, t.field, readEditableValue(t));
    }
    if (typeof applyKaTeXIfAvailable === 'function') {
      setTimeout(() => applyKaTeXIfAvailable(t.editable), 10);
    }
  });

  // 貼り付けは書式を除去してプレーンテキスト化
  sheet.addEventListener('paste', (e) => {
    const t = getEditTarget(e.target);
    if (!t) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  // 1行見出し系のフィールドでは Enter で確定
  sheet.addEventListener('keydown', (e) => {
    const t = getEditTarget(e.target);
    if (t && t.mode === 'text' && e.key === 'Enter') {
      e.preventDefault();
      t.editable.blur();
    }
  });

  // タイトル（#paperTitle）のクリック編集制御
  const paperTitleEl = document.getElementById('paperTitle');
  if (paperTitleEl) {
    paperTitleEl.addEventListener('focus', () => {
      const raw = paperTitleEl.getAttribute('data-raw');
      if (raw) paperTitleEl.textContent = raw;
    });
  }

  // 数式（.katex）クリックで数式編集ポップオーバーを起動
  sheet.addEventListener('dblclick', (e) => {
    const katexEl = e.target.closest('.katex');
    if (katexEl) {
      e.preventDefault();
      e.stopPropagation();
      openMathEditorPopover(katexEl);
    }
  });

  // キーボードショートカット: Ctrl+S = テンプレート保存 / Ctrl+Z = 元に戻す
  document.addEventListener('keydown', (e) => {
    const tab = document.getElementById('tab-worksheet');
    if (!tab || !tab.classList.contains('active')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveCurrentAsLessonTemplate();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      if (document.activeElement && document.activeElement.isContentEditable) return;
      e.preventDefault();
      undoB4();
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (state.b4Dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ---- 数式編集ポップオーバー機能 ----
let mathEditorEl = null;
let currentEditingKatex = null;

function openMathEditorPopover(katexEl) {
  if (!katexEl) return;
  currentEditingKatex = katexEl;
  const ann = katexEl.querySelector('annotation[encoding="application/x-tex"]') || katexEl.querySelector('annotation');
  const currentTex = ann ? ann.textContent.trim() : (katexEl.getAttribute('data-tex') || '');

  if (!mathEditorEl) {
    mathEditorEl = document.createElement('div');
    mathEditorEl.className = 'math-popover-editor no-print';
    mathEditorEl.innerHTML = `
      <div class="math-popover-header">
        <span><i class="fa-solid fa-square-root-variable text-primary"></i> 数式を編集（LaTeX）</span>
        <button type="button" class="math-popover-close" onclick="closeMathEditorPopover()">&times;</button>
      </div>
      <div class="math-popover-body">
        <input type="text" class="math-tex-input" id="mathPopoverInput" placeholder="TeXコード (例: 3a+2b)" />
        <div class="math-popover-preview" id="mathPopoverPreview"></div>
      </div>
      <div class="math-popover-footer">
        <button type="button" class="btn btn-xs btn-outline" onclick="closeMathEditorPopover()">キャンセル</button>
        <button type="button" class="btn btn-xs btn-primary-solid" onclick="applyMathEditorPopover()">決定 (Enter)</button>
      </div>
    `;
    document.body.appendChild(mathEditorEl);

    const input = mathEditorEl.querySelector('#mathPopoverInput');
    input.addEventListener('input', () => {
      const prev = mathEditorEl.querySelector('#mathPopoverPreview');
      if (prev && typeof katex !== 'undefined') {
        try {
          katex.render(input.value || ' ', prev, { throwOnError: false });
        } catch (e) {
          prev.textContent = input.value;
        }
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyMathEditorPopover();
      } else if (e.key === 'Escape') {
        closeMathEditorPopover();
      }
    });
  }

  const rect = katexEl.getBoundingClientRect();
  const input = mathEditorEl.querySelector('#mathPopoverInput');
  input.value = currentTex;
  mathEditorEl.style.display = 'block';

  let top = rect.top + window.scrollY - mathEditorEl.offsetHeight - 8;
  if (top < window.scrollY + 10) top = rect.bottom + window.scrollY + 8;
  let left = rect.left + window.scrollX + (rect.width / 2) - 140;
  left = Math.max(10, Math.min(window.innerWidth - 300, left));

  mathEditorEl.style.top = top + 'px';
  mathEditorEl.style.left = left + 'px';

  const prev = mathEditorEl.querySelector('#mathPopoverPreview');
  if (prev && typeof katex !== 'undefined') {
    try { katex.render(currentTex || ' ', prev, { throwOnError: false }); } catch (e) {}
  }
  setTimeout(() => input.focus(), 50);
}

function closeMathEditorPopover() {
  if (mathEditorEl) mathEditorEl.style.display = 'none';
  currentEditingKatex = null;
}

function applyMathEditorPopover() {
  if (!mathEditorEl || !currentEditingKatex) return;
  const input = mathEditorEl.querySelector('#mathPopoverInput');
  const newTex = (input?.value || '').trim();
  const editable = currentEditingKatex.closest('[contenteditable="true"]');
  const t = getEditTarget(editable);

  if (newTex) {
    const textNode = document.createTextNode(`$${newTex}$`);
    currentEditingKatex.replaceWith(textNode);
  } else {
    currentEditingKatex.remove();
  }

  closeMathEditorPopover();

  if (editable && t) {
    pushB4History();
    updateColBlockData(t.col, t.index, t.field, extractHtmlWithTeX(editable));
    if (typeof applyKaTeXIfAvailable === 'function') {
      applyKaTeXIfAvailable(editable);
    }
  }
}

function flushActiveEditableB4() {
  const t = getEditTarget(document.activeElement);
  if (t) updateColBlockData(t.col, t.index, t.field, readEditableValue(t));
}

// ---- ブロック操作 ----
function updateColBlockData(colSide, index, field, value) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (blocks && blocks[index]) {
    if (!blocks[index].data) blocks[index].data = {};
    if (blocks[index].data[field] === value) return;
    blocks[index].data[field] = value;
    syncB4Blocks();
    if (!state.b4Dirty) setB4Dirty(true);
  }
}

function moveColBlock(colSide, index, direction) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= blocks.length) return;
  pushB4History();
  [blocks[index], blocks[targetIndex]] = [blocks[targetIndex], blocks[index]];
  syncB4Blocks();
  setB4Dirty(true);
  renderWorksheetB4();
}

function transferColBlock(colSide, index) {
  const source = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  const target = colSide === 'left' ? state.blocksRight : state.blocksLeft;
  if (!source[index]) return;
  pushB4History();
  target.push(source.splice(index, 1)[0]);
  syncB4Blocks();
  setB4Dirty(true);
  renderWorksheetB4();
}

function duplicateColBlock(colSide, index) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (!blocks[index]) return;
  pushB4History();
  const copy = JSON.parse(JSON.stringify(blocks[index]));
  copy.id = generateBlockId();
  blocks.splice(index + 1, 0, copy);
  syncB4Blocks();
  setB4Dirty(true);
  renderWorksheetB4();
}

function removeColBlock(colSide, index) {
  const blocks = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (!blocks[index]) return;
  pushB4History();
  blocks.splice(index, 1);
  syncB4Blocks();
  setB4Dirty(true);
  renderWorksheetB4();
  showToast('<i class="fa-solid fa-trash-can"></i> ブロックを削除しました <button class="toast-undo-btn" onclick="undoB4()">元に戻す</button>');
}

function addBlockToSide(type, colSide = 'left') {
  const block = { id: generateBlockId(), type: type, data: {} };
  if (type === 'objective') block.data = { text: '本時のめあてを入力してください。' };
  else if (type === 'review') block.data = { title: '復習', content: '前時の重要公式や既習内容' };
  else if (type === 'board-task') block.data = { qNum: '【本時の課題】', text: '<strong>問題1</strong>　板書の発問・課題を入力', guide: '着眼点・見通し', thinkingSpaceHeight: 120, answer: '解答例' };
  else if (type === 'point-box') block.data = { badge: '板書まとめ', title: '本時のまとめ', content: '板書のまとめを入力' };
  else if (type === 'question') block.data = { qNum: '問題', text: '問題文を入力してください。', answer: '解答例', spaceHeight: 80 };
  else if (type === 'graph-block') block.data = { qNum: '問', text: 'グラフの直線の式を答えなさい。', answer: '$y = 2x + 1$', spaceHeight: 50, svgHtml: generateLinearSvg(2, 1, true, true, 190, 180) };
  else if (type === 'geometry-block') block.data = { qNum: '問', text: '右の図で、直線 l // m であるとき、∠x の大きさを求めなさい。', answer: '∠x = 80°', spaceHeight: 50, svgHtml: (typeof generateParallelChevronSvg === 'function' ? generateParallelChevronSvg(45, 35, 200, 150) : '') };
  else if (type === 'summary') block.data = { title: '本時のまとめ', content: '授業のまとめ・ポイント' };
  else if (type === 'reflection') block.data = { title: '本時の自己評価 & 振り返り' };

  pushB4History();
  if (colSide === 'left') state.blocksLeft.push(block);
  else state.blocksRight.push(block);
  syncB4Blocks();
  setB4Dirty(true);
  renderWorksheetB4();

  const el = document.getElementById(block.id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('just-added');
    setTimeout(() => el.classList.remove('just-added'), 1200);
  }
}

// ---- 学年・単元・時数セレクター ----
function onB4GradeClick(grade) {
  if (String(grade) === currentB4Grade) return;
  if (!confirmDiscardB4()) return;
  state.b4Dirty = false;
  selectB4Grade(grade);
}

function selectB4Grade(grade, isInitialLoad = false) {
  currentB4Grade = String(grade);
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('b4GradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentB4Grade === g);
  });
  updateB4UnitDropdown();
  applyB4LessonSelection(isInitialLoad);
}

function updateB4UnitDropdown() {
  const unitSelect = document.getElementById('b4UnitSelect');
  if (!unitSelect) return;
  const gData = boardLessonDatabase[currentB4Grade];
  if (!gData || !gData.units) return;

  unitSelect.innerHTML = gData.units.map(u =>
    '<option value="' + u.id + '">' + escapeHtmlB4(stripTeXForOption(u.unitName)) + '（全' + u.totalHours + '時）</option>'
  ).join('');

  currentB4UnitId = gData.units[0].id;
  updateB4HourDropdown();
}

function hourOptionLabel(lesson) {
  const custom = getCustomLessonTemplate(currentB4Grade, currentB4UnitId, lesson.hour);
  const title = (custom && custom.title) || lesson.title;
  return (custom ? '★ ' : '') + '第' + lesson.hour + '時　' + stripTeXForOption(title);
}

function updateB4HourDropdown(keepHour = false) {
  const hourSelect = document.getElementById('b4HourSelect');
  if (!hourSelect) return;
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit || !unit.lessons) return;

  hourSelect.innerHTML = unit.lessons.map(l =>
    '<option value="' + l.hour + '">' + escapeHtmlB4(hourOptionLabel(l)) + '</option>'
  ).join('');

  if (!keepHour || !unit.lessons.some(l => l.hour === currentB4Hour)) {
    currentB4Hour = unit.lessons[0].hour;
  }
  hourSelect.value = String(currentB4Hour);
  updateReferenceLinksUI(unit);
  updateHourStepButtons();
}

function refreshB4HourDropdownLabels() {
  updateB4HourDropdown(true);
}

function onB4UnitChange() {
  const unitSelect = document.getElementById('b4UnitSelect');
  if (!unitSelect) return;
  if (!confirmDiscardB4()) {
    unitSelect.value = currentB4UnitId;
    return;
  }
  state.b4Dirty = false;
  currentB4UnitId = unitSelect.value;
  updateB4HourDropdown();
  applyB4LessonSelection();
}

function onB4HourChange() {
  const hourSelect = document.getElementById('b4HourSelect');
  if (!hourSelect) return;
  if (!confirmDiscardB4()) {
    hourSelect.value = String(currentB4Hour);
    return;
  }
  state.b4Dirty = false;
  currentB4Hour = Number(hourSelect.value);
  applyB4LessonSelection();
}

function stepB4Hour(delta) {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit) return;
  const idx = unit.lessons.findIndex(l => l.hour === currentB4Hour);
  const next = unit.lessons[idx + delta];
  if (!next) return;
  if (!confirmDiscardB4()) return;
  state.b4Dirty = false;
  currentB4Hour = next.hour;
  applyB4LessonSelection();
}

function updateHourStepButtons() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit) return;
  const idx = unit.lessons.findIndex(l => l.hour === currentB4Hour);
  document.querySelectorAll('.js-hour-prev').forEach(b => { b.disabled = idx <= 0; });
  document.querySelectorAll('.js-hour-next').forEach(b => { b.disabled = idx < 0 || idx >= unit.lessons.length - 1; });
}

function reloadB4Lesson() {
  if (!confirmDiscardB4()) return;
  state.b4Dirty = false;
  applyB4LessonSelection();
}

function applyB4LessonSelection(isInitialLoad = false) {
  loadBoardLessonPreset(currentB4Grade, currentB4UnitId, currentB4Hour, isInitialLoad);
}

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
    openPdfPreviewModal(encodeURIComponent(unit.bookRef), '【中' + currentB4Grade + ' 板書＆展開例】' + stripTeXForOption(unit.unitName));
  } else {
    showToast('この単元の板書書籍PDFは準備中です');
  }
}

function openCurrentB4PointPdf() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (unit && unit.pointRef) {
    openPdfPreviewModal(encodeURIComponent(unit.pointRef), '【中' + currentB4Grade + ' 要点ブック】' + stripTeXForOption(unit.unitName));
  }
}

function openCurrentB4OfficialPdf() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (unit && unit.officialRef) {
    openPdfPreviewModal(encodeURIComponent(unit.officialRef), '【中' + currentB4Grade + ' 公式学習プリント】' + stripTeXForOption(unit.unitName));
  }
}

function updateB4SelectorUI() {
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('b4GradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentB4Grade === g);
  });

  const unitSelect = document.getElementById('b4UnitSelect');
  if (unitSelect) {
    if (![...unitSelect.options].some(o => o.value === currentB4UnitId)) updateB4UnitDropdown();
    unitSelect.value = currentB4UnitId;
  }
  updateB4HourDropdown(true);
}

let sortableLeftB4 = null;
let sortableRightB4 = null;

function ensureSortableB4() {
  if (typeof Sortable === 'undefined') return;
  const leftCol = document.getElementById('blocksLeftCol');
  const rightCol = document.getElementById('blocksRightCol');
  if (!leftCol || !rightCol) return;

  const options = {
    group: 'b4-blocks',
    animation: 180,
    handle: '.drag-handle',
    draggable: '.sheet-block',
    filter: '.empty-col-drop, .math-popover-editor',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    onStart: () => document.body.classList.add('is-dragging-block'),
    onEnd: (evt) => {
      document.body.classList.remove('is-dragging-block');
      const fromCol = evt.from.id === 'blocksLeftCol' ? 'left' : 'right';
      const toCol = evt.to.id === 'blocksLeftCol' ? 'left' : 'right';
      const oldIdx = evt.oldDraggableIndex ?? evt.oldIndex;
      const newIdx = evt.newDraggableIndex ?? evt.newIndex;
      if (fromCol === toCol && oldIdx === newIdx) return;

      pushB4History();
      const fromArr = fromCol === 'left' ? state.blocksLeft : state.blocksRight;
      const toArr = toCol === 'left' ? state.blocksLeft : state.blocksRight;
      const moved = fromArr.splice(oldIdx, 1)[0];
      if (!moved) return;
      toArr.splice(Math.min(newIdx, toArr.length), 0, moved);
      syncB4Blocks();
      setB4Dirty(true);
      setTimeout(renderWorksheetB4, 10);
    }
  };

  if (!sortableLeftB4) sortableLeftB4 = new Sortable(leftCol, options);
  if (!sortableRightB4) sortableRightB4 = new Sortable(rightCol, options);
}

function initSortableB4() {
  ensureSortableB4();
}
