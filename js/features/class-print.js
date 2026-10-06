// ==========================================
// // ワークシート工房: ブロック管理 (レゴ方式)

function generateBlockId() {
  return 'blk_' + Math.random().toString(36).substr(2, 9);
}

function addBlock(type, customData = null) {
  let block = { id: generateBlockId(), type: type, data: {} };

  if (type === 'objective') {
    block.data = {
      text: customData?.text || '一次関数のグラフの傾きと切片の意味を理解し、式からグラフをかくことができる。'
    };
  } else if (type === 'review') {
    block.data = {
      title: customData?.title || '前時のふりかえり・小問',
      content: customData?.content || '比例の式 y = 3x のグラフは、原点(0,0)と点( 1 , 3 )を通る直線である。'
    };
  } else if (type === 'question') {
    block.data = {
      qNum: customData?.qNum || `問 ${state.blocks.filter(b => b.type.includes('question') || b.type.includes('block')).length + 1}`,
      text: customData?.text || '次の方程式を解きなさい。　3x - 5 = 2x + 4',
      answer: customData?.answer || 'x = 9',
      spaceHeight: customData?.spaceHeight || 45
    };
  } else if (type === 'graph-block') {
    block.data = {
      qNum: customData?.qNum || `問 ${state.blocks.filter(b => b.type.includes('question') || b.type.includes('block')).length + 1}`,
      text: customData?.text || '右の図は、一次関数 y = 2x + 1 のグラフである。この直線の傾きと切片を答えなさい。',
      answer: customData?.answer || '傾き: 2 , 切片: 1',
      svgHtml: customData?.svgHtml || generateLinearSvg(2, 1, true, true, 190, 190)
    };
  } else if (type === 'geometry-block') {
    block.data = {
      qNum: customData?.qNum || `問 ${state.blocks.filter(b => b.type.includes('question') || b.type.includes('block')).length + 1}`,
      text: customData?.text || '右の図で、直線 l // m であるとき、∠x の大きさを求めなさい。',
      answer: customData?.answer || '∠x = 80°',
      svgHtml: customData?.svgHtml || generateParallelChevronSvg(45, 35, 200, 150)
    };
  } else if (type === 'board-task') {
    block.data = {
      qNum: customData?.qNum || '【本時の課題】',
      text: customData?.text || '式 $(a+b+2)(a+b-5)$ を展開するにはどうすればよいだろうか？共通な部分を見つけて工夫しよう。',
      guide: customData?.guide || '着眼点: 共通な部分に着目して、1つのまとまり（$M$など）とおいてみよう。',
      thinkingSpaceHeight: customData?.thinkingSpaceHeight || 85,
      answer: customData?.answer || '$a+b=M$ とおくと、$(M+2)(M-5) = M^2 - 3M - 10$。'
    };
  } else if (type === 'point-box') {
    block.data = {
      badge: customData?.badge || '要点公式',
      title: customData?.title || '重要ポイント・公式まとめ',
      content: customData?.content || '公式や定義のまとめを入力します。'
    };
  } else if (type === 'summary') {
    block.data = {
      title: customData?.title || '本時のまとめ',
      content: customData?.content || '★ 一次関数 y = ax + b において<br>・ a は「傾き（変化の割合）」を表し、グラフの傾き具合を決める。<br>・ b は「切片」を表し、y軸との交点 (0, b) を通る。'
    };
  } else if (type === 'reflection') {
    block.data = {
      title: '本時の自己評価 & 振り返り'
    };
  }

  state.blocks.push(block);
  renderWorksheet();
}

function moveBlock(index, direction) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= state.blocks.length) return;
  const temp = state.blocks[index];
  state.blocks[index] = state.blocks[targetIndex];
  state.blocks[targetIndex] = temp;
  renderWorksheet();
}

function removeBlock(index) {
  state.blocks.splice(index, 1);
  renderWorksheet();
}

function clearWorksheet() {
  if (confirm('ワークシートの全ブロックをクリアしますか？')) {
    state.blocks = [];
    renderWorksheet();
  }
}

function toggleAnswerMode() {
  state.showAnswers = !state.showAnswers;
  document.body.classList.toggle('show-answers', state.showAnswers);
  const btn = document.getElementById('answerModeBtn');
  if (btn) {
    btn.innerHTML = state.showAnswers 
      ? '<i class="fa-solid fa-eye-slash text-danger"></i> 解答を隠す' 
      : '<i class="fa-solid fa-eye"></i> 解答表示切替';
  }
}

function renderWorksheet() {
  const container = document.getElementById('blocksContainer');
  if (!container) return;

  if (state.blocks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #94a3b8; border: 2px dashed #cbd5e1; border-radius: 8px;">
        <i class="fa-solid fa-cubes" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
        <p>ブロックがありません。左のパレットから「めあて」や「問い」を追加してください。</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.blocks.map((block, index) => {
    let blockContentHtml = '';

    if (block.type === 'objective') {
      blockContentHtml = `
        <div class="objective-box" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
          <span class="objective-label">めあて</span>
          <div class="objective-text" contenteditable="true" data-field="text" oninput="updateBlockData(${index}, 'text', this.innerHTML)" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
            ${block.data.text}
          </div>
        </div>
      `;
    } else if (block.type === 'review') {
      blockContentHtml = `
        <div class="review-box" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
          <div class="review-title" contenteditable="true" data-field="title" oninput="updateBlockData(${index}, 'title', this.innerHTML)" onblur="updateBlockData(${index}, 'title', this.innerHTML)">
            <i class="fa-solid fa-clock-rotate-left"></i> ${block.data.title}
          </div>
          <div class="q-body" contenteditable="true" data-field="content" oninput="updateBlockData(${index}, 'content', this.innerHTML)" onblur="updateBlockData(${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'question') {
      blockContentHtml = `
        <div class="question-item">
          <div class="q-header">
            <span class="q-num" contenteditable="true" data-field="qNum" oninput="updateBlockData(${index}, 'qNum', this.innerText)" onblur="updateBlockData(${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
            <div class="q-body" contenteditable="true" data-field="text" oninput="updateBlockData(${index}, 'text', this.innerHTML)" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
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
                <span class="q-num" contenteditable="true" data-field="qNum" oninput="updateBlockData(${index}, 'qNum', this.innerText)" onblur="updateBlockData(${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
                <div class="q-body" contenteditable="true" data-field="text" oninput="updateBlockData(${index}, 'text', this.innerHTML)" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
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
    } else if (block.type === 'geometry-block') {
      blockContentHtml = `
        <div class="question-item">
          <div class="graph-question-layout">
            <div>
              <div class="q-header">
                <span class="q-num" contenteditable="true" data-field="qNum" oninput="updateBlockData(${index}, 'qNum', this.innerText)" onblur="updateBlockData(${index}, 'qNum', this.innerText)">${block.data.qNum}</span>
                <div class="q-body" contenteditable="true" data-field="text" oninput="updateBlockData(${index}, 'text', this.innerHTML)" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
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
    } else if (block.type === 'board-task') {
      blockContentHtml = `
        <div class="board-task-box">
          <div class="board-task-header">
            <span class="board-task-badge"><i class="fa-solid fa-chalkboard-user"></i> ${block.data.qNum}</span>
            <div class="board-task-text" contenteditable="true" data-field="text" oninput="updateBlockData(${index}, 'text', this.innerHTML)" onblur="updateBlockData(${index}, 'text', this.innerHTML)">
              ${block.data.text}
            </div>
          </div>
          ${block.data.guide ? `
            <div class="board-task-guide" contenteditable="true" data-field="guide" oninput="updateBlockData(${index}, 'guide', this.innerHTML)" onblur="updateBlockData(${index}, 'guide', this.innerHTML)">
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
            <strong contenteditable="true" data-field="title" oninput="updateBlockData(${index}, 'title', this.innerText)" onblur="updateBlockData(${index}, 'title', this.innerText)">${block.data.title}</strong>
          </div>
          <div class="point-summary-body" contenteditable="true" data-field="content" style="min-height: ${block.data.customHeight || 40}px;" oninput="updateBlockData(${index}, 'content', this.innerHTML)" onblur="updateBlockData(${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'summary') {
      blockContentHtml = `
        <div class="summary-box" ${block.data.customHeight ? `style="min-height: ${block.data.customHeight}px;"` : ''}>
          <div class="summary-header">
            <i class="fa-solid fa-lightbulb"></i>
            <span contenteditable="true" data-field="title" oninput="updateBlockData(${index}, 'title', this.innerText)" onblur="updateBlockData(${index}, 'title', this.innerText)">${block.data.title}</span>
          </div>
          <div class="summary-content" contenteditable="true" data-field="content" oninput="updateBlockData(${index}, 'content', this.innerHTML)" onblur="updateBlockData(${index}, 'content', this.innerHTML)">
            ${block.data.content}
          </div>
        </div>
      `;
    } else if (block.type === 'reflection') {
      blockContentHtml = `
        <div class="reflection-box">
          <div class="reflection-scales">
            <strong contenteditable="true" data-field="title" oninput="updateBlockData(${index}, 'title', this.innerText)" onblur="updateBlockData(${index}, 'title', this.innerText)">${block.data.title}</strong>
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
      <div class="sheet-block" id="${block.id}" data-index="${index}">
        <div class="block-hover-controls no-print">
          <button class="block-ctrl-btn" onclick="moveBlock(${index}, -1)" title="上へ移動"><i class="fa-solid fa-arrow-up"></i></button>
          <button class="block-ctrl-btn" onclick="moveBlock(${index}, 1)" title="下へ移動"><i class="fa-solid fa-arrow-down"></i></button>
          <button class="block-ctrl-btn danger" onclick="removeBlock(${index})" title="ブロック削除"><i class="fa-solid fa-xmark"></i></button>
        </div>
        ${blockContentHtml}
        <div class="sheet-resize-handle no-print" data-index="${index}" title="ドラッグしてブロックの高さを変更">
          <div class="resize-handle-pill">
            <i class="fa-solid fa-grip-lines"></i>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateBlockData(index, field, value) {
  if (state.blocks[index]) {
    state.blocks[index].data[field] = value;
  }
}

// ==========================================
// // 授業プリント・単元プリセットデータ（板書書籍・要点ブック連動）

lessonUnitPresets = {
  // --- 中3 ---
  'g3_poly_expand': {
    grade: '3',
    unitName: '多項式の展開・因数分解',
    lessonTitle: '工夫して式を展開しよう（置き換えの利用）',
    badge: '中3数学 / 明治図書板書 3年上',
    boardPdf: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中3数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '',
    blocks: [
      {
        type: 'objective',
        data: { text: '共通な部分に着目して式の一部を別の文字とおきかえ、乗法公式を使って工夫して展開できる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・乗法公式',
          content: '公式: $(x+a)(x+b) = x^2 + (a+b)x + ab$　例: $(x+3)(x+5) = x^2 + 8x + 15$'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '式 $(a+b+2)(a+b-5)$ を展開するにはどうすればよいだろうか？共通な部分を見つけて工夫しよう。',
          guide: '着眼点: $a+b$ がどちらのカッコにもあるね。1つのまとまり（$M$など）とおいてみよう。',
          thinkingSpaceHeight: 90,
          answer: '$a+b=M$ とおくと、$(M+2)(M-5) = M^2 - 3M - 10$。元に戻して $(a+b)^2 - 3(a+b) - 10 = a^2 + 2ab + b^2 - 3a - 3b - 10$'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '板書まとめ',
          title: '置き換えによる展開のポイント',
          content: '式の中に同じまとまりがあるときは、それを <strong>1つの文字 $M$</strong> とおくことで、知っている乗法公式にあてはめて簡単に展開できる！'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '置き換えの工夫を使って、次の式を展開しなさい。<br>$(x+y+3)(x+y-3)$',
          answer: '$x+y=M$ とおくと $(M+3)(M-3) = M^2 - 9 = (x+y)^2 - 9 = x^2 + 2xy + y^2 - 9$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g3_sqrt_calc': {
    grade: '3',
    unitName: '平方根の性質と乗除',
    lessonTitle: '根号をふくむ式の乗法と除法',
    badge: '中3数学 / 明治図書板書 3年上',
    boardPdf: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中3数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '',
    blocks: [
      {
        type: 'objective',
        data: { text: '$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$ の性質を理解し、根号を含む式の乗法・除法を正確に計算できる。' }
      },
      {
        type: 'review',
        data: {
          title: '平方根の定義のふりかえり',
          content: '面積が $2$ の正方形の1辺の長さは $\\sqrt{2}$、面積が $3$ の正方形の1辺の長さは $\\sqrt{3}$ である。'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '$\\sqrt{2} \\times \\sqrt{3} = \\sqrt{6}$ になる理由を、正方形や長方形の面積をもとに説明しよう。',
          guide: 'ヒント: 2乗して $6$ になる正の数は何だろう？ $(\\sqrt{2} \\times \\sqrt{3})^2$ を計算してみよう。',
          thinkingSpaceHeight: 90,
          answer: '理由: $(\\sqrt{2}\\times\\sqrt{3})^2 = (\\sqrt{2})^2 \\times (\\sqrt{3})^2 = 2 \\times 3 = 6$。2乗して6になる正の数だから $\\sqrt{6}$ である。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '要点公式',
          title: '根号をふくむ式の計算公式（$a>0, b>0$）',
          content: '① <strong>$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$</strong>　（根号の中身同士をかける）<br>② <strong>$\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$</strong>　（根号の中身同士をわる）'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の計算をしなさい。<br>(1) $\\sqrt{3} \\times \\sqrt{5}$　　(2) $\\sqrt{24} \\div \\sqrt{2}$',
          answer: '(1) $\\sqrt{15}$　　(2) $\\sqrt{12} = 2\\sqrt{3}$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g3_quad_factor': {
    grade: '3',
    unitName: '2次方程式の解き方',
    lessonTitle: '因数分解を利用した2次方程式の解法',
    badge: '中3数学 / 明治図書板書 3年上',
    boardPdf: '書籍「板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学」/261002 板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学 ３年上.pdf',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中3数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '',
    blocks: [
      {
        type: 'objective',
        data: { text: '$AB=0$ ならば $A=0$ または $B=0$ の性質を利用して、2次方程式を因数分解によって解くことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・因数分解',
          content: '因数分解公式: $x^2 - 5x + 6 = (x - 2)(x - 3)$'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '2次方程式 $x^2 - 5x + 6 = 0$ の解を求めるには、左辺をどのように変形すればよいだろうか？',
          guide: 'ヒント: 2つの式をかけて $0$ になるとき、それぞれの式はどうなっているかな？',
          thinkingSpaceHeight: 90,
          answer: '左辺を因数分解すると $(x-2)(x-3)=0$。かけて0になるから $x-2=0$ または $x-3=0$。よって解は $x=2, 3$。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '板書まとめ',
          title: '因数分解による解法のまとめ',
          content: '2次方程式の左辺を $(x-\\alpha)(x-\\beta)=0$ の形に因数分解できれば、解は <strong>$x = \\alpha, \\beta$</strong> とすぐに求められる！'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の方程式を解きなさい。<br>(1) $(x-4)(x+1) = 0$　　(2) $x^2 - 7x + 12 = 0$',
          answer: '(1) $x = 4, -1$　　(2) $(x-3)(x-4)=0$ より $x = 3, 4$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  // --- 中2 ---
  'g2_linear_graph': {
    grade: '2',
    unitName: '一次関数とグラフ',
    lessonTitle: '一次関数のグラフと傾き・切片',
    badge: '中2数学 / 学習プリント 3-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中2数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/02_2年生/数学_3-1一次関数とグラフ.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '一次関数の式 $y = ax + b$ からグラフの傾きと切片を読み取り、正確に直線グラフをかくことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・比例',
          content: '比例 $y = 2x$ のグラフは原点 $(0, 0)$ を通り、右に1進むと上に2進む直線である。'
        }
      },
      {
        type: 'graph-block',
        data: {
          qNum: '【本時の課題】',
          text: '右の図は $y = 2x + 1$ のグラフである。<br>① 切片（$y$軸との交点）の座標を答えなさい。<br>② グラフの傾き（$x$が1増えるときの$y$の増加量）を求めなさい。',
          answer: '① $(0, 1)$　② 傾き $= 2$',
          svgHtml: '' // load時に生成
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '要点まとめ',
          title: '一次関数 $y = ax + b$ のグラフの性質',
          content: '・ <strong>$a$（傾き）</strong>: グラフの傾き具合。$x$ が1増えるときの $y$ の増加量。<br>・ <strong>$b$（切片）</strong>: グラフと $y$ 軸との交点 $(0, b)$。'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '一次関数 $y = -3x + 4$ について、次の問いに答えなさい。<br>(1) この直線の傾きと切片を答えなさい。<br>(2) $x=2$ のときの $y$ の値を求めなさい。',
          answer: '(1) 傾き: $-3$, 切片: $4$　(2) $y = -3(2) + 4 = -2$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g2_sim_eq': {
    grade: '2',
    unitName: '連立方程式の解き方',
    lessonTitle: '連立方程式の解法（加減法）',
    badge: '中2数学 / 学習プリント 2-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中2数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/02_2年生/数学_2-1連立方程式.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '係数をそろえて2つの式をたしたりひいたりし、文字を1つ消去して連立方程式を解くことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・1次方程式',
          content: '方程式 $3x = 12$ の解は $x = 4$。文字が1つなら解くことができる！'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '連立方程式 $\\begin{cases} 2x + y = 11 \\\\ 2x - y = 5 \\end{cases}$ を解くには、どうすれば文字を1つにできるだろうか？',
          guide: 'ヒント: 2つの式の左辺同士、右辺同士をたしたりひいたりしてみよう。',
          thinkingSpaceHeight: 90,
          answer: '2つの式をたすと $4x = 16 \\rightarrow x = 4$。代入して $y = 3$。解は $(x, y) = (4, 3)$。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '加減法のポイント',
          title: '連立方程式の解き方の手順',
          content: '① どちらかの文字の係数の絶対値をそろえる。<br>② 2つの式を <strong>たしたりひいたりして、文字を1つ消去</strong> する！<br>③ 出た解を代入してもう1つの文字を求める。'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の連立方程式を加減法で解きなさい。<br>$\\begin{cases} x + y = 7 \\\\ x - y = 3 \\end{cases}$',
          answer: 'たして $2x = 10 \\rightarrow x = 5$。代入して $y = 2$。答: $x=5, y=2$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g2_parallel_angle': {
    grade: '2',
    unitName: '平行線と角・合同',
    lessonTitle: '平行線と角（同位角と錯角）',
    badge: '中2数学 / 学習プリント 4-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中2数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/02_2年生/数学_4-1平行と合同.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '平行線における同位角・錯角の性質を理解し、補助線を引いて未知の角の大きさを求めることができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・対頂角',
          content: '向かい合う角（対頂角）は常に等しい。また、同位角・錯角の位置関係を確認しよう。'
        }
      },
      {
        type: 'geometry-block',
        data: {
          qNum: '【本時の課題】',
          text: '右の図で、直線 $l$ と $m$ が平行であるとき、折れ線の角 $\\angle x$ の大きさを求めなさい。（補助線を引いて考えよう）',
          answer: '$\\angle x = 45^\\circ + 35^\\circ = 80^\\circ$',
          svgHtml: '' // load時に生成
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '定理まとめ',
          title: '平行線と角の重要性質',
          content: '2直線が平行ならば、<strong>同位角は等しい</strong>。また <strong>錯角は等しい</strong>。<br>折れ線の角は、<strong>「尖った頂点を通る平行な補助線」</strong> を引いて2つに分けて考える！'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '$l // m$ のとき、同位角が $65^\\circ$ である角の錯角の大きさを求めなさい。',
          answer: '$65^\\circ$（平行線なので錯角も等しい）',
          spaceHeight: 45
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  // --- 中1 ---
  'g1_pos_neg': {
    grade: '1',
    unitName: '正の数・負の数の計算',
    lessonTitle: '正負の数の加法と減法',
    badge: '中1数学 / 学習プリント 1-2 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中1数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/01_1年生/数学_1-2正の数・負の数の計算.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '正負の数のたし算とひき算の規則を理解し、符号に注意して正確に計算できる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・絶対値',
          content: '$+5$ の絶対値は $5$、$-5$ の絶対値も $5$（原点からの距離）。'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '$(-3) - (-5)$ はなぜ足し算にかえて計算できるのだろうか？数直線やカードの増減をもとに説明しよう。',
          guide: 'ヒント: 「$-5$ 点のカードを引く（取り除く）」と、点数は増えるかな？減るかな？',
          thinkingSpaceHeight: 90,
          answer: '負の数を引くことは、その分だけ元に戻る（プラスされる）こと。数直線で左に進むことの逆だから右に進む。$(-3) + (+5) = +2$'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '計算のルール',
          title: '正負の数の減法のまとめ',
          content: '正負の数のひき算は、<strong>ひく数の符号を変えて、たし算になおす</strong>！<br>例: $a - (-b) = a + (+b)$　/　$a - (+b) = a + (-b)$'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の計算をしなさい。<br>(1) $(+3) + (-8)$　　(2) $(-4) - (-9)$　　(3) $2 - 7$',
          answer: '(1) $-5$　　(2) $(-4)+(+9)=+5$　　(3) $-5$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  },
  'g1_equation': {
    grade: '1',
    unitName: '一次方程式の解き方',
    lessonTitle: '等式の性質と方程式の解法（移項）',
    badge: '中1数学 / 学習プリント 3-1 & 要点ブック',
    boardPdf: '',
    pointPdf: '書籍「数学をひとつひとつわかりやすく。」/260610 中1数学をひとつひとつわかりやすく。.pdf',
    officialPdf: '数学学習プリント/01_1年生/数学_3-1方程式.pdf',
    blocks: [
      {
        type: 'objective',
        data: { text: '等式の性質をもとに「移項」の仕組みを理解し、$x=a$ の形にして方程式を解くことができる。' }
      },
      {
        type: 'review',
        data: {
          title: '前時のふりかえり・天びんの関係',
          content: '等式の両辺に同じ数をたしても、同じ数をひいても、等式は成り立つ。'
        }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '方程式 $3x - 5 = 7$ を解くとき、両辺に $+5$ をするとどのような式になるだろうか？「項の移動」に着目しよう。',
          guide: 'ヒント: $3x - 5 + 5 = 7 + 5$ とすると、左辺の $-5$ はどうなる？',
          thinkingSpaceHeight: 90,
          answer: '$3x = 7 + 5$ となり、左辺にあった $-5$ が符号を変えて $+5$ として右辺に移ったように見える。これが「移項」である。'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '移項のルール',
          title: '方程式を解く基本ステップ',
          content: '① <strong>移項</strong>: $x$ の項を左辺へ、数の項を右辺へ符号を変えて移す。<br>② <strong>整理</strong>: $ax = b$ の形にまとめる。<br>③ <strong>割る</strong>: 両辺を $x$ の係数 $a$ で割り、$x = \\frac{b}{a}$ を求める。'
        }
      },
      {
        type: 'question',
        data: {
          qNum: '確かめ問題',
          text: '次の方程式を解きなさい。<br>(1) $4x - 3 = 9$　　(2) $5x + 2 = 2x + 11$',
          answer: '(1) $4x = 12 \\rightarrow x = 3$　　(2) $3x = 9 \\rightarrow x = 3$',
          spaceHeight: 50
        }
      },
      {
        type: 'reflection',
        data: { title: '本時の自己評価 & 振り返り' }
      }
    ]
  }
};

let currentWorksheetPresetKey = 'g2_linear_graph';
let currentWorksheetGrade = '2';

// 単元プリセットから授業プリントを一括生成
function loadLessonPreset(presetKey, classInfo = null) {
  if (!presetKey || !lessonUnitPresets[presetKey]) {
    presetKey = 'g2_linear_graph';
  }
  currentPresetKey = presetKey;
  currentWorksheetPresetKey = presetKey;
  const preset = lessonUnitPresets[presetKey];
  currentWorksheetGrade = preset.grade;

  state.blocks = [];

  // タイトルとバッジの更新
  const titleEl = document.getElementById('paperTitle');
  if (titleEl) titleEl.textContent = preset.lessonTitle;

  const badgeEl = document.getElementById('paperGradeBadge');
  if (badgeEl) badgeEl.textContent = '第' + preset.grade + '学年 数学科 授業プリント';

  const footerCode = document.getElementById('footerLessonCode');
  if (footerCode) footerCode.textContent = 'M' + preset.grade + '-' + presetKey;

  // クラス情報の反映（時間割からジャンプしてきた場合など）
  if (classInfo) {
    const classCell = document.querySelector('.info-cell.class-cell');
    if (classCell) {
      classCell.innerHTML = classInfo + '組';
    }
  }

  // ブロックの追加
  preset.blocks.forEach(b => {
    let blockData = { ...b.data };
    if (b.type === 'graph-block' && !blockData.svgHtml) {
      blockData.svgHtml = generateLinearSvg(2, 1, true, true, 200, 200);
    } else if (b.type === 'geometry-block' && !blockData.svgHtml) {
      blockData.svgHtml = generateParallelChevronSvg(45, 35, 200, 150);
    }
    addBlock(b.type, blockData);
  });

  // UIのセレクトボックスの同期
  updatePresetDropdown();
  updatePresetReferenceButtons();

  showToast('<i class="fa-solid fa-wand-magic-sparkles text-primary"></i> 【' + preset.unitName + '】の板書授業プリントを展開しました');
}

// 授業例テンプレート読込（旧loadSampleSheetの進化版）
function loadSampleSheet(isInitialLoad = false) {
  loadBoardLessonPreset(currentB4Grade || '3', currentB4UnitId || 'u_3_1', currentB4Hour || 5, isInitialLoad);
}

// サイドバーの学年切り替え
function switchWorksheetGrade(grade) {
  currentWorksheetGrade = String(grade);
  ['1', '2', '3'].forEach(g => {
    const btn = document.getElementById('wsGradeBtn_' + g);
    if (btn) btn.classList.toggle('active', currentWorksheetGrade === g);
  });
  updatePresetDropdown();
}

// 単元セレクトボックスの動的更新
function updatePresetDropdown() {
  const select = document.getElementById('sheetGradeUnit');
  if (!select) return;

  const filteredKeys = Object.keys(lessonUnitPresets).filter(k => lessonUnitPresets[k].grade === currentWorksheetGrade);
  
  select.innerHTML = filteredKeys.map(k => {
    const p = lessonUnitPresets[k];
    const isSelected = k === currentWorksheetPresetKey ? 'selected' : '';
    return '<option value="' + k + '" ' + isSelected + '>【中' + p.grade + '】' + p.unitName + ' - ' + p.lessonTitle + '</option>';
  }).join('');

  if (!filteredKeys.includes(currentWorksheetPresetKey) && filteredKeys.length > 0) {
    currentWorksheetPresetKey = filteredKeys[0];
    select.value = currentWorksheetPresetKey;
  }

  updatePresetReferenceButtons();
}

function onGradeUnitChange() {
  const select = document.getElementById('sheetGradeUnit');
  if (select && select.value) {
    currentWorksheetPresetKey = select.value;
    updatePresetReferenceButtons();
  }
}

// 選択中の単元の板書PDFや要点PDFボタンの更新・開く
function updatePresetReferenceButtons() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  const btnBoard = document.getElementById('btnWsViewBoard');
  const btnPoint = document.getElementById('btnWsViewPoint');
  const btnOfficial = document.getElementById('btnWsViewOfficial');

  if (btnBoard) {
    btnBoard.style.display = (preset && preset.boardPdf) ? 'inline-flex' : 'none';
  }
  if (btnPoint) {
    btnPoint.style.display = (preset && preset.pointPdf) ? 'inline-flex' : 'none';
  }
  if (btnOfficial) {
    btnOfficial.style.display = (preset && preset.officialPdf) ? 'inline-flex' : 'none';
  }
}

function openPresetBoardPdf() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  if (preset && preset.boardPdf) {
    openPdfPreviewModal(encodeURIComponent(preset.boardPdf), '【中' + preset.grade + ' 板書＆展開例】' + preset.unitName);
  } else {
    showToast('この単元の板書書籍PDFは準備中です');
  }
}

function openPresetPointPdf() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  if (preset && preset.pointPdf) {
    openPdfPreviewModal(encodeURIComponent(preset.pointPdf), '【中' + preset.grade + ' 要点ブック】' + preset.unitName);
  }
}

function openPresetOfficialPdf() {
  const preset = lessonUnitPresets[currentWorksheetPresetKey];
  if (preset && preset.officialPdf) {
    openPdfPreviewModal(encodeURIComponent(preset.officialPdf), '【中' + preset.grade + ' 公式学習プリント】' + preset.unitName);
  }
}

// ==========================================
// // 保存済みマイ授業プリント モーダル管理

function openSavedWorksheetsModal() {
  renderSavedWorksheetsModalList();
  document.getElementById('savedWorksheetsModal')?.classList.remove('hidden');
}

function closeSavedWorksheetsModal() {
  document.getElementById('savedWorksheetsModal')?.classList.add('hidden');
}

function renderSavedWorksheetsModalList() {
  const container = document.getElementById('savedWorksheetsList');
  if (!container) return;

  const list = getSavedWorksheets();
  if (list.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 2.5rem; color: var(--text-muted);"><i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 0.8rem; color: #cbd5e1; display: block;"></i><p>まだ保存されたマイプリントはありません。<br>「マイプリントに保存」ボタンを押すとここに蓄積されます。</p></div>';
    return;
  }

  container.innerHTML = list.map(item => {
    return `
      <div class="saved-ws-item-card">
        <div class="saved-ws-item-header">
          <div class="saved-ws-item-meta">
            <span class="saved-ws-grade-badge">中${item.grade}</span>
            <span class="saved-ws-unit-text">${item.unitName} (第${item.hour}時)</span>
            <span class="saved-ws-date-text">${item.savedAt}</span>
          </div>
          <h4 class="saved-ws-item-title">${item.name}</h4>
        </div>
        <div class="saved-ws-item-actions">
          <button class="btn btn-sm btn-primary" onclick="loadSavedWorksheet('${item.id}')">
            <i class="fa-solid fa-folder-open"></i> 開いて編集
          </button>
          <button class="btn btn-sm btn-ghost text-danger" onclick="deleteSavedWorksheet('${item.id}')" title="削除">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// 全プリントのJSONバックアップ書き出し
function exportWorksheetsBackup() {
  const list = getSavedWorksheets();
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '中学数学_マイ授業プリントバックアップ_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('マイプリントのバックアップファイルを保存しました');
}

// 全プリントのJSONバックアップ読み込み
function importWorksheetsBackup(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        const existing = getSavedWorksheets();
        const merged = [...imported, ...existing.filter(ex => !imported.some(im => im.id === ex.id))];
        localStorage.setItem(SAVED_WORKSHEETS_KEY, JSON.stringify(merged));
        renderSavedWorksheetsModalList();
        showToast('マイプリントデータを復元・追加しました（' + imported.length + '件）');
      }
    } catch (err) {
      alert('ファイルの読み込みに失敗しました。正しいJSONファイルを選択してください。');
    }
  };
  reader.readAsText(file);
}

// ==========================================
// // 授業プリント B4 表示倍率（ズーム）制御

let currentWorksheetZoom = 1.0;

function setWorksheetZoom(scale) {
  currentWorksheetZoom = scale;
  const container = document.getElementById('b4ZoomScaledContainer');
  if (container) {
    container.style.transform = scale === 1.0 ? 'none' : `scale(${scale})`;
    container.style.transformOrigin = 'top center';
    // 縮小時に余計な下部余白を詰める
    if (scale < 1.0) {
      const approxHeight = 840;
      container.style.marginBottom = `-${Math.round((1 - scale) * approxHeight)}px`;
    } else {
      container.style.marginBottom = '0px';
    }
  }

  ['100', '85', '75'].forEach(z => {
    const btn = document.getElementById('zoomBtn_' + z);
    if (btn) btn.classList.toggle('active', Math.round(scale * 100) === Number(z));
  });
}

// ========================================================
// 授業プリント: Googleサイト風 ブロックリサイズ＆フローティングツールバー
// ========================================================

/**
 * 1. ブロック高さの直感ドラッグリサイズ機能
 */
function initBlockResize() {
  let isResizing = false;
  let currentBlockEl = null;
  let currentTargetEl = null;
  let currentField = 'spaceHeight';
  let startY = 0;
  let startHeight = 0;
  let colSide = null;
  let blockIndex = -1;
  let badgeEl = null;

  document.addEventListener('mousedown', (e) => {
    const handle = e.target.closest('.sheet-resize-handle');
    if (!handle) return;

    e.preventDefault();
    e.stopPropagation();

    currentBlockEl = handle.closest('.sheet-block');
    if (!currentBlockEl) return;

    colSide = currentBlockEl.getAttribute('data-col'); // 'left', 'right', or null
    blockIndex = parseInt(currentBlockEl.getAttribute('data-index'), 10);

    // リサイズ対象となる要素を特定
    const boardCanvas = currentBlockEl.querySelector('.board-task-canvas');
    const answerSpace = currentBlockEl.querySelector('.answer-space');
    const pointBody = currentBlockEl.querySelector('.point-summary-body');
    const summaryBox = currentBlockEl.querySelector('.summary-box');
    const reviewBox = currentBlockEl.querySelector('.review-box');
    const objectiveBox = currentBlockEl.querySelector('.objective-box');
    const reflectionComment = currentBlockEl.querySelector('.reflection-comment-line');
    const reflectionBox = currentBlockEl.querySelector('.reflection-box');

    if (boardCanvas) {
      currentTargetEl = boardCanvas;
      currentField = 'thinkingSpaceHeight';
    } else if (answerSpace) {
      currentTargetEl = answerSpace;
      currentField = 'spaceHeight';
    } else if (reflectionComment) {
      currentTargetEl = reflectionComment;
      currentField = 'customHeight';
    } else if (reflectionBox) {
      currentTargetEl = reflectionBox;
      currentField = 'customHeight';
    } else if (pointBody) {
      currentTargetEl = pointBody;
      currentField = 'customHeight';
    } else if (summaryBox) {
      currentTargetEl = summaryBox;
      currentField = 'customHeight';
    } else if (reviewBox) {
      currentTargetEl = reviewBox;
      currentField = 'customHeight';
    } else if (objectiveBox) {
      currentTargetEl = objectiveBox;
      currentField = 'customHeight';
    } else {
      currentTargetEl = currentBlockEl;
      currentField = 'customHeight';
    }

    isResizing = true;
    startY = e.clientY;
    startHeight = currentTargetEl.offsetHeight;

    document.body.classList.add('is-resizing-block');
    currentBlockEl.classList.add('active-resizing');

    // 高さバッジの生成・表示
    badgeEl = document.createElement('div');
    badgeEl.className = 'resize-height-badge';
    badgeEl.textContent = `高さ: ${startHeight}px`;
    handle.appendChild(badgeEl);

    const onMouseMove = (moveEvt) => {
      if (!isResizing || !currentTargetEl) return;
      const deltaY = moveEvt.clientY - startY;
      const minLimit = currentField === 'spaceHeight' ? 24 : (currentField === 'thinkingSpaceHeight' ? 45 : 30);
      const newHeight = Math.max(minLimit, Math.round(startHeight + deltaY));

      currentTargetEl.style.minHeight = `${newHeight}px`;
      if (badgeEl) {
        badgeEl.textContent = `高さ: ${newHeight}px`;
      }
    };

    const onMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;

      document.body.classList.remove('is-resizing-block');
      if (currentBlockEl) currentBlockEl.classList.remove('active-resizing');
      if (badgeEl) {
        badgeEl.remove();
        badgeEl = null;
      }

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (currentTargetEl && !isNaN(blockIndex)) {
        const finalHeight = parseInt(currentTargetEl.style.minHeight, 10) || currentTargetEl.offsetHeight;
        if (colSide) {
          if (typeof updateColBlockData === 'function') {
            updateColBlockData(colSide, blockIndex, currentField, finalHeight);
          }
        } else {
          if (typeof updateBlockData === 'function') {
            updateBlockData(blockIndex, currentField, finalHeight);
          }
        }
        if (typeof updateB4SheetLimitUI === 'function') {
          setTimeout(updateB4SheetLimitUI, 50);
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

/**
 * 2. Googleサイト風 フローティング・テキスト装飾ツールバー
 */
function initFloatingTextToolbar() {
  let toolbar = document.getElementById('floatingTextToolbar');
  if (!toolbar) {
    toolbar = document.createElement('div');
    toolbar.id = 'floatingTextToolbar';
    toolbar.className = 'floating-text-toolbar no-print';

    toolbar.innerHTML = `
      <!-- 太字 -->
      <button type="button" class="ft-btn" id="ftBtnBold" title="太字 (Ctrl+B)">
        <i class="fa-solid fa-bold"></i>
      </button>

      <!-- 下線 -->
      <button type="button" class="ft-btn" id="ftBtnUnderline" title="下線 (Ctrl+U)">
        <i class="fa-solid fa-underline"></i>
      </button>

      <!-- 取り消し線 -->
      <button type="button" class="ft-btn" id="ftBtnStrike" title="取り消し線">
        <i class="fa-solid fa-strikethrough"></i>
      </button>

      <div class="ft-divider"></div>

      <!-- 文字サイズ縮小 / 拡大 -->
      <button type="button" class="ft-btn" id="ftBtnSizeDec" title="文字サイズを縮小">
        <i class="fa-solid fa-font" style="font-size:0.75rem;"></i><span style="font-size:0.7rem;font-weight:700;">-</span>
      </button>
      <span class="ft-size-label" id="ftSizeLabel" title="現在のサイズ">標準</span>
      <button type="button" class="ft-btn" id="ftBtnSizeInc" title="文字サイズを拡大">
        <i class="fa-solid fa-font" style="font-size:0.92rem;"></i><span style="font-size:0.7rem;font-weight:700;">+</span>
      </button>

      <div class="ft-divider"></div>

      <!-- 文字色 (カラーパレット) -->
      <div style="position: relative;">
        <button type="button" class="ft-btn" id="ftBtnColor" title="文字色を変更">
          <i class="fa-solid fa-font"></i>
          <span class="ft-color-bar" id="ftColorBar" style="background:#dc2626;"></span>
        </button>
        <div class="ft-popover" id="ftColorPalette">
          <div class="ft-popover-title">文字色を選択</div>
          <div class="ft-color-grid" id="ftColorGrid">
            <span class="ft-color-dot" data-color="#000000" style="background:#000000; border: 1px solid #64748b;" title="墨 (黒)"></span>
            <span class="ft-color-dot active" data-color="#dc2626" style="background:#dc2626;" title="赤 (重要・採点)"></span>
            <span class="ft-color-dot" data-color="#2563eb" style="background:#2563eb;" title="青 (定義・定理)"></span>
            <span class="ft-color-dot" data-color="#16a34a" style="background:#16a34a;" title="緑 (解法の着眼点)"></span>
            <span class="ft-color-dot" data-color="#ea580c" style="background:#ea580c;" title="橙 (つまずき注意)"></span>
            <span class="ft-color-dot" data-color="#9333ea" style="background:#9333ea;" title="紫 (発展・別解)"></span>
          </div>
          <div class="ft-custom-color-row">
            <span>カスタム色:</span>
            <input type="color" class="ft-custom-color-picker" id="ftCustomColor" value="#dc2626" title="任意の色を選択">
          </div>
        </div>
      </div>

      <!-- ハイライト・蛍光マーカー -->
      <div style="position: relative;">
        <button type="button" class="ft-btn" id="ftBtnHighlight" title="マーカー（蛍光ペン）">
          <i class="fa-solid fa-highlighter"></i>
          <span class="ft-color-bar" id="ftHighlightBar" style="background:#fef08a;"></span>
        </button>
        <div class="ft-popover" id="ftHighlightPalette">
          <div class="ft-popover-title">マーカー色を選択</div>
          <div class="ft-color-grid" id="ftHighlightGrid">
            <span class="ft-color-dot" data-hcolor="transparent" style="background:#334155; display:flex; align-items:center; justify-content:center; color:#cbd5e1; font-size:0.6rem;" title="マーカー解除"><i class="fa-solid fa-ban"></i></span>
            <span class="ft-color-dot active" data-hcolor="#fef08a" style="background:#fef08a;" title="イエローマーカー"></span>
            <span class="ft-color-dot" data-hcolor="#fbcfe8" style="background:#fbcfe8;" title="ピンクマーカー"></span>
            <span class="ft-color-dot" data-hcolor="#bbf7d0" style="background:#bbf7d0;" title="ミントグリーン"></span>
            <span class="ft-color-dot" data-hcolor="#bfdbfe" style="background:#bfdbfe;" title="スカイブルー"></span>
            <span class="ft-color-dot" data-hcolor="#fed7aa" style="background:#fed7aa;" title="オレンジマーカー"></span>
          </div>
        </div>
      </div>

      <div class="ft-divider"></div>

      <!-- 書式クリア -->
      <button type="button" class="ft-btn" id="ftBtnClear" title="書式をクリア (標準に戻す)">
        <i class="fa-solid fa-remove-format"></i>
      </button>
    `;

    document.body.appendChild(toolbar);
  }

  // ツールバー上のクリック時に選択範囲が外れないよう mousedown を preventDefault
  toolbar.addEventListener('mousedown', (e) => {
    // カラーピッカー入力欄以外のボタンやドットの mousedown を防ぐ
    if (e.target.tagName !== 'INPUT') {
      e.preventDefault();
    }
  });

  const btnBold = document.getElementById('ftBtnBold');
  const btnUnderline = document.getElementById('ftBtnUnderline');
  const btnStrike = document.getElementById('ftBtnStrike');
  const btnSizeDec = document.getElementById('ftBtnSizeDec');
  const btnSizeInc = document.getElementById('ftBtnSizeInc');
  const sizeLabel = document.getElementById('ftSizeLabel');
  const btnColor = document.getElementById('ftBtnColor');
  const colorBar = document.getElementById('ftColorBar');
  const colorPalette = document.getElementById('ftColorPalette');
  const colorGrid = document.getElementById('ftColorGrid');
  const customColorInput = document.getElementById('ftCustomColor');
  const btnHighlight = document.getElementById('ftBtnHighlight');
  const highlightBar = document.getElementById('ftHighlightBar');
  const highlightPalette = document.getElementById('ftHighlightPalette');
  const highlightGrid = document.getElementById('ftHighlightGrid');
  const btnClear = document.getElementById('ftBtnClear');

  let currentFontSizeLevel = 3; // 1〜7 (3が標準)
  const sizeNames = {
    1: '極小',
    2: '小',
    3: '標準',
    4: '中',
    5: '大',
    6: '特大',
    7: '超大'
  };

  function updateSizeDisplay() {
    if (sizeLabel) {
      sizeLabel.textContent = sizeNames[currentFontSizeLevel] || '標準';
    }
  }

  function closeAllPopovers() {
    colorPalette?.classList.remove('open');
    highlightPalette?.classList.remove('open');
  }

  // アクティブな contenteditable 要素のデータを即座に state に反映
  function syncActiveEditable() {
    const sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    const editable = sel.anchorNode.nodeType === 1 ? sel.anchorNode.closest('[contenteditable="true"]') : sel.anchorNode.parentElement?.closest('[contenteditable="true"]');
    if (!editable) return;

    editable.dispatchEvent(new Event('input', { bubbles: true }));

    const blockEl = editable.closest('.sheet-block');
    if (!blockEl) return;

    const colSide = blockEl.getAttribute('data-col');
    const index = parseInt(blockEl.getAttribute('data-index'), 10);
    const field = editable.getAttribute('data-field');

    if (field && !isNaN(index)) {
      if (colSide && typeof updateColBlockData === 'function') {
        updateColBlockData(colSide, index, field, editable.innerHTML);
      } else if (typeof updateBlockData === 'function') {
        updateBlockData(index, field, editable.innerHTML);
      }
    }
  }

  // 1. 太字
  btnBold?.addEventListener('click', () => {
    document.execCommand('bold', false, null);
    btnBold.classList.toggle('active', document.queryCommandState('bold'));
    syncActiveEditable();
  });

  // 2. 下線
  btnUnderline?.addEventListener('click', () => {
    document.execCommand('underline', false, null);
    btnUnderline.classList.toggle('active', document.queryCommandState('underline'));
    syncActiveEditable();
  });

  // 3. 取り消し線
  btnStrike?.addEventListener('click', () => {
    document.execCommand('strikeThrough', false, null);
    btnStrike.classList.toggle('active', document.queryCommandState('strikeThrough'));
    syncActiveEditable();
  });

  // 4. 文字サイズ拡大
  btnSizeInc?.addEventListener('click', () => {
    if (currentFontSizeLevel < 7) {
      currentFontSizeLevel++;
      document.execCommand('fontSize', false, currentFontSizeLevel);
      updateSizeDisplay();
      syncActiveEditable();
    }
  });

  // 文字サイズ縮小
  btnSizeDec?.addEventListener('click', () => {
    if (currentFontSizeLevel > 1) {
      currentFontSizeLevel--;
      document.execCommand('fontSize', false, currentFontSizeLevel);
      updateSizeDisplay();
      syncActiveEditable();
    }
  });

  // 5. 文字色 ポップオーバートグル
  btnColor?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = colorPalette?.classList.contains('open');
    closeAllPopovers();
    if (!isOpen) colorPalette?.classList.add('open');
  });

  // カラー選択ドット
  colorGrid?.addEventListener('click', (e) => {
    const dot = e.target.closest('.ft-color-dot');
    if (!dot) return;
    const color = dot.getAttribute('data-color');
    if (!color) return;

    colorGrid.querySelectorAll('.ft-color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');

    document.execCommand('foreColor', false, color);
    if (colorBar) colorBar.style.backgroundColor = color;
    closeAllPopovers();
    syncActiveEditable();
  });

  // カスタムカラーピッカー
  customColorInput?.addEventListener('input', (e) => {
    const color = e.target.value;
    document.execCommand('foreColor', false, color);
    if (colorBar) colorBar.style.backgroundColor = color;
    syncActiveEditable();
  });

  // 6. マーカー・蛍光ペン ポップオーバートグル
  btnHighlight?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = highlightPalette?.classList.contains('open');
    closeAllPopovers();
    if (!isOpen) highlightPalette?.classList.add('open');
  });

  // ハイライト選択ドット
  highlightGrid?.addEventListener('click', (e) => {
    const dot = e.target.closest('.ft-color-dot');
    if (!dot) return;
    const hcolor = dot.getAttribute('data-hcolor');
    if (!hcolor) return;

    highlightGrid.querySelectorAll('.ft-color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');

    if (hcolor === 'transparent') {
      document.execCommand('hiliteColor', false, 'transparent');
      if (highlightBar) highlightBar.style.backgroundColor = 'transparent';
    } else {
      document.execCommand('hiliteColor', false, hcolor);
      if (highlightBar) highlightBar.style.backgroundColor = hcolor;
    }
    closeAllPopovers();
    syncActiveEditable();
  });

  // 7. 書式クリア
  btnClear?.addEventListener('click', () => {
    document.execCommand('removeFormat', false, null);
    currentFontSizeLevel = 3;
    updateSizeDisplay();
    btnBold?.classList.remove('active');
    btnUnderline?.classList.remove('active');
    btnStrike?.classList.remove('active');
    syncActiveEditable();
  });

  // 外側クリックでポップオーバーを閉じる
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.floating-text-toolbar')) {
      closeAllPopovers();
    }
  });

  // テキスト選択検知とツールバーの配置
  let selectionTimeout = null;
  function handleTextSelection() {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.rangeCount) {
        toolbar.classList.remove('visible');
        closeAllPopovers();
        return;
      }

      // 選択範囲がワークシートの contenteditable 内にあるかを検証
      const anchorEl = selection.anchorNode.nodeType === 1 ? selection.anchorNode : selection.anchorNode.parentElement;
      const editable = anchorEl?.closest('.worksheet-workspace [contenteditable="true"]');
      if (!editable) {
        toolbar.classList.remove('visible');
        closeAllPopovers();
        return;
      }

      const selectedText = selection.toString().trim();
      if (selectedText.length === 0) {
        toolbar.classList.remove('visible');
        closeAllPopovers();
        return;
      }

      // 選択範囲の座標取得
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        toolbar.classList.remove('visible');
        return;
      }

      // ボタンのアクティブ状態の同期
      try {
        btnBold?.classList.toggle('active', document.queryCommandState('bold'));
        btnUnderline?.classList.toggle('active', document.queryCommandState('underline'));
        btnStrike?.classList.toggle('active', document.queryCommandState('strikeThrough'));
      } catch (err) {}

      // ツールバーの位置計算
      const toolbarWidth = toolbar.offsetWidth || 340;
      const toolbarHeight = toolbar.offsetHeight || 42;

      let top = rect.top - 10;
      let left = rect.left + rect.width / 2;

      // 画面上部にはみ出る場合は選択範囲の下に表示
      if (top - toolbarHeight < 10) {
        top = rect.bottom + 10;
        toolbar.classList.add('placement-bottom');
      } else {
        toolbar.classList.remove('placement-bottom');
      }

      // 画面左右端のはみ出し防止
      const minLeft = toolbarWidth / 2 + 10;
      const maxLeft = window.innerWidth - toolbarWidth / 2 - 10;
      left = Math.max(minLeft, Math.min(maxLeft, left));

      toolbar.style.top = `${top}px`;
      toolbar.style.left = `${left}px`;
      toolbar.classList.add('visible');
    }, 40);
  }

  document.addEventListener('selectionchange', handleTextSelection);
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keyup', handleTextSelection);
}

// 初期化実行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBlockResize();
    initFloatingTextToolbar();
  });
} else {
  initBlockResize();
  initFloatingTextToolbar();
}
