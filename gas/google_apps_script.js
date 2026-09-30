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

  // 2. 先生自身が見て確認できる「ベース時間割」シート更新
  if (payload.baseTimetables) {
    const ttSheet = getOrCreateSheet(ss, 'ベース時間割(マスター)');
    ttSheet.clear();
    ttSheet.getRange('A1:K1').setValues([['校時', '月(クラス)', '月(教科)', '火(クラス)', '火(教科)', '水(クラス)', '水(教科)', '木(クラス)', '木(教科)', '金(クラス)', '金(教科)']]);
    
    const rows = [];
    const term = payload.currentTerm || 'first_term';
    const tt = payload.baseTimetables[term] || {};
    const days = ['mon', 'tue', 'wed', 'thu', 'fri'];

    for (let p = 1; p <= 6; p++) {
      const row = [`${p}限`];
      days.forEach(d => {
        const slot = (tt[p] && tt[p][d]) ? tt[p][d] : { class: '', subject: '' };
        row.push(slot.class || '');
        row.push(slot.subject || '');
      });
      rows.push(row);
    }
    if (rows.length > 0) {
      ttSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      ttSheet.getRange('A1:K1').setBackground('#1e40af').setFontColor('#ffffff').setFontWeight('bold');
    }
  }

  // 3. 先生自身が見て確認できる「週案・学習予定」シート更新
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

  // 4. 授業改善メモシート更新
  if (payload.memos && payload.memos.length > 0) {
    const memoSheet = getOrCreateSheet(ss, '授業改善ナレッジメモ');
    memoSheet.clear();
    memoSheet.getRange('A1:E1').setValues([['日付', '単元名', 'つまずき・指導の工夫', '時間配分', '来年度への引継ぎ']]);
    const memoRows = payload.memos.map(m => [m.date, m.unit, m.points, m.timing, m.nextYear]);
    memoSheet.getRange(2, 1, memoRows.length, 5).setValues(memoRows);
    memoSheet.getRange('A1:E1').setBackground('#b45309').setFontColor('#ffffff').setFontWeight('bold');
  }
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}
