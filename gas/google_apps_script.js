/**
 * 中学数学科教員ポータル - Googleスプレッドシート自動同期スクリプト (GAS)
 * 
 * 【設定手順】
 * 1. 新しいGoogleスプレッドシートを作成（名前は「数学科ポータル_データベース」など）
 * 2. 画面上のメニュー「拡張機能」 > 「Apps Script」を開く
 * 3. 最初に入っているコードをすべて消して、このコードをまるごと貼り付けて保存（Ctrl+S）
 * 4. 右上の「デプロイ」 > 「新しいデプロイ」をクリック
 * 5. 歯車アイコン > 「ウェブアプリ」を選択
 *    - 次のユーザーとして実行: 「自分」
 *    - アクセスできるユーザー: 「全員」（※URLを知っている自分のみがアクセスするため）
 * 6. 「デプロイ」ボタンを押し、表示された「ウェブアプリのURL」をポータルの設定欄に貼り付ければ完了！
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = loadAllData(ss);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = JSON.parse(e.postData.contents);
    saveAllData(ss, payload);
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'スプレッドシートに保存しました', timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// データの読み込み
function loadAllData(ss) {
  const metaSheet = getOrCreateSheet(ss, '_system_data');
  const val = metaSheet.getRange('A1').getValue();
  if (val && typeof val === 'string' && val.startsWith('{')) {
    return JSON.parse(val);
  }
  return null;
}

// データの保存（見やすい一覧シート＋高速同期用シートの両方に反映）
function saveAllData(ss, payload) {
  // 1. システム高速読み込み用JSON保存
  const metaSheet = getOrCreateSheet(ss, '_system_data');
  metaSheet.getRange('A1').setValue(JSON.stringify(payload));

  // 2. 期の名称マッピング生成
  const termMap = {};
  if (payload.termsList && Array.isArray(payload.termsList)) {
    payload.termsList.forEach(t => { termMap[t.id] = t.label; });
  }

  const currentTermId = payload.currentTerm || '2026_first';
  const currentTermLabel = termMap[currentTermId] || (currentTermId === 'first_term' ? '2026年度 前期' : currentTermId === 'second_term' ? '2026年度 後期' : currentTermId);

  // 3. ベース時間割の蓄積保存
  if (payload.baseTimetables) {
    // 3-A. 現在（アクティブ）の時間割シート（一番左でいつでもパッと確認できる）
    const activeTt = payload.baseTimetables[currentTermId] || payload.baseTimetables['first_term'] || {};
    writeTimetableToSheet(ss, 'ベース時間割(現在)', currentTermLabel, activeTt, '#1e40af');

    // 3-B. 年度・期ごとの個別アーカイブシート（全年度を生涯蓄積！）
    Object.keys(payload.baseTimetables).forEach(termId => {
      const tt = payload.baseTimetables[termId];
      if (!tt) return;

      const label = termMap[termId] || (termId === 'first_term' ? '2026年度 前期' : termId === 'second_term' ? '2026年度 後期' : termId);
      // シート名に使えない記号をサニタイズ
      const cleanLabel = label.replace(/[\\/*?:\[\]]/g, '').trim();
      const tabName = `時間割_${cleanLabel}`;
      writeTimetableToSheet(ss, tabName, label, tt, '#334155');
    });
  }

  // 4. 先生自身が見て確認できる「週案・学習予定」シート更新（時系列で蓄積）
  if (payload.lessonPlans) {
    const planSheet = getOrCreateSheet(ss, '週案・授業進度一覧');
    planSheet.clear();
    planSheet.getRange('A1:D1').setValues([['日付', '校時', '学習内容・単元名', '更新日時']]);
    
    const planRows = [];
    Object.keys(payload.lessonPlans).sort().forEach(k => {
      const [dStr, p] = k.split('_');
      planRows.push([dStr, `${p}限`, payload.lessonPlans[k], new Date().toLocaleString('ja-JP')]);
    });
    if (planRows.length > 0) {
      planSheet.getRange(2, 1, planRows.length, 4).setValues(planRows);
      planSheet.getRange('A1:D1').setBackground('#047857').setFontColor('#ffffff').setFontWeight('bold');
    }
  }

  // 5. 授業改善メモシート更新
  if (payload.memos && payload.memos.length > 0) {
    const memoSheet = getOrCreateSheet(ss, '授業改善ナレッジメモ');
    memoSheet.clear();
    memoSheet.getRange('A1:E1').setValues([['日付', '単元名', 'つまずき・指導の工夫', '時間配分', '来年度への引継ぎ']]);
    const memoRows = payload.memos.map(m => [m.date, m.unit, m.points, m.timing, m.nextYear]);
    memoSheet.getRange(2, 1, memoRows.length, 5).setValues(memoRows);
    memoSheet.getRange('A1:E1').setBackground('#b45309').setFontColor('#ffffff').setFontWeight('bold');
  }

  // 6. 各週の日程・校時振替一覧シート更新（先生が見てパッと確認できる専用シート）
  if (payload.dateOverrides) {
    const overrideSheet = getOrCreateSheet(ss, '校時振替・特時履歴');
    overrideSheet.clear();
    overrideSheet.getRange('A1:H1').setValues([['日付', '行事・メモ', '1限', '2限', '3限', '4限', '5限', '6限']]);
    
    const dates = Object.keys(payload.dateOverrides).sort();
    const rows = dates.map(dStr => {
      const item = payload.dateOverrides[dStr];
      const slots = item.slots || {};
      const formatSlot = (val) => {
        if (!val) return '';
        if (val === 'none') return 'カット';
        if (val.startsWith('special_')) return val.replace('special_', '');
        const dayMap = { mon: '月', tue: '火', wed: '水', thu: '木', fri: '金' };
        const [d, p] = val.split('_');
        return `${dayMap[d] || d}${p}`;
      };
      return [
        dStr,
        item.memo || '',
        formatSlot(slots[1]),
        formatSlot(slots[2]),
        formatSlot(slots[3]),
        formatSlot(slots[4]),
        formatSlot(slots[5]),
        formatSlot(slots[6])
      ];
    });

    if (rows.length > 0) {
      overrideSheet.getRange(2, 1, rows.length, 8).setValues(rows);
      overrideSheet.getRange('A1:H1').setBackground('#4338ca').setFontColor('#ffffff').setFontWeight('bold');
    }
  }
}

// 時間割を表形式でシートに書き出す共通ヘルパー関数
function writeTimetableToSheet(ss, sheetName, termTitle, ttData, headerColor) {
  const sheet = getOrCreateSheet(ss, sheetName);
  sheet.clear();

  // タイトル帯
  sheet.getRange('A1:K1').merge().setValue(`【${termTitle}】 (最終同期: ${new Date().toLocaleString('ja-JP')})`)
    .setFontWeight('bold').setBackground('#f8fafc').setFontColor('#0f172a');

  // 列見出し
  sheet.getRange('A2:K2').setValues([['校時', '月(クラス)', '月(教科)', '火(クラス)', '火(教科)', '水(クラス)', '水(教科)', '木(クラス)', '木(教科)', '金(クラス)', '金(教科)']]);
  sheet.getRange('A2:K2').setBackground(headerColor || '#1e40af').setFontColor('#ffffff').setFontWeight('bold');

  const days = ['mon', 'tue', 'wed', 'thu', 'fri'];
  const rows = [];
  for (let p = 1; p <= 6; p++) {
    const row = [`${p}限`];
    days.forEach(d => {
      const slot = (ttData && ttData[p] && ttData[p][d]) ? ttData[p][d] : { class: '', subject: '' };
      row.push(slot.class || '');
      row.push(slot.subject || '');
    });
    rows.push(row);
  }

  sheet.getRange(3, 1, rows.length, 11).setValues(rows);
  sheet.getRange(2, 1, rows.length + 1, 11).setBorder(true, true, true, true, true, true, '#cbd5e1', SpreadsheetApp.BorderStyle.SOLID);
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}
