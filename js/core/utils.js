function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ドロップダウンや時間割セル、プレビュー用のTeX数式クリーンアップ（$y=ax+b$ ➔ y=ax+b 等）
function cleanMathText(str) {
  if (!str) return '';
  let s = String(str);
  // 関数レプリサーを使って $...$ を安全・確実に日本語・自然な数式テキストに変換
  s = s.replace(/\$([^\$]+)\$/g, (match, inner) => {
    let t = inner.trim();
    return t.replace(/\\displaystyle\s*/g, '')
            .replace(/\\text\{([^\}]+)\}/g, '$1')
            .replace(/\\implies/g, '➔')
            .replace(/\\sqrt\{([^\}]+)\}/g, '√$1')
            .replace(/\\sqrt\{2\}/g, '√2')
            .replace(/\\sqrt\{3\}/g, '√3')
            .replace(/\\sqrt/g, '√')
            .replace(/\\pi/g, 'π')
            .replace(/\\times/g, '×')
            .replace(/\\div/g, '÷')
            .replace(/\\pm/g, '±')
            .replace(/\\le/g, '≦')
            .replace(/\\ge/g, '≧')
            .replace(/\\angle\s*/g, '∠')
            .replace(/\\triangle\s*/g, '△')
            .replace(/\\sim/g, '∽')
            .replace(/\\equiv/g, '≡')
            .replace(/\\quad/g, ' ')
            .replace(/\\,/g, ' ')
            .replace(/\\ /g, ' ')
            .replace(/\^2/g, '²')
            .replace(/\^3/g, '³')
            .replace(/\\frac\{([^\}]+)\}\{([^\}]+)\}/g, '$1/$2');
  });
  return s;
}
window.cleanMathText = cleanMathText;

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
}// ==========================================
// // 練習プリント・印刷: 別ウィンドウで確実にA4印刷

function openPrintWindow(contentHtml, title) {
  const printWin = window.open('', '_blank', 'width=900,height=700');
  if (!printWin) {
    alert('ポップアップがブロックされています。ブラウザの設定でポップアップを許可してください。');
    return;
  }

  // style.cssのURLを取得（同オリジン対応）
  const styleHref = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(l => l.href).join('\n');
  const styleLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map(l => `<link rel="stylesheet" href="${l.href}">`).join('\n');
  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map(s => `<style>${s.textContent}</style>`).join('\n');

  printWin.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${styleLinks}
  ${inlineStyles}
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm; }
    html, body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
      font-size: 10pt !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-paper {
      width: 190mm;
      min-height: 277mm;
      margin: 0 auto;
      box-sizing: border-box;
      background: #fff;
    }
    /* 画面表示用の hover / shadow を全消去 */
    * { box-shadow: none !important; }
    .test-paper-mock {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
      border: none !important;
      padding: 0 !important;
    }
    @media screen {
      body { padding: 10mm; background: #f1f5f9; }
      .print-paper { box-shadow: 0 2px 12px rgba(0,0,0,0.1); padding: 10mm; }
    }
  </style>
</head>
<body>
  <div class="print-paper">${contentHtml}</div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"><\/script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(document.body, {
          delimiters: [
            {left: '\\\\(', right: '\\\\)', display: false},
            {left: '\\\\[', right: '\\\\]', display: true}
          ]
        });
      }
      setTimeout(() => window.print(), 800);
    });
  <\/script>
</body>
</html>`);
  printWin.document.close();
}

// 印刷用紙の向き・サイズをブラウザに明示設定するヘルパー
function setPrintPageOrientation(sizeOrientation) {
  let styleEl = document.getElementById('printPageOrientationStyle');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'printPageOrientationStyle';
    document.head.appendChild(styleEl);
  }
  const isLandscape = sizeOrientation.includes('landscape');
  const marginStr = isLandscape ? '5mm 6mm' : '8mm 10mm';
  styleEl.textContent = `@page { size: ${sizeOrientation} !important; margin: ${marginStr} !important; }`;
}

function printStudentTestPaper() {
  const el = document.getElementById('testStudentPaper');
  if (!el || !el.innerHTML.trim()) { showToast('先に問題を生成してください'); return; }
  setPrintPageOrientation('A4 portrait');
  document.body.setAttribute('data-print-target', 'test-student');
  setTimeout(() => {
    window.print();
  }, 50);
}

function printAnswerTestPaper() {
  const el = document.getElementById('testAnswerPaper');
  if (!el || !el.innerHTML.trim()) { showToast('先に問題を生成してください'); return; }
  setPrintPageOrientation('A4 portrait');
  document.body.setAttribute('data-print-target', 'test-answer');
  setTimeout(() => {
    window.print();
  }, 50);
}

function printWorksheetPaper() {
  setPrintPageOrientation('B4 landscape');
  document.body.setAttribute('data-print-target', 'worksheet');
  setTimeout(() => {
    window.print();
  }, 50);
}

// 印刷後にターゲット属性を解除
window.addEventListener('afterprint', () => {
  document.body.removeAttribute('data-print-target');
});