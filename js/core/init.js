// ==========================================
// 初期化

document.addEventListener('DOMContentLoaded', () => {
  try { setupTabs(); } catch (e) { console.warn('setupTabs:', e); }
  try { setupTimer(); } catch (e) { console.warn('setupTimer:', e); }
  try { updateCurrentDate(); } catch (e) { console.warn('updateCurrentDate:', e); }
  
  // 授業プリント工房（B4見開き）の初期化（最優先）
  try { selectB4Grade('3', true); } catch (e) { console.error('selectB4Grade error:', e); }

  try { initBellSettingsUI(); } catch (e) { console.warn('initBellSettingsUI:', e); }
  try { previewBellSchedule(); } catch (e) { console.warn('previewBellSchedule:', e); }

  try { renderTermSelector(); } catch (e) { console.warn('renderTermSelector:', e); }
  try { if (typeof renderRealTimetableGrid === 'function') renderRealTimetableGrid(); } catch (e) { console.warn('renderRealTimetableGrid:', e); }
  try { if (typeof renderBaseTimetableGrid === 'function') renderBaseTimetableGrid(); } catch (e) { console.warn('renderBaseTimetableGrid:', e); }
  try { if (typeof renderTodayScheduleMini === 'function') renderTodayScheduleMini(); } catch (e) { console.warn('renderTodayScheduleMini:', e); }
  try { if (typeof updateHeroExamStatus === 'function') updateHeroExamStatus(); } catch (e) { console.warn('updateHeroExamStatus:', e); }

  try { initCloudSync(); } catch (e) { console.warn('initCloudSync:', e); }

  try { renderDigitalLibrary(); } catch (e) { console.warn('renderDigitalLibrary:', e); }
  try { loadSampleSheet(true); } catch (e) { console.warn('loadSampleSheet:', e); }
  try { if (typeof renderMathGraph === 'function') renderMathGraph(); else renderLinearGraph(); } catch (e) { console.warn('renderLinearGraph:', e); }
  try { if (typeof onGeometryPatternChange === 'function') onGeometryPatternChange(); else renderGeometryFig(); } catch (e) { console.warn('renderGeometryFig:', e); }
  try { onTestGradeChange(); } catch (e) { console.warn('onTestGradeChange:', e); }
  try { renderMemosList(); } catch (e) { console.warn('renderMemosList:', e); }
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

  // 授業プリントタブに切り替えた際、もし単元セレクトが未設定なら即時初期化
  if (tabId === 'worksheet') {
    const unitSelect = document.getElementById('b4UnitSelect');
    if (!unitSelect || !unitSelect.options || unitSelect.options.length === 0) {
      selectB4Grade(currentB4Grade || '3', true);
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToLauncher() {
  const el = document.getElementById('homeLauncherSection');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ==========================================
// 板書データベース
// ==========================================
const boardLessonDatabase = {
  "1": {
    "gradeLabel": "第1学年",
    "units": [
      {
            "id": "u_1_1",
            "unitName": "第1章 正の数・負の数",
            "totalHours": 8,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "正の数・負の数の意味",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "正の数・負の数を用いて，反対の性質をもつ数量を表すことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "0より小さい数",
                                          "content": "0より大きい数を<strong>正の数</strong>（+をつける），0より小さい数を<strong>負の数</strong>（-をつける）という。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次の温度を符号をつけて表しなさい。<br>(1) 0℃より5℃高い温度<br>(2) 0℃より3℃低い温度",
                                          "answer": "(1) $+5$℃<br>(2) $-3$℃",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "数直線と絶対値・数の大小",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "絶対値の意味を理解し，数直線を使って数の大小を比べることができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "絶対値",
                                          "content": "数直線上で，ある数に対応する点と原点との距離をその数の<strong>絶対値</strong>という。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次の数の絶対値をいいなさい。<br>(1) $+7$<br>(2) $-5$<br>(3) $0$",
                                          "answer": "(1) 7<br>(2) 5<br>(3) 0",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "正負の数の加法（たし算）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "同符号・異符号の2つの数の加法の計算規則を理解し，計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "加法の計算規則",
                                          "content": "・同符号: 共通の符号をつけて絶対値の和<br>・異符号: 絶対値の大きい方の符号をつけて絶対値の差"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $(+3) + (+5)$<br>(2) $(-4) + (-6)$<br>(3) $(+7) + (-2)$",
                                          "answer": "(1) $+8$<br>(2) $-10$<br>(3) $+5$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "正負の数の減法（ひき算）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "減法を加法になおして計算することができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "減法の規則",
                                          "content": "正の数・負の数をひくことは，その数の符号を変えて加えることと同じ。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $(+6) - (+2)$<br>(2) $(+3) - (-5)$<br>(3) $(-4) - (-7)$",
                                          "answer": "(1) $+4$<br>(2) $+8$<br>(3) $+3$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "加減の混じった計算と項",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "かっこを外して加法の項だけの式に直し，能率よく計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "正の項・負の項",
                                          "content": "式を加法だけの形にしたときの各数を<strong>項</strong>という。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $5 - 8 + 2$<br>(2) $-7 + 4 - 3 + 9$",
                                          "answer": "(1) $-1$<br>(2) $3$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "正負の数の乗法と累乗",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "乗法の符号の規則および累乗の計算を理解し，計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "乗法の符号",
                                          "content": "同符号の積は $+$，異符号の積は $-$。負の数が奇数個なら積は $-$，偶数個なら積は $+$。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $(-4) \\times (+6)$<br>(2) $(-3) \\times (-5)$<br>(3) $(-2)^3$",
                                          "answer": "(1) $-24$<br>(2) $+15$<br>(3) $-8$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 7,
                        "title": "正負の数の除法と四則混合",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "逆数を利用した除法および四則の混じった式の計算順序を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "計算の順序",
                                          "content": "① 累乗 ➔ ② かっこの中 ➔ ③ 乗除 ➔ ④ 加減 の順に計算する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $(-18) \\div 3$<br>(2) $8 - 3 \\times (-2)$<br>(3) $4 \\times (-3)^2$",
                                          "answer": "(1) $-6$<br>(2) $14$<br>(3) $36$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 8,
                        "title": "正負の数の利用（平均・基準値）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "正負の数を利用して，基準値からの過不足をもとに平均などを求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "基準との差の利用",
                                          "content": "平均値 ＝ 基準値 ＋（基準との差の平均）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "基準50点に対する5人のテストの差が $+3, -4, +8, 0, -2$ のとき，5人の平均点を求めなさい。",
                                          "answer": "差の合計 $= +5$。平均差 $= 5 \\div 5 = +1$ 点。<br>よって平均点 $= 50 + 1 = 51$ 点",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_1_2",
            "unitName": "第2章 文字と式",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "文字を使った式",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "数量の関係を文字を使った式で表すことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "文字の使用",
                                          "content": "数量を文字で表すことで，一般的な関係や規則性を簡潔に表すことができる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "1本 $a$ 円の鉛筆4本の代金を文字式で表しなさい。",
                                          "answer": "$4 \\times a = 4a$ 円",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "文字式の表し方のルール",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "乗号・除号の省き方，数字と文字の並べ方のルールを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "積と商の表し方",
                                          "content": "・積: $\\times$ を省き，数は文字の前に書く。1は省く。<br>・商: $\\div$ を使わず分数の形で書く。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "記号 $\\times, \\div$ を使わずに表しなさい。<br>(1) $x \\times 5$<br>(2) $a \\times (-1)$<br>(3) $y \\div 4$",
                                          "answer": "(1) $5x$<br>(2) $-a$<br>(3) $\\frac{y}{4}$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "代入と式の値",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "文字に数を代入して，式の値を求めることができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "代入と式の値",
                                          "content": "文字に数をあてはめることを<strong>代入</strong>といい，代入して得られた計算結果を<strong>式の値</strong>という。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$x = -3$ のとき，次の式の値を求めなさい。<br>(1) $2x + 5$<br>(2) $x^2$",
                                          "answer": "(1) $2 \\times (-3) + 5 = -1$<br>(2) $(-3)^2 = 9$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "一次式の加法・減法（同類項をまとめる）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "同じ文字の項をまとめて一次式の計算ができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "同類項の計算",
                                          "content": "$ax + bx = (a + b)x$ として文字の部分が同じ項をまとめる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $4x + 3x$<br>(2) $5x - 2 - 3x + 7$",
                                          "answer": "(1) $7x$<br>(2) $2x + 5$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "一次式と数の乗法・除法",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "分配法則を用いて一次式と数の乗除を計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "分配法則",
                                          "content": "$a(b + c) = ab + ac$, $\\quad (a + b) \\div c = \\frac{a}{c} + \\frac{b}{c}$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $3(2x - 4)$<br>(2) $(12x - 8) \\div 4$",
                                          "answer": "(1) $6x - 12$<br>(2) $3x - 2$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "関係を表す式（等式と不等式）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "数量の関係を等式や不等式を用いて表すことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "等式と不等式",
                                          "content": "・等式: ＝ で等しい関係を表す<br>・不等式: ＜, ＞, ≦, ≧ で大小関係を表す"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "「1本 $x$ 円のペン3本と100円の消しゴムの合計代金は 500円未満である」を式で表しなさい。",
                                          "answer": "$3x + 100 < 500$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
      },
{
            "id": "u_1_4",
            "unitName": "第4章 比例と反比例",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "関数と比例の意味 (y=ax)",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "関数の意味と比例の関係 $y=ax$ を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "比例の式",
                                          "content": "$y = ax$（$a$ は比例定数）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$y$ が $x$ に比例し，$x=3$ のとき $y=12$ です。式を求めなさい。",
                                          "answer": "$12 = a \\times 3 \\implies a = 4$。よって $y = 4x$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "座標とグラフの書き方",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "座標平面上の点の座標を読み取り，点をプロットできる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "座標",
                                          "content": "横の軸を $x$ 軸，縦の軸を $y$ 軸，交点を原点 $O$ とする。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "点 $A(3, 4)$ と 点 $B(-2, 5)$ を座標平面上に表しなさい。",
                                          "answer": "$A$: 右に3・上に4, $B$: 左に2・上に5",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "比例のグラフの特徴",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "比例 $y=ax$ のグラフが原点を通る直線であることを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "比例のグラフ",
                                          "content": "原点 $(0, 0)$ を通る直線。$a>0$ なら右上がり，$a<0$ なら右下がり。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$y = 2x$ のグラフ上の原点以外の点 $(1, \\Box)$ を答えなさい。",
                                          "answer": "$(1, 2)$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "反比例の意味 (y=a/x)",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "反比例の関係 $y=\\frac{a}{x}$ および $xy=a$ を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "反比例の式",
                                          "content": "$y = \\frac{a}{x}$ または $xy = a$（積が一定）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$y$ が $x$ に反比例し，$x=4$ のとき $y=6$ です。式を求めなさい。",
                                          "answer": "$a = 4 \\times 6 = 24$。よって $y = \\frac{24}{x}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "反比例のグラフ（双曲線）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "反比例のグラフが双曲線になることを理解し，グラフをかく。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "双曲線",
                                          "content": "反比例のグラフは一対のなめらかな曲線（双曲線）になる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$y = \\frac{12}{x}$ のグラフが通る整数の座標を3つ挙げなさい。",
                                          "answer": "$(1, 12), (2, 6), (3, 4)$ など",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "比例・反比例の利用",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "日常生活の具体的な問題を比例や反比例の式を用いて解決する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "関数の利用",
                                          "content": "変数を $x, y$ とおき，式を立てて未知の値を求める。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "水槽に毎分 4L ずつ水を入れるとき，$x$ 分後の水量を $y$ L として式をつくりなさい。",
                                          "answer": "$y = 4x$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_1_5",
            "unitName": "第5章 平面図形",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "直線と角・図形の移動",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "線分・半直線・平行・垂直の記号と，平行移動・回転移動・対称移動を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "図形の移動",
                                          "content": "移動させても図形の形や大きさは変わらない。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "平行移動・回転移動・対称移動の違いを説明しなさい。",
                                          "answer": "一定方向に動かす，点を中心に回す，直線を折り目にして裏返す",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "基本の作図①（垂直二等分線）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "線分の垂直二等分線の性質を理解し，コンパスと定規で作図できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "垂直二等分線",
                                          "content": "2点から等しい距離にある点の集まり。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "線分 $AB$ の垂直二等分線を作図する手順をまとめなさい。",
                                          "answer": "両端 $A, B$ から等しい半径の円弧をかき，交点を結ぶ。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "基本の作図②（角の二等分線）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "角の二等分線の性質を理解し，作図できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "角の二等分線",
                                          "content": "角の2辺から等しい距離にある点の集まり。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$\\angle AOB$ の二等分線を作図する手順を書きなさい。",
                                          "answer": "頂点 $O$ から円弧をかいて辺との交点を求め，交点から等しい半径の弧をかく。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "基本の作図③（垂線の作図）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "直線上の点や直線外の点を通る垂線を作図できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "垂線の作図",
                                          "content": "指定された点を中心に対称な2点を直線上にとり，垂直二等分線を作図する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "直線 $l$ 外の点 $P$ を通る垂線を作図する手順を書きなさい。",
                                          "answer": "$P$ を中心とする円を描き，$l$ との2交点から等距離の交点を作って結ぶ。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "円とおうぎ形の弧の長さ・面積",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "円周率 $\\pi$ を用い，おうぎ形の中心角・弧の長さ・面積を求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "おうぎ形の公式",
                                          "content": "弧の長さ: $l = 2\\pi r \\times \\frac{a}{360}$<br>面積: $S = \\pi r^2 \\times \\frac{a}{360} = \\frac{1}{2}lr$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "半径 6cm，中心角 60°のおうぎ形の弧の長さと面積を求めなさい。",
                                          "answer": "弧: $2\\pi \\times 6 \\times \\frac{60}{360} = 2\\pi$ cm<br>面積: $\\pi \\times 6^2 \\times \\frac{60}{360} = 6\\pi$ cm$^2$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "平面図形の作図の活用演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "基本作図を組み合わせて，条件に合う点や直線を作図する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "作図の利用",
                                          "content": "どの基本作図（垂直二等分線・角の二等分線・垂線）を使うか見抜く。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "3点 $A, B, C$ から等しい距離にある点 $P$ を見つけるにはどう作図すればよいか？",
                                          "answer": "線分 $AB$ と線分 $BC$ の垂直二等分線の交点を求める。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_1_6",
            "unitName": "第6章 空間図形",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "いろいろな立体と空間の位置関係",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "柱体・錐体・回転体と，空間内の直線と平面の位置関係（ねじれの位置など）を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "ねじれの位置",
                                          "content": "平行でなく，交わらない2直線の位置関係。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "直方体において，辺 $AB$ とねじれの位置にある辺を挙げなさい。",
                                          "answer": "平行でなく交わらない辺（例: $CG, DH, FG, EH$ など）",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "立体の展開図と投影図",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "角柱・円柱・錐体の展開図や，立面図と平面図（投影図）を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "投影図",
                                          "content": "正面から見た図（立面図）と真上から見た図（平面図）で立体を表す。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円錐の展開図の側面はどのような形になるか？",
                                          "answer": "おうぎ形",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "角柱・円柱の表面積と体積",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "柱体の表面積（底面積×2＋側面積）および体積（底面積×高さ）を求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "柱体の公式",
                                          "content": "体積: $V = Sh$（$S$: 底面積, $h$: 高さ）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "底面の半径が 3cm，高さが 5cm の円柱の体積を求めなさい。",
                                          "answer": "$V = \\pi \\times 3^2 \\times 5 = 45\\pi$ cm$^3$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "角錐・円錐の表面積と体積",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "錐体の表面積および体積（$\\frac{1}{3}Sh$）を求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "錐体の公式",
                                          "content": "体積: $V = \\frac{1}{3}Sh$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "底面の半径が 3cm，高さが 4cm の円錐の体積を求めなさい。",
                                          "answer": "$V = \\frac{1}{3} \\times \\pi \\times 3^2 \\times 4 = 12\\pi$ cm$^3$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "球の表面積と体積",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "球の表面積公式 $4\\pi r^2$ と体積公式 $\\frac{4}{3}\\pi r^3$ を理解し，計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "球の公式",
                                          "content": "表面積: $S = 4\\pi r^2$<br>体積: $V = \\frac{4}{3}\\pi r^3$ （身の上に心配あるので参上）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "半径 3cm の球の表面積と体積を求めなさい。",
                                          "answer": "表面積: $4\\pi \\times 3^2 = 36\\pi$ cm$^2$<br>体積: $\\frac{4}{3}\\pi \\times 3^3 = 36\\pi$ cm$^3$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "空間図形の総合演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "複合的な立体の表面積や体積を求めることができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "立体の求積のコツ",
                                          "content": "基本となる柱体・錐体・球に分割するか，引いて求める。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円柱の上に半球が乗った立体の体積の求め方を整理しなさい。",
                                          "answer": "円柱の体積 $+$ 半球の体積（球の体積 $\\div 2$）",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_1_7",
            "unitName": "第7章 データの活用",
            "totalHours": 4,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "度数分布表とヒストグラム",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "階級・度数の意味を理解し，度数分布表やヒストグラムを作成・整理できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "度数分布表",
                                          "content": "データをいくつかの区間（階級）に分け，それぞれの区間に属する個数（度数）をまとめた表。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "「10以上15未満」の階級値（階級の中央の値）を求めなさい。",
                                          "answer": "$(10 + 15) \\div 2 = 12.5$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "相対度数と度数折れ線",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "全体の度数が異なる集団を比較するために相対度数を用いる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "相対度数",
                                          "content": "相対度数 ＝ $\\frac{\\text{その階級の度数}}{\\text{度数の合計}}$ （合計は 1 になる）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "全体 40人中，ある階級の度数が 8人のとき，その相対度数を求めなさい。",
                                          "answer": "$8 \\div 40 = 0.2$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "代表値（平均値・中央値・最頻値）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "平均値・中央値（メジアン）・最頻値（モード）の意味と使い分けを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "代表値",
                                          "content": "・平均値: 合計 $\\div$ 度数<br>・中央値: 順に並べたとき中央の値<br>・最頻値: 最も度数の多い階級値"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "データ $2, 3, 5, 5, 9$ の中央値と最頻値を求めなさい。",
                                          "answer": "中央値: 5, 最頻値: 5",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "近似値と有効数字",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "測定値の有効数字を理解し，$a \\times 10^n$ の形で表すことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "有効数字",
                                          "content": "信頼できる数字を有効数字という。有効数字3桁なら整数部1桁の小数 $\\times 10^n$ で表す。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "測定値 1500m（有効数字3桁）を $a \\times 10^n$ の形で表しなさい。",
                                          "answer": "$1.50 \\times 10^3$ m",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
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
            "id": "u_2_1",
            "unitName": "第1章 式の計算",
            "totalHours": 8,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "単項式と多項式・次数",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "単項式・多項式の意味，および文字の個数による次数を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "単項式と多項式・次数",
                                          "content": "・単項式: 数や文字の積だけで表された式<br>・多項式: 単項式の和の形で表された式<br>・次数: かけ合わされている文字の個数"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次の式の次数を答えなさい。<br>(1) $3x^2$<br>(2) $5ab^2$<br>(3) $2x^2 - 4x + 1$",
                                          "answer": "(1) 2次<br>(2) 3次<br>(3) 2次",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "同類項をまとめる計算",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "文字の部分が同じ同類項をまとめ，式を簡単にできる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "同類項",
                                          "content": "多項式で，文字の部分が全く同じ項を<strong>同類項</strong>という。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $3a + 5b - a + 2b$<br>(2) $4x^2 - 3x - 2x^2 + 5x$",
                                          "answer": "(1) $2a + 7b$<br>(2) $2x^2 + 2x$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "多項式の加法と減法",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "多項式どうしのたし算・ひき算をかっこをつけて正確に計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "多項式の減法",
                                          "content": "ひく方の式の各項の符号を変えて加える。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $(3x - 2y) + (x + 5y)$<br>(2) $(4a - 3b) - (2a - 5b)$",
                                          "answer": "(1) $4x + 3y$<br>(2) $2a + 2b$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "単項式の乗法と除法",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "単項式どうしの積・商を，指数の意味に注意して計算できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "乗除の計算",
                                          "content": "数は数どうし，文字は文字どうしで計算する。除法は分数の形になおす。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次を計算しなさい。<br>(1) $2a \\times 5b$<br>(2) $(-3x)^2$<br>(3) $12a^2b \\div 4a$",
                                          "answer": "(1) $10ab$<br>(2) $9x^2$<br>(3) $3ab$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "式の値の求め方",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "与えられた式をまず簡単にしてから代入し，効率よく式の値を求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "式の値の工夫",
                                          "content": "いきなり代入せず，まず同類項を整理して最も簡単な式にしてから代入する！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$a = 3, b = -2$ のとき，$(5a + 2b) - (3a - 4b)$ の値を求めなさい。",
                                          "answer": "式を整理すると $2a + 6b$。<br>代入して $2 \\times 3 + 6 \\times (-2) = 6 - 12 = -6$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "文字式の利用（整数の性質の証明）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "偶数・奇数・2桁の自然数などを文字で表し，数の性質を説明・証明できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "整数の文字による表現",
                                          "content": "整数を $n$ とすると，偶数は $2n$，奇数は $2n+1$，連続する3つの整数は $n, n+1, n+2$ と表せる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "「2つの奇数の和は必ず偶数になる」ことを文字を使って説明しなさい。",
                                          "answer": "2つの奇数を $2m+1, 2n+1$ とすると，和は $(2m+1)+(2n+1) = 2(m+n+1)$。$m+n+1$ は整数なので2の倍数（偶数）である。",
                                          "spaceHeight": 80
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 7,
                        "title": "等式の変形（文字について解く）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "等式の性質を用いて，等式を指定された文字について解くことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "等式の変形",
                                          "content": "指定された文字が左辺に1つだけ残るよう，移項や両辺の乗除を行う。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "次の等式を指定された文字について解きなさい。<br>(1) $2x + y = 6 \\quad [y]$<br>(2) $l = 2\\pi r \\quad [r]$",
                                          "answer": "(1) $y = -2x + 6$<br>(2) $r = \\frac{l}{2\\pi}$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 8,
                        "title": "式の計算のまとめと演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "式の計算全般をマスターし，発展的な文字式の利用問題に取り組む。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "章の要点",
                                          "content": "計算ミスをなくす符号の管理と，文字を使って数量関係を説明する論理力を身につける。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "2桁の自然数と，その十の位と一の位を入れかえた数の和が11の倍数になる理由を説明しなさい。",
                                          "answer": "もとの数を $10a+b$，入れかえた数を $10b+a$ とすると，和は $11a+11b = 11(a+b)$ となり11の倍数。",
                                          "spaceHeight": 80
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_2_2",
            "unitName": "第2章 連立方程式",
            "totalHours": 8,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "連立方程式とその解の意味",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "二元一次方程式とその連立方程式，および共通の解の意味を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "連立方程式の解",
                                          "content": "2つの方程式を同時に成り立たせる文字の値の組を<strong>連立方程式の解</strong>という。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$x + y = 7, \\; 2x + y = 10$ の解を確かめなさい。<br>$(x, y) = (3, 4)$ は解か？",
                                          "answer": "$3+4=7$, $2(3)+4=10$ となり，両方成り立つので解である。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "加減法による解き方①（同係数）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "係数が一致または符号違いのとき，両辺を足す・引くことで1文字消去して解く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "加減法",
                                          "content": "2つの式をたしたりひいたりして，1つの文字を消去（なくす）して解く方法。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "連立方程式 $\\begin{cases} 2x + y = 9 \\\\ 2x - y = 5 \\end{cases}$ を解きなさい。",
                                          "answer": "2式を足すと $4x = 14$ ... $x = 3.5, y = 2$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "加減法による解き方②（最小公倍数にそろえる）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "両辺に数をかけて係数の絶対値をそろえ，加減法で解くことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "係数をそろえるステップ",
                                          "content": "消去したい文字の係数の最小公倍数を見つけ，それぞれの式を何倍かする。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "連立方程式 $\\begin{cases} 3x + 2y = 13 \\\\ 2x + 3y = 12 \\end{cases}$ を解きなさい。",
                                          "answer": "$x = 3, \\; y = 2$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "代入法による解き方",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "一方の方程式を他方に代入して文字を消去し，連立方程式を解く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "代入法",
                                          "content": "$y = 2x + 1$ のように片方の文字について解かれているときは代入法が圧倒的に便利！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "連立方程式 $\\begin{cases} y = 2x - 1 \\\\ 3x + 2y = 12 \\end{cases}$ を解きなさい。",
                                          "answer": "$3x + 2(2x - 1) = 12 \\implies 7x = 14 \\implies x = 2, \\; y = 3$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "いろいろな連立方程式（かっこ・小数・分数）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "かっこを展開し，小数・分数を整数になおして簡単な形に整理して解く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "整理の手順",
                                          "content": "・かっこ: 外して同類項をまとめる<br>・小数: 10倍, 100倍する<br>・分数: 分母の公倍数をかけて分母を払う"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$\\begin{cases} 0.2x + 0.5y = 1.6 \\\\ \\frac{x}{3} - \\frac{y}{2} = -1 \\end{cases}$ を解きなさい。",
                                          "answer": "$x = 3, \\; y = 2$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "連立方程式の利用①（代金と個数）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "代金と個数の数量関係から2つの方程式をつくり，問題を解決できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "文章題の解き方",
                                          "content": "① 求めたい2つの数量を $x, y$ とおく。<br>② 2つの等式をつくる。<br>③ 連立方程式を解いて解が問題に適しているか確かめる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "りんご1個120円，みかん1個80円を合わせて10個買い，代金は1000円だった。それぞれの個数を求めなさい。",
                                          "answer": "りんご $x$ 個，みかん $y$ 個として $\\begin{cases} x + y = 10 \\\\ 120x + 80y = 1000 \\end{cases}$。<br>りんご 5個，みかん 5個",
                                          "spaceHeight": 80
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 7,
                        "title": "連立方程式の利用②（速さ・時間・道のり）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "速さに関する問題において，道のりと時間の関係から立式して解決する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "速さの公式の活用",
                                          "content": "道のりの合計の式と，時間の合計の式の2本を立てる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "家から駅まで 1500m の道のりを，はじめ分速 60m で歩き，途中から分速 150m で走ったら 16分かかった。歩いた道のりを求めなさい。",
                                          "answer": "歩き $x$ 分，走り $y$ 分として $\\begin{cases} x + y = 16 \\\\ 60x + 150y = 1500 \\end{cases}$。<br>歩いた時間 10分，歩いた道のり 600m",
                                          "spaceHeight": 80
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 8,
                        "title": "連立方程式の利用③（割合・増減の問題）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "生徒数の増減や食塩水の濃度など，割合を含む複雑な数量関係を連立方程式で解決する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "割合の立式",
                                          "content": "もとの数量を $x, y$ とおき，増減分または全体の数量で等式をつくる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "ある中学校の昨年の生徒数は300人。今年は男子が5%増え，女子が3%減って全体で1人増えた。昨年の男子の人数を求めなさい。",
                                          "answer": "昨年の男子 $x$ 人，女子 $y$ 人として $\\begin{cases} x + y = 300 \\\\ 0.05x - 0.03y = 1 \\end{cases}$。<br>男子 125人",
                                          "spaceHeight": 80
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
{
        "id": "u_2_3",
        "unitName": "第3章 一次関数 y=ax+b",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
      },
{
            "id": "u_2_4",
            "unitName": "第4章 平行と合同",
            "totalHours": 8,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "対頂角・同位角・錯角の性質",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "2直線の交わる角の性質（対頂角は等しい）と同位角・錯角の位置関係を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "平行線と角",
                                          "content": "2直線が平行ならば，同位角は等しく，錯角は等しい。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "平行な2直線 $l, m$ に1本の直線が交わるとき，同位角と錯角の性質を答えなさい。",
                                          "answer": "同位角は等しい。錯角は等しい。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "平行線になるための条件",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "同位角や錯角が等しければ，2直線は平行になることを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "平行になる条件",
                                          "content": "同位角が等しいか，錯角が等しければ，その2直線は平行である。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "2直線が平行であることを確かめるには，どの角に注目すればよいか？",
                                          "answer": "同位角または錯角が等しいかを確かめる。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "三角形の内角と外角の性質",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "三角形の内角の和は180°であることと，外角の性質を理解し角の大きさを求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "三角形の角",
                                          "content": "・内角の和 $= 180^\\circ$<br>・三角形の1つの外角は，それと隣り合わない2つの内角の和に等しい。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "三角形の2つの内角が 50°と 70°のとき，残りの1つの内角と外角を求めなさい。",
                                          "answer": "内角: $180 - (50 + 70) = 60^\\circ$<br>外角: $50 + 70 = 120^\\circ$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "多角形の内角の和と外角の和",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "$n$ 角形の内角の和 $180^\\circ \\times (n - 2)$ と外角の和（常に360°）を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "多角形の角の公式",
                                          "content": "・$n$ 角形の内角の和: $180^\\circ \\times (n - 2)$<br>・どんな多角形でも外角の和は常に $360^\\circ$！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "正八角形の1つの内角の大きさを求めなさい。",
                                          "answer": "内角の和: $180 \\times (8 - 2) = 1080^\\circ$。<br>1つの内角: $1080 \\div 8 = 135^\\circ$ （または外角 $360 \\div 8 = 45^\\circ$ より $180 - 45 = 135^\\circ$）",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "合同な図形と三角形の合同条件",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "三角形の3つの合同条件を正確に理解し，合同な三角形を見つけることができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "三角形の合同条件",
                                          "content": "① 3組の辺がそれぞれ等しい<br>② 2組の辺とその間の角がそれぞれ等しい<br>③ 1組の辺とその両端の角がそれぞれ等しい"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "三角形の合同条件を3つすべて書き出しなさい。",
                                          "answer": "① 3組の辺がそれぞれ等しい<br>② 2組の辺とその間の角がそれぞれ等しい<br>③ 1組の辺とその両端の角がそれぞれ等しい",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "証明の進め方と論理的な書き方",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "仮定と結論を整理し，根拠を明確にしながら合同の証明を書くことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "証明の枠組み",
                                          "content": "① $\\triangle ABC$ と $\\triangle DEF$ において<br>② 仮定より等しい辺や角を並べる（根拠を示す）<br>③ 合同条件を述べて $\\triangle ABC \\equiv \\triangle DEF$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "証明における「仮定」と「結論」の意味を答えなさい。",
                                          "answer": "仮定: あらかじめ成り立っている条件（〜ならば）。<br>結論: 導き出したい結論（〜である）。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 7,
                        "title": "三角形の合同の証明",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "図形の性質（対頂角・共通な辺など）を利用して合同を証明する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "等しい理由の発見",
                                          "content": "仮定だけでなく，共通な角，共通な辺，対頂角，平行線の錯角などを見つけよう。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "2つの三角形で重なり合っている辺は，証明で何と根拠づければよいか？",
                                          "answer": "「共通な辺より」と根拠づける。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 8,
                        "title": "合同を利用した線分や角の証明",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "三角形の合同を証明したあと，対応する辺や角が等しいことを導く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "合同の先にある結論",
                                          "content": "合同な図形の対応する辺の長さ・角の大きさはそれぞれ等しい！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "辺の長さが等しいことを証明する王道の流れをまとめなさい。",
                                          "answer": "その辺をそれぞれ含む2つの三角形の合同を証明し，対応する辺が等しいことを言う。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_2_5",
            "unitName": "第5章 三角形と四角形",
            "totalHours": 8,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "二等辺三角形の定義と性質",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "二等辺三角形の定義（2辺が等しい）と性質（底角が等しい，頂角の二等分線は底辺を垂直に2等分する）を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "二等辺三角形の性質",
                                          "content": "・2つの底角は等しい。<br>・頂角の二等分線は，底辺を垂直に2等分する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "頂角が 40°の二等辺三角形の1つの底角の大きさを求めなさい。",
                                          "answer": "$(180 - 40) \\div 2 = 70^\\circ$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "二等辺三角形になるための条件",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "2つの角が等しい三角形は二等辺三角形であることを証明し，理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "二等辺三角形になる条件",
                                          "content": "2つの角が等しい三角形は，それらの角に対する2辺が等しい二等辺三角形である。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "三角形の2つの内角が 55°と 70°のとき，これは二等辺三角形といえるか？",
                                          "answer": "残りの角は $180 - (55 + 70) = 55^\\circ$。2つの角が55°で等しいので二等辺三角形といえる。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "直角三角形の合同条件",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "直角三角形の特別な2つの合同条件を理解し，証明に活用できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "直角三角形の合同条件",
                                          "content": "① 斜辺と1つの鋭角がそれぞれ等しい<br>② 斜辺と他の1辺がそれぞれ等しい"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "直角三角形の合同条件を2つ答えなさい。",
                                          "answer": "① 斜辺と1つの鋭角がそれぞれ等しい<br>② 斜辺と他の1辺がそれぞれ等しい",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "平行四辺形の定義と性質",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "平行四辺形の定義（2組の対辺が平行）と3つの性質を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "平行四辺形の性質",
                                          "content": "① 2組の対辺はそれぞれ等しい<br>② 2組の対角はそれぞれ等しい<br>③ 対角線はそれぞれの中点で交わる"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "平行四辺形の3つの性質を答えなさい。",
                                          "answer": "① 2組の対辺はそれぞれ等しい<br>② 2組の対角はそれぞれ等しい<br>③ 対角線はそれぞれの中点で交わる",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "平行四辺形になるための条件",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "平行四辺形になる5つの条件を理解し，四角形が平行四辺形であることを証明できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "平行四辺形になる条件",
                                          "content": "定義＋3つの性質の逆に加え，<br>★ <strong>1組の対辺が平行でその長さが等しい</strong>"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "最も証明でよく使われる「1組の対辺〜」の平行四辺形になる条件を書きなさい。",
                                          "answer": "1組の対辺が平行でその長さが等しいとき。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "特別な平行四辺形（長方形・ひし形・正方形）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "長方形・ひし形・正方形の定義と，対角線の性質の違いを整理・理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "対角線の性質",
                                          "content": "・長方形: 対角線の長さが等しい<br>・ひし形: 対角線が垂直に交わる<br>・正方形: 長さが等しく垂直に交わる"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "対角線が垂直に交わる平行四辺形は何というか？",
                                          "answer": "ひし形",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 7,
                        "title": "平行線と面積（等積変形）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "底辺が共通で高さが等しい三角形の面積が等しいことを利用し，図形の形を変形する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "等積変形",
                                          "content": "底辺が同じで頂点が底辺に平行な直線上を動くとき，三角形の面積は変わらない。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "平行な2直線 $l, m$ があり，底辺 $BC$ が直線 $l$ 上にあるとき，$m$ 上の任意の点 $A, A'$ について $\\triangle ABC$ と $\\triangle A'BC$ の面積はどうなるか？",
                                          "answer": "底辺と高さが共通なので面積は等しい。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 8,
                        "title": "三角形と四角形のまとめと演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "章全体の定義・定理・条件を有機的に結びつけ，発展的な証明問題に挑む。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "証明の極意",
                                          "content": "図形の包摂関係（一般の四角形 ➔ 台形 ➔ 平行四辺形 ➔ 長方形・ひし形 ➔ 正方形）を頭に入れよう。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "四角形 $ABCD$ の各辺の中点を結んでできる四角形はどんな四角形になるか？",
                                          "answer": "平行四辺形になる（中点連結定理を利用）",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_2_6",
            "unitName": "第6章 確率",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "確率の意味と起こりやすさ",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "同様に確からしい事象において，確率の意味と求め方（$\\frac{a}{n}$）を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "確率の公式",
                                          "content": "確率 $P = \\frac{\\text{その事柄の起こる場合の数}}{\\text{すべての場合の数}}$ （$0 \\le P \\le 1$）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "1個のさいころを投げるとき，偶数の目が出る確率を求めなさい。",
                                          "answer": "全体は 6通り，偶数は 2, 4, 6 の 3通り。<br>確率 $= \\frac{3}{6} = \\frac{1}{2}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "樹形図を使った場合の数と確率",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "硬貨投げや並び方など，もれなく重複なく数えるために樹形図を活用する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "樹形図の書き方",
                                          "content": "枝分かれを規則正しく書き出し，すべての場合の数を数え上げる。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "3枚の硬貨を同時に投げるとき，表が2枚，裏が1枚出る確率を求めなさい。",
                                          "answer": "全体は $2^3 = 8$ 通り。(表,表,裏), (表,裏,表), (裏,表,表) の 3通り。<br>確率 $= \\frac{3}{8}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "表を使った確率（さいころ2個）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "大・小2個のさいころを投げる問題を，6×6の正方形の表を使って解く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "さいころ2個の全事象",
                                          "content": "全体の場合の数は $6 \\times 6 = 36$ 通り。マス目を作って該当する箇所に◯をつける！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "大・小2個のさいころを投げるとき，目の和が 7 になる確率を求めなさい。",
                                          "answer": "目の和が7になる組: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) の 6通り。<br>確率 $= \\frac{6}{36} = \\frac{1}{6}$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "カードやくじ引きの確率",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "戻さない取り出し方や，順番による場合の数の違いを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "非復元抽出",
                                          "content": "同時に2枚引くときや，1枚ずつ続けて引くときは同じカードが2回出ないことに注意！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "1, 2, 3, 4 の4枚のカードから同時に2枚引くとき，2枚とも奇数である確率を求めなさい。",
                                          "answer": "全体は $\\frac{4 \\times 3}{2} = 6$ 通り。奇数2枚は (1, 3) の 1通り。<br>確率 $= \\frac{1}{6}$",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "「少なくとも〜」の確率（余事象の考え方）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "「少なくとも1つは〜」の確率を，$1 - (\\text{すべて〜でない確率})$ で能率よく計算する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "余事象の活用",
                                          "content": "（少なくとも1回は表）＝ 1 －（すべて裏が出る確率）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "硬貨を3枚投げるとき，少なくとも1枚は表が出る確率を求めなさい。",
                                          "answer": "すべて裏が出る確率は $\\frac{1}{8}$。<br>よって $1 - \\frac{1}{8} = \\frac{7}{8}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "確率のまとめと総合演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "条件付きの場合の数や，実験・観察による統計的確率と数学的確率の関係を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "大数の法則",
                                          "content": "実験回数を極めて多くすると，相対度数は数学的確率の値に近づいていく。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "くじ引きで「先に引く人」と「後から引く人」で当たる確率は変わるか？",
                                          "answer": "変わらない（どちらも同じ確率になる）",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_2_7",
            "unitName": "第7章 データの比較",
            "totalHours": 4,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "四分位数と四分位範囲",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "第1四分位数・第2四分位数（中央値）・第3四分位数と四分位範囲の意味を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "四分位数",
                                          "content": "データを小さい順に並べ，4等分する位置にある値。<br>四分位範囲 ＝ 第3四分位数（$Q_3$）－ 第1四分位数（$Q_1$）"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "データ $1, 3, 4, 6, 8, 9, 11$ の $Q_1, Q_2, Q_3$ を求めなさい。",
                                          "answer": "中央値 $Q_2 = 6$。前半 $1, 3, 4$ の中央 $Q_1 = 3$。後半 $8, 9, 11$ の中央 $Q_3 = 9$。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "箱ひげ図の書き方と読み取り",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "最小値・$Q_1$・$Q_2$・$Q_3$・最大値の5つの値をもとに箱ひげ図をかくことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "箱ひげ図",
                                          "content": "箱の長さが四分位範囲（データの中心50%の散らばり）を表し，ひげの端が最小値・最大値を表す。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "箱ひげ図の「箱」の中に，データ全体の約何％が含まれているか？",
                                          "answer": "約 50％",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "箱ひげ図を用いた複数のデータの比較",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "2つ以上のクラスやグループの箱ひげ図を並べ，データのばらつきや傾向を比較・考察する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "データの比較の視点",
                                          "content": "・中央値の位置（全体的な高さ）<br>・箱の長さ（散らばりの度合い）<br>・最大値・最小値の範囲"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "A組とB組で，箱ひげ図の箱の横幅がB組の方が広いとき，何がわかるか？",
                                          "answer": "中央付近50%のデータの散らばりがB組の方が大きい。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "データの傾向の読み取りとまとめ",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "ヒストグラムと箱ひげ図を対応づけ，多角的にデータを分析して判断を下す。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "データの活用",
                                          "content": "単一の代表値だけでなく，箱ひげ図や分布の形を合わせて根拠をもって判断する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "平均値だけでなく四分位範囲や箱ひげ図を見るメリットを答えなさい。",
                                          "answer": "極端な外れ値の影響を受けにくく，データの散らばり具合を把握できるから。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
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
                  "text": "問題１　次の (1) と (2) の式を計算するにはどうすればよいだろう。<br><br>(1) $(-3a + b) \\times 4a$<br>(2) $-3a \\times (4a - 5b)$",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "本時のまとめ",
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
                  "text": "次の (3) と (4) の式を計算するにはどうすればよいだろう。<br><br>(3) $(6x^2 - 4x) \\div 2x$<br>(4) $(6x^2 - 4x) \\div \\frac{2}{3}x$",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "text": "課題　$\\sqrt{a} \\times \\sqrt{b}$ はどのように計算すればよいだろう。",
                  "guide": "教科書の例題を参考にしながら考えてみよう。",
                  "thinkingSpaceHeight": 85,
                  "answer": "各自で計算の過程をしっかり残すこと。"
                }
              },
              {
                "type": "point-box",
                "data": {
                  "badge": "本時のまとめ",
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
                  "text": "どんな数でも，$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$ が成り立つことを説明しよう。",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
        "unitName": "第4章 関数 y=ax²",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
                  "badge": "本時のまとめ",
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
      },
{
            "id": "u_3_5",
            "unitName": "第5章 図形と相似",
            "totalHours": 8,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "相似な図形と相似比",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "拡大・縮小の関係にある相似な図形の意味，対応する辺の比（相似比）と角の性質を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "相似な図形の性質",
                                          "content": "・対応する線分の比（相似比）はすべて等しい。<br>・対応する角の大きさはそれぞれ等しい。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "$\\triangle ABC \\sim \\triangle DEF$ で相似比が $2 : 3$ のとき，$AB = 6\\text{cm}$ に対する $DE$ の長さを求めなさい。",
                                          "answer": "$6 : DE = 2 : 3 \\implies DE = 9\\text{cm}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "三角形の相似条件",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "三角形の3つの相似条件を理解し，相似な三角形を見つけることができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "三角形の相似条件",
                                          "content": "① 3組の辺の比がすべて等しい<br>② 2組の辺の比とその間の角がそれぞれ等しい<br>③ 2組の角がそれぞれ等しい"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "三角形の相似条件を3つ答えなさい。",
                                          "answer": "① 3組の辺の比がすべて等しい<br>② 2組の辺の比とその間の角がそれぞれ等しい<br>③ 2組の角がそれぞれ等しい",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "三角形の相似の証明",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "「2組の角がそれぞれ等しい」を中心に，相似の論理的な証明を書くことができる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "相似証明のポイント",
                                          "content": "共通な角や平行線の同位角・錯角，対頂角を使って2組の等しい角を見つけよう！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "相似の証明で最も頻繁に用いられる相似条件はどれか？",
                                          "answer": "「2組の角がそれぞれ等しい」",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "平行線と線分の比の定理",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "三角形と比の定理，および平行線によって切り取られる線分の比の定理を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "平行線と比",
                                          "content": "$BC // DE$ ならば $AD : AB = AE : AC = DE : BC$ および $AD : DB = AE : EC$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "平行線と比の定理を用いて未知の線分の長さを求める手順を述べなさい。",
                                          "answer": "平行線による相似な三角形を見つけ，対応する辺の比の方程式を立てる。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "中点連結定理とその逆",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "三角形の2辺の中点を結ぶ線分が底辺に平行で，長さが底辺の半分になる定理を理解・証明する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "中点連結定理",
                                          "content": "中点 $M, N$ を結ぶと $MN // BC$ かつ $MN = \\frac{1}{2}BC$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "底辺が 10cm の三角形の2辺の中点を結んだ線分の長さを求めなさい。",
                                          "answer": "$10 \\times \\frac{1}{2} = 5\\text{cm}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "相似な図形の面積比",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "相似比が $m : n$ のとき，面積比が $m^2 : n^2$ になることを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "面積比の定理",
                                          "content": "相似比が $m : n$ ならば，面積比は $m^2 : n^2$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "相似比が $2 : 3$ の相似な2つの図形の面積比を求めなさい。",
                                          "answer": "$2^2 : 3^2 = 4 : 9$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 7,
                        "title": "相似な立体の表面積比と体積比",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "相似比が $m : n$ のとき，表面積比は $m^2 : n^2$，体積比は $m^3 : n^3$ になることを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "体積比の定理",
                                          "content": "相似比が $m : n$ ならば，体積比は $m^3 : n^3$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "相似比が $1 : 2$ の立体の体積比を求めなさい。",
                                          "answer": "$1^3 : 2^3 = 1 : 8$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 8,
                        "title": "縮図の利用と測定",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "相似の考え方を利用して，直接測れない校舎の高さや川の幅を縮図によって求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "縮図の活用",
                                          "content": "目の高さ＋縮図から求めた実測値で全体の高さを算出する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "500分の1の縮図で 4cm の長さは，実際の距離は何mか？",
                                          "answer": "$4\\text{cm} \\times 500 = 2000\\text{cm} = 20\\text{m}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_3_6",
            "unitName": "第6章 円の性質",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "円周角の定理（中心角と円周角）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "1つの弧に対する円周角の大きさは，その弧に対する中心角の半分であることを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "円周角の定理",
                                          "content": "① 1つの弧に対する円周角は中心角の $\\frac{1}{2}$ である。<br>② 同じ弧に対する円周角はすべて等しい。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "中心角が 80°の弧に対する円周角の大きさを求めなさい。",
                                          "answer": "$80^\\circ \\div 2 = 40^\\circ$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "直径に対する円周角（90°）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "半円の弧（直径）に対する円周角が直角（90°）になる性質を理解し，活用する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "半円の円周角",
                                          "content": "直径に対する円周角は常に $90^\\circ$！直角三角形が出現する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "線分 $AB$ が円の直径であるとき，円周上の点 $C$ における $\\angle ACB$ の大きさを答えなさい。",
                                          "answer": "$90^\\circ$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "円周角の定理の証明",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "二等辺三角形の外角の性質を用いて，円周角の定理を論理的に証明する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "証明の基本",
                                          "content": "半径でできる二等辺三角形の底角と外角の関係に注目する。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円の中心を通る直径を補助線として引く理由を述べなさい。",
                                          "answer": "二等辺三角形を2つ作り，外角の性質を適用するため。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "円周角の定理の逆",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "4点が同一円周上にあるための条件（円周角の定理の逆）を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "4点が円周上にある条件",
                                          "content": "直線 $AB$ に対して同じ側に点 $P, Q$ があり，$\\angle APB = \\angle AQB$ ならば4点 $A, B, P, Q$ は1つの円周上にある。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円周角の定理の逆を使う場面はどのようなときか？",
                                          "answer": "4つの点が1つの円周上にあることを証明するとき。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "円と接線の性質",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "円の接線は接点を通る半径に垂直であること，および接線の長さが等しいことを理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "接線の性質",
                                          "content": "円の外部の1点から引いた2本の接線の長さは等しい。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円 $O$ の接線 $l$ と接点 $T$ を通る半径 $OT$ のなす角を答えなさい。",
                                          "answer": "$90^\\circ$（垂直）",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "円の性質の活用演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "円周角・中心角・相似・三平方の定理などを組み合わせた総合問題を解く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "円の性質の総合力",
                                          "content": "円を見たら「中心角と円周角」「直径の90°」「相似な三角形」を即座に連想しよう。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円に内接する四角形の対角の和はどうなるか？",
                                          "answer": "対角の和は $180^\\circ$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_3_7",
            "unitName": "第7章 三平方の定理",
            "totalHours": 6,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "三平方の定理の意味と発見",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "直角三角形の3辺における $a^2 + b^2 = c^2$（三平方の定理）の関係を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "ピタゴラスの定理",
                                          "content": "直角三角形の斜辺を $c$，他の2辺を $a, b$ とすると，$a^2 + b^2 = c^2$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "直角をはさむ2辺が 3cm, 4cm の直角三角形の斜辺の長さを求めなさい。",
                                          "answer": "$c^2 = 3^2 + 4^2 = 9 + 16 = 25 \\implies c = 5\\text{cm}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "三平方の定理の証明と逆",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "正方形の面積関係を用いて定理を証明し，3辺の長さから直角三角形か判定できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "三平方の定理の逆",
                                          "content": "3辺の長さが $a^2 + b^2 = c^2$ を満たす三角形は，$c$ を斜辺とする直角三角形である。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "3辺の長さが 5, 12, 13 の三角形は直角三角形といえるか？",
                                          "answer": "$5^2 + 12^2 = 25 + 144 = 169 = 13^2$ なので直角三角形といえる。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "特別な直角三角形の3辺の比",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "45°-45°-90° ($1:1:\\sqrt{2}$) と 30°-60°-90° ($1:2:\\sqrt{3}$) の比を理解・活用する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "重要三角比",
                                          "content": "・直角二等辺三角形: $1 : 1 : \\sqrt{2}$<br>・正三角形の半分: $1 : \\sqrt{3} : 2$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "1辺が 6cm の正三角形の高さを求めなさい。",
                                          "answer": "$6 \\times \\frac{\\sqrt{3}}{2} = 3\\sqrt{3}\\text{cm}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 4,
                        "title": "平面図形への利用（対角線・高さ・面積）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "長方形の対角線や二等辺三角形の高さ・面積を三平方の定理を用いて求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "平面図形の応用",
                                          "content": "直角三角形を見つけて，未知の線分を方程式（三平方）で解く。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "縦 4cm，横 6cm の長方形の対角線の長さを求めなさい。",
                                          "answer": "$\\sqrt{4^2 + 6^2} = \\sqrt{16 + 36} = \\sqrt{52} = 2\\sqrt{13}\\text{cm}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 5,
                        "title": "空間図形への利用（直方体の対角線・錐体の体積）",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "直方体の対角線公式 $\\sqrt{a^2 + b^2 + c^2}$ および円錐の高さを三平方で求める。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "空間の対角線",
                                          "content": "直方体の対角線 $l = \\sqrt{a^2 + b^2 + c^2}$"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "縦 2cm，横 3cm，高さ 6cm の直方体の対角線の長さを求めなさい。",
                                          "answer": "$\\sqrt{2^2 + 3^2 + 6^2} = \\sqrt{4 + 9 + 36} = \\sqrt{49} = 7\\text{cm}$",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 6,
                        "title": "三平方の定理の総合問題演習",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "折り返し図形や最短距離（展開図上の直線）など入試頻出の応用問題を解く。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "立体の最短距離",
                                          "content": "立体の表面を通る最短距離は，展開図をかいて2点を直線で結ぶ！"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "円柱の側面を1周するひもの最短の長さを求めるにはどうするか？",
                                          "answer": "側面の展開図（長方形）をかいて対角線の長さを三平方で求める。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  }
            ]
      },
      {
            "id": "u_3_8",
            "unitName": "第8章 標本調査",
            "totalHours": 3,
            "bookRef": "",
            "pointRef": "",
            "officialRef": "https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F",
            "lessons": [
                  {
                        "hour": 1,
                        "title": "全数調査と標本調査",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "全数調査と標本調査の違い，母集団と標本の意味を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "標本調査",
                                          "content": "母集団全体を調べるのが困難なとき，一部を取り出して調べる調査。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "電球の寿命テストは全数調査と標本調査のどちらで行うべきか？理由も答えなさい。",
                                          "answer": "標本調査。全数調査すると全ての電球を使い切ってしまうから。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 2,
                        "title": "無作為抽出と標本の性質",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "かたよりのない無作為抽出（ランダム抽出）の重要性を理解する。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "無作為抽出",
                                          "content": "母集団のどの要素も等しい確率で選ばれるように取り出すこと。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "全校生徒の意識調査をするとき，図書室に来た生徒だけにアンケートをとるのは適切か？",
                                          "answer": "不適切。読書好きな生徒にかたよるため無作為抽出にならない。",
                                          "spaceHeight": 60
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
                                    }
                              }
                        ]
                  },
                  {
                        "hour": 3,
                        "title": "標本調査による母集団の推定",
                        "leftBlocks": [
                              {
                                    "type": "objective",
                                    "data": {
                                          "text": "比の計算を用いて，標本の比率から母集団の数量や不良品数を推定できる。"
                                    }
                              },
                              {
                                    "type": "point-box",
                                    "data": {
                                          "badge": "まとめ",
                                          "title": "母集団の推定公式",
                                          "content": "$\\text{標本の比率} \\approx \\text{母集団の比率}$ を利用して比例式を解く。"
                                    }
                              }
                        ],
                        "rightBlocks": [
                              {
                                    "type": "question",
                                    "data": {
                                          "qNum": "問 1",
                                          "text": "袋の中の白玉と黒玉から 50個無作為に抽出したら白玉が 20個あった。袋の中に全部で 1000個あるとき，白玉はおよそ何個と推定されるか？",
                                          "answer": "$20 : 50 = x : 1000 \\implies 50x = 20000 \\implies x = 400$ 個",
                                          "spaceHeight": 70
                                    }
                              },
                              {
                                    "type": "reflection",
                                    "data": {
                                          "title": "振り返り"
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

// ============================================================
// 単元の時数カスタマイズ（時数の追加・削除・永続化）
// ============================================================
const CUSTOM_LESSONS_STORAGE_KEY = 'math_portal_custom_lessons';

function getCustomLessonsData() {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_LESSONS_STORAGE_KEY) || '{}') || {};
  } catch (e) {
    return {};
  }
}

function saveCustomLessonsData(data) {
  try {
    localStorage.setItem(CUSTOM_LESSONS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('saveCustomLessonsData error:', e);
  }
}

function getUnitLessons(grade, unitId) {
  const gData = boardLessonDatabase[grade];
  if (!gData) return [];
  const unit = gData.units.find(u => u.id === unitId) || gData.units[0];
  if (!unit) return [];
  const key = `${grade}_${unit.id}`;
  const customData = getCustomLessonsData()[key] || { added: [], deleted: [] };
  const deletedHours = customData.deleted || [];
  
  // デフォルト時数から deleted を除外
  let list = (unit.lessons || []).filter(l => !deletedHours.includes(l.hour)).map(l => ({ ...l }));
  
  // 追加された時数
  (customData.added || []).forEach(al => {
    if (!deletedHours.includes(al.hour)) {
      list.push({ ...al });
    }
  });

  // hour 昇順でソート
  list.sort((a, b) => a.hour - b.hour);
  return list;
}

// データベースから単元情報を取得（カスタム時数を統合）
function getUnitInfo(grade, unitId) {
  const gData = boardLessonDatabase[grade];
  if (!gData) return null;
  const unit = gData.units.find(u => u.id === unitId) || gData.units[0];
  if (!unit) return null;
  const lessons = getUnitLessons(grade, unit.id);
  return {
    ...unit,
    totalHours: lessons.length,
    lessons: lessons
  };
}

// データベースから時数情報を取得
function getLessonInfo(grade, unitId, hour) {
  const unit = getUnitInfo(grade, unitId);
  if (!unit || !unit.lessons || unit.lessons.length === 0) return null;
  return unit.lessons.find(l => l.hour === Number(hour)) || unit.lessons[0];
}

// 時数を新しく追加
function addNewB4LessonHour() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit) return;
  const existingLessons = unit.lessons || [];
  const maxHour = existingLessons.length > 0 ? Math.max(...existingLessons.map(l => l.hour)) : 0;
  const nextHour = maxHour + 1;

  const titlePrompt = prompt(`【第${nextHour}時】の授業タイトルを入力してください（例: 章末問題演習、小テスト、発展課題など）:`, `第${nextHour}時 演習・まとめ`);
  if (titlePrompt === null) return; // キャンセル
  const finalTitle = titlePrompt.trim() || `第${nextHour}時 演習・まとめ`;

  const newLesson = {
    hour: nextHour,
    title: finalTitle,
    leftBlocks: [
      {
        type: 'objective',
        data: { text: `${unit.unitName}の学習を振り返り、問題演習に取り組むことができる。` }
      },
      {
        type: 'review',
        data: { title: '前時のポイント', content: '重要公式や計算方法を振り返ろう' }
      },
      {
        type: 'board-task',
        data: {
          qNum: '【本時の課題】',
          text: '本時の基本・応用問題に取り組みましょう。',
          thinkingSpaceHeight: 85,
          answer: '各自の解法を確認'
        }
      },
      {
        type: 'point-box',
        data: {
          badge: '本時のまとめ',
          title: '本時の要点',
          content: '間違えた問題は解き直しをして確認しよう。'
        }
      }
    ],
    rightBlocks: [
      {
        type: 'question',
        data: {
          qNum: '問題 1',
          text: '次の計算に取り組みましょう。',
          spaceHeight: 75,
          answer: ''
        }
      },
      {
        type: 'reflection',
        data: {
          commentPrompt: '今日の授業で学んだこと・疑問点:'
        }
      }
    ]
  };

  const key = `${currentB4Grade}_${currentB4UnitId}`;
  const allCustom = getCustomLessonsData();
  if (!allCustom[key]) allCustom[key] = { added: [], deleted: [] };
  allCustom[key].added.push(newLesson);
  // もし以前削除されていたhourなら削除リストから除去
  allCustom[key].deleted = (allCustom[key].deleted || []).filter(h => h !== nextHour);
  saveCustomLessonsData(allCustom);

  state.b4Dirty = false;
  currentB4Hour = nextHour;
  updateB4HourDropdown();
  applyB4LessonSelection();
  showToast(`<i class="fa-solid fa-plus-circle text-success"></i> 第${nextHour}時「${finalTitle}」を追加しました！`);
}

// 現在選択中の時数を削除
function deleteCurrentB4LessonHour() {
  const unit = getUnitInfo(currentB4Grade, currentB4UnitId);
  if (!unit || !unit.lessons) return;
  if (unit.lessons.length <= 1) {
    alert('これ以上時数を削除することはできません（最低1時間は必要です）。');
    return;
  }

  const currentLesson = unit.lessons.find(l => l.hour === currentB4Hour) || unit.lessons[0];
  if (!confirm(`第${currentLesson.hour}時「${currentLesson.title}」をこの単元から削除しますか？\n※削除した時数のプリントは表示されなくなります。`)) {
    return;
  }

  const key = `${currentB4Grade}_${currentB4UnitId}`;
  const allCustom = getCustomLessonsData();
  if (!allCustom[key]) allCustom[key] = { added: [], deleted: [] };
  if (!allCustom[key].deleted) allCustom[key].deleted = [];
  allCustom[key].deleted.push(currentLesson.hour);
  // addedにあったらそこからも除去
  allCustom[key].added = (allCustom[key].added || []).filter(l => l.hour !== currentLesson.hour);
  saveCustomLessonsData(allCustom);

  // テンプレート上書きがあれば削除
  const tplKey = lessonTemplateKey(currentB4Grade, currentB4UnitId, currentLesson.hour);
  const tpls = getLessonTemplates();
  if (tpls[tplKey]) {
    delete tpls[tplKey];
    localStorage.setItem(LESSON_TEMPLATE_KEY, JSON.stringify(tpls));
  }

  state.b4Dirty = false;
  // 残った時数から新しい時数を選択
  const remaining = getUnitLessons(currentB4Grade, currentB4UnitId);
  currentB4Hour = remaining.length > 0 ? remaining[0].hour : 1;
  updateB4HourDropdown();
  applyB4LessonSelection();
  showToast(`<i class="fa-solid fa-trash-can text-danger"></i> 第${currentLesson.hour}時を削除しました`);
}

// ============================================================
// 授業プリント（B4見開き）: テンプレート管理・描画・編集UX v3
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

function formatShortDate(str) {
  if (!str) return '';
  // "2026/10/3 22:45:10" -> "10/3 22:45"
  const m = str.match(/(\d{1,2}\/\d{1,2})\s*(\d{1,2}:\d{2})/);
  if (m) return m[1] + ' ' + m[2];
  return str.split(' ')[0] || '';
}

function updateTemplateStatusUI() {
  const custom = getCustomLessonTemplate(currentB4Grade, currentB4UnitId, currentB4Hour);
  const chips = document.querySelectorAll('.js-template-status');
  chips.forEach(chip => {
    chip.classList.toggle('is-custom', !!custom);
    chip.classList.toggle('is-dirty', !!state.b4Dirty);
    let html;
    if (state.b4Dirty) {
      html = '<i class="fa-solid fa-pen text-warning"></i> 未保存';
    } else if (custom) {
      const timeStr = formatShortDate(custom.savedAt);
      html = '<i class="fa-solid fa-check text-success"></i> 編集: ' + (timeStr || '保存済');
    } else {
      html = '<i class="fa-regular fa-file-lines"></i> 初期状態';
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
  if (typeof cleanMathText === 'function') return cleanMathText(str);
  return String(str || '').replace(/\$([^\$]+)\$/g, '$1');
}

// 数式文字列を保護し、プレーンテキスト化された式を美しいKaTeX数式（$ ... $）に自動修復する
function sanitizeMathString(str) {
  if (typeof str !== 'string') return str;
  let res = str;

  // \displaystyle を除去（インラインで美しく描画するため）
  res = res.replace(/\\displaystyle\s*/g, '');

  // 1. 部分的にTeXが混ざってチグハグになった多項式・単項式の除法/乗法を修復
  // 例: (4) (6x² - 4x) ÷ $\frac{2}{3}x$ や (6x² - 4x) ÷ \frac{2}{3}x
  res = res.replace(/\((?:6x[²2]\s*[-−]\s*4x)\)\s*[÷\/]\s*\$\\frac\{2\}\{3\}x\$/g, '$(6x^2 - 4x) \\div \\frac{2}{3}x$');
  res = res.replace(/\((?:6x[²2]\s*[-−]\s*4x)\)\s*[÷\/]\s*\\frac\{2\}\{3\}x/g, '$(6x^2 - 4x) \\div \\frac{2}{3}x$');

  // 2. 問題2 (3) (6x² - 4x) ÷ 2x
  res = res.replace(/\((?:6x[²2]\s*[-−]\s*4x)\)\s*[÷\/]\s*2x/g, '$(6x^2 - 4x) \\div 2x$');

  // 3. 問題1 (1) (-3a + b) × 4a
  res = res.replace(/\(-3a\s*\+\s*b\)\s*[×\*]\s*4a/g, '$(-3a + b) \\times 4a$');

  // 4. 問題1 (2) -3a × (4a - 5b)
  res = res.replace(/-3a\s*[×\*]\s*\(4a\s*-\s*5b\)/g, '$-3a \\times (4a - 5b)$');

  // 5. 平方根 a× b / a× b＝a×b
  res = res.replace(/a\s*×\s*b\s*[＝=]\s*a\s*×\s*b/g, '$\\sqrt{a} \\times \\sqrt{b} = \\sqrt{ab}$');
  res = res.replace(/a\s*×\s*b/g, '$\\sqrt{a} \\times \\sqrt{b}$');

  // 6. 関数 y＝ax² / y＝3x² / y＝2x² / y＝x²
  res = res.replace(/y\s*[＝=]\s*ax[²2]/g, '$y = ax^2$');
  res = res.replace(/y\s*[＝=]\s*[３3]x[²2]/g, '$y = 3x^2$');
  res = res.replace(/y\s*[＝=]\s*[２2]x[²2]/g, '$y = 2x^2$');
  res = res.replace(/y\s*[＝=]\s*x[²2]/g, '$y = x^2$');

  // 7. 単独の x² (すでに $ の中にない場合)
  res = res.replace(/(^|[^\$a-zA-Z0-9])x[²2]([^\$a-zA-Z0-9]|$)/g, '$1$x^2$$2');

  // 8. 既存の $...$ 内の Unicode 記号を正規の TeX コマンドに正規化
  res = res.replace(/\$([^\$]+)\$/g, (match, formula) => {
    let f = formula
      .replace(/\\displaystyle\s*/g, '')
      .replace(/×/g, '\\times ')
      .replace(/÷/g, '\\div ')
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/＝/g, '=')
      .replace(/\s+/g, ' ')
      .trim();
    return '$' + f + '$';
  });

  return res;
}

// 保存データやブロック内のTeX表現を自然な式に一括クレンジング
function sanitizeFormulas(blocks) {
  if (!blocks) return [];
  blocks.forEach(b => {
    if (b && b.data) {
      for (const k of Object.keys(b.data)) {
        if (typeof b.data[k] === 'string') {
          b.data[k] = sanitizeMathString(b.data[k]);
        }
      }
    }
  });
  return blocks;
}

// ユーザーのlocalStorage内の保存済みテンプレートを自動マイグレーション
function migrateStoredLessonTemplates() {
  try {
    const raw = localStorage.getItem(LESSON_TEMPLATE_KEY);
    if (!raw) return;
    const all = JSON.parse(raw);
    let changed = false;
    for (const key of Object.keys(all)) {
      const tmpl = all[key];
      if (tmpl) {
        if (tmpl.title && typeof tmpl.title === 'string') {
          const cleanTitle = sanitizeMathString(tmpl.title);
          if (cleanTitle !== tmpl.title) {
            tmpl.title = cleanTitle;
            changed = true;
          }
        }
        if (tmpl.leftBlocks && Array.isArray(tmpl.leftBlocks)) {
          sanitizeFormulas(tmpl.leftBlocks);
          changed = true;
        }
        if (tmpl.rightBlocks && Array.isArray(tmpl.rightBlocks)) {
          sanitizeFormulas(tmpl.rightBlocks);
          changed = true;
        }
      }
    }
    if (changed) {
      localStorage.setItem(LESSON_TEMPLATE_KEY, JSON.stringify(all));
    }
  } catch (e) {
    console.warn('Template migration error:', e);
  }
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

  const studentGrade = document.getElementById('paperStudentGrade');
  if (studentGrade) {
    studentGrade.textContent = currentB4Grade;
  } else {
    const classCell = document.querySelector('.sheet-student-info .class-cell');
    if (classCell && classCell.firstChild && classCell.firstChild.nodeType === 3) {
      classCell.firstChild.textContent = currentB4Grade + '年 ';
    }
  }

  const normalizeBlock = b => {
    b.id = generateBlockId();
    if (b.type === 'graph-block' && !b.data.svgHtml) {
      b.data.svgHtml = generateLinearSvg(2, 1, true, true, 190, 180);
    }
    if (b.type === 'point-box') {
      if (!b.data.badge || b.data.badge === '板書まとめ') {
        b.data.badge = '本時のまとめ';
      }
      if (b.data.title === '本時のまとめ' || b.data.title === '板書まとめ') {
        b.data.title = '';
      }
    }
    return b;
  };
  state.blocksLeft = sanitizeFormulas(JSON.parse(JSON.stringify(source.leftBlocks || []))).map(normalizeBlock);
  state.blocksRight = sanitizeFormulas(JSON.parse(JSON.stringify(source.rightBlocks || []))).map(normalizeBlock);
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
  updateB4SheetLimitUI();
  setTimeout(updateB4SheetLimitUI, 120);
}

// B4用紙の収まり状態の判定・UI更新（固定935px用紙内・印刷プレビュー実寸245mm完全準拠）
function updateB4SheetLimitUI() {
  const sheet = document.getElementById('printableSheet');
  const badge = document.getElementById('b4FitBadge');
  if (!sheet) return;

  const leftCol = document.getElementById('blocksLeftCol');
  const rightCol = document.getElementById('blocksRightCol');
  const container = document.querySelector('.b4-columns-container');
  
  const availableHeight = container ? container.clientHeight : 790;
  const maxContentHeight = Math.max(
    leftCol ? leftCol.scrollHeight : 0,
    rightCol ? rightCol.scrollHeight : 0
  );
  const diff = maxContentHeight - availableHeight;

  if (diff > 8) {
    sheet.classList.add('is-overflowing');
    if (badge) {
      badge.className = 'b4-fit-badge fit-over no-print';
      badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> B4はみ出し中 (+${Math.round(diff)}px)`;
      badge.title = `B4用紙1枚の枠を約 ${Math.round(diff)}px 超過しています。枠の高さを縮めてください。`;
    }
  } else {
    sheet.classList.remove('is-overflowing');
    if (badge) {
      badge.className = 'b4-fit-badge fit-ok no-print';
      badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> B4用紙内 (1枚)`;
      badge.title = 'B4横用紙1枚の範囲に収まっています。';
    }
  }
}
window.updateB4SheetLimitUI = updateB4SheetLimitUI;

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
        <div class="board-task-box" ${d.customHeight ? `style="min-height: ${d.customHeight}px;"` : ''}>
          <div class="board-task-header">
            <span class="board-task-badge"><i class="fa-solid fa-chalkboard-user"></i><span ${editB4('qNum', '見出し', 'text')}>${escapeHtmlB4(d.qNum)}</span></span>
            <div class="board-task-text" ${editB4('text', '課題・問題文を入力')}>${fmtB4(d.text)}</div>
          </div>
          ${d.guide ? `
          <div class="board-task-guide">
            <i class="fa-solid fa-compass" title="見通し・ヒント"></i>
            <div ${editB4('guide', '見通し・ヒントを入力')}>${fmtB4(d.guide)}</div>
            <button type="button" class="btn-guide-remove no-print" onclick="removeBoardTaskGuide('${colSide}', ${index})" title="見通し・ヒント枠を削除"><i class="fa-solid fa-xmark"></i></button>
          </div>` : `
          <div class="board-task-no-guide no-print">
            <button type="button" class="btn-guide-add" onclick="addBoardTaskGuide('${colSide}', ${index})"><i class="fa-solid fa-plus"></i> 見通しヒント枠を追加</button>
          </div>`}
          ${d.hideCanvas ? `
          <div class="board-task-no-canvas no-print">
            <button type="button" class="btn-canvas-add" onclick="toggleBoardTaskCanvas('${colSide}', ${index}, false)"><i class="fa-solid fa-plus"></i> 自分の考え・途中式枠を追加</button>
          </div>` : `
          <div class="board-task-canvas" style="min-height: ${d.thinkingSpaceHeight || 80}px;">
            <button type="button" class="btn-canvas-remove no-print" onclick="toggleBoardTaskCanvas('${colSide}', ${index}, true)" title="自分の考え・途中式枠を削除"><i class="fa-solid fa-xmark"></i></button>
            <div class="canvas-grid-label" ${editB4('canvasLabel', 'ラベルを入力 (消去可能)', 'text')}>${escapeHtmlB4(d.canvasLabel !== undefined ? d.canvasLabel : '自分の考え・途中式')}</div>
            <div class="answer-text answer-block"><span class="answer-tag">解答例</span><div ${editB4('answer', '解答例を入力')}>${fmtB4(d.answer)}</div></div>
          </div>`}
        </div>`;
    } else if (block.type === 'point-box') {
      const bBadge = (d.badge === '板書まとめ' || !d.badge) ? '本時のまとめ' : d.badge;
      const bTitle = (d.title && d.title !== bBadge && d.title !== '本時のまとめ' && d.title !== '板書まとめ') ? d.title : '';
      html = `
        <div class="point-summary-box">
          <div class="point-summary-header">
            <span class="point-badge"><i class="fa-solid fa-bookmark"></i> ${escapeHtmlB4(bBadge)}</span>
            <strong ${editB4('title', '見出し (省略可)', 'text')}>${escapeHtmlB4(bTitle)}</strong>
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
      // ユーザー要望: タイトルの右側から始まるのではなく、下の行から配置 & 全要素を編集・消去可能に
      html = `
        <div class="reflection-box">
          <div class="reflection-title-row">
            <i class="fa-solid fa-star text-warning"></i>
            <strong ${editB4('title', '見出し', 'text')}>${escapeHtmlB4(d.title || '本時の自己評価 & 振り返り')}</strong>
          </div>
          <div class="reflection-scale-row">
            <span class="scale-label" ${editB4('scaleLabel', '項目名', 'text')}>${escapeHtmlB4(d.scaleLabel || '理解度:')}</span>
            <div class="scale-options" ${editB4('scaleOptions', '評価基準を入力', 'html')}>
              ${d.scaleOptions ? fmtB4(d.scaleOptions) : '<span>[ A: よくわかった ]</span> <span>[ B: だいたい ]</span> <span>[ C: もう少し ]</span>'}
            </div>
          </div>
          ${d.hideComment ? `
          <div class="reflection-no-comment no-print">
            <button type="button" class="btn-reflection-comment-add" onclick="toggleReflectionComment('${colSide}', ${index}, false)"><i class="fa-solid fa-plus"></i> コメント記述枠を追加</button>
          </div>` : `
          <div class="reflection-comment-line" style="${d.customHeight ? `min-height: ${d.customHeight}px;` : 'min-height: 38px;'}">
            <button type="button" class="btn-comment-remove no-print" onclick="toggleReflectionComment('${colSide}', ${index}, true)" title="コメント記述枠を削除"><i class="fa-solid fa-xmark"></i></button>
            <span class="comment-label" ${editB4('commentLabel', '記述欄の案内を入力', 'text')}>${escapeHtmlB4(d.commentLabel !== undefined ? d.commentLabel : '今日の授業で学んだこと・疑問点:')}</span>
          </div>`}
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

// KaTeX数式を含むHTMLから自然な式・TeXコードを取り出す
function extractHtmlWithTeX(element) {
  if (!element) return '';
  const clone = element.cloneNode(true);
  const katexEls = clone.querySelectorAll('.katex');
  katexEls.forEach(k => {
    const ann = k.querySelector('annotation[encoding="application/x-tex"]') || k.querySelector('annotation');
    const tex = ann ? ann.textContent.trim() : (k.getAttribute('data-tex') || '');
    const cleanFormula = sanitizeMathString('$' + tex + '$');
    const textNode = document.createTextNode(cleanFormula);
    k.replaceWith(textNode);
  });
  return sanitizeMathString(clone.innerHTML.replace(/(<br\s*\/?>\s*)+$/i, '').trim());
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
  if (t.mode === 'text') {
    return sanitizeMathString(t.editable.innerText.replace(/\n+$/, '').trim());
  }
  return extractHtmlWithTeX(t.editable);
}

function initB4EditingHandlers() {
  if (b4EditingInitialized) return;
  const sheet = document.getElementById('printableSheet');
  if (!sheet) return;
  b4EditingInitialized = true;

  sheet.addEventListener('focusin', (e) => {
    const t = getEditTarget(e.target);
    if (!t) return;
    lastFocusedB4Editable = t.editable;
    b4EditSnapshotTaken = false;
    t.editable.classList.add('is-editing');
    // 内部に KaTeX 要素がある場合、DOMの乱れを防ぎ自然に編集できるよう raw TeX に展開
    if (t.editable.querySelector('.katex')) {
      const rawHtml = extractHtmlWithTeX(t.editable);
      t.editable.innerHTML = rawHtml;
    }
    trackB4Selection();
  });

  sheet.addEventListener('mouseup', () => {
    trackB4Selection();
  });

  sheet.addEventListener('keyup', () => {
    trackB4Selection();
  });

  sheet.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'paperTitle') {
      e.target.setAttribute('data-raw', e.target.innerText.trim());
      setB4Dirty(true);
      return;
    }
    const t = getEditTarget(e.target);
    if (!t) return;
    lastFocusedB4Editable = t.editable;
    trackB4Selection();
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
    const val = readEditableValue(t);
    if (b4EditSnapshotTaken) {
      updateColBlockData(t.col, t.index, t.field, val);
    }
    t.editable.innerHTML = val;
    if (typeof applyKaTeXIfAvailable === 'function') {
      setTimeout(() => applyKaTeXIfAvailable(t.editable), 10);
    }
  });

  sheet.addEventListener('paste', (e) => {
    const t = getEditTarget(e.target);
    if (!t) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
    trackB4Selection();
  });

  sheet.addEventListener('keydown', (e) => {
    const t = getEditTarget(e.target);
    if (t && t.mode === 'text' && e.key === 'Enter') {
      e.preventDefault();
      t.editable.blur();
    }
  });

  const paperTitleEl = document.getElementById('paperTitle');
  if (paperTitleEl) {
    paperTitleEl.addEventListener('focus', () => {
      const raw = paperTitleEl.getAttribute('data-raw');
      if (raw) paperTitleEl.textContent = raw;
    });
  }

  // 数式（.katex）クリックでビジュアル数式エディタを起動
  sheet.addEventListener('dblclick', (e) => {
    const katexEl = e.target.closest('.katex');
    if (katexEl) {
      e.preventDefault();
      e.stopPropagation();
      openMathFormulaEditorModal('', katexEl);
    }
  });

  // キーボードショートカット: Ctrl+S = テンプレート保存 / Ctrl+Z = 元に戻す / Ctrl+M = 数式エディタ
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
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
      e.preventDefault();
      openMathFormulaEditorModal();
    }
  });

  window.addEventListener('beforeunload', (e) => {
    if (state.b4Dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

// ---- 中学数学 ビジュアル数式エディタ & パレット機能 ----
let mathEditorEl = null;
let currentEditingKatex = null;
let lastFocusedB4Editable = null;
let lastB4CaretRange = null;

// 選択状態・カーソル位置を記憶
function trackB4Selection() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  const common = range.commonAncestorContainer;
  const editable = common.nodeType === 1 ? common.closest('[contenteditable="true"]') : common.parentElement?.closest('[contenteditable="true"]');
  if (editable) {
    lastFocusedB4Editable = editable;
    lastB4CaretRange = range.cloneRange();
  }
}
window.trackB4Selection = trackB4Selection;

// モーダルを開く
function openMathFormulaEditorModal(initialTex = '', targetKatex = null) {
  const modal = document.getElementById('mathFormulaEditorModal');
  if (!modal) return;

  currentEditingKatex = targetKatex || null;
  let defaultTex = initialTex;

  // targetKatex がある場合（ダブルクリック時など）
  if (targetKatex) {
    const ann = targetKatex.querySelector('annotation[encoding="application/x-tex"]') || targetKatex.querySelector('annotation');
    defaultTex = ann ? ann.textContent.trim() : (targetKatex.getAttribute('data-tex') || '');
  } else if (!defaultTex && lastFocusedB4Editable) {
    // 選択テキストがあれば取得
    const sel = window.getSelection();
    if (sel && sel.toString().trim()) {
      defaultTex = sel.toString().trim();
    }
  }

  const input = document.getElementById('mathFormulaTexInput');
  if (input) {
    input.value = defaultTex || '';
    if (!input.dataset.listenerAttached) {
      input.addEventListener('input', renderMathFormulaPreview);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          applyMathFormulaToActivePrint();
        } else if (e.key === 'Escape') {
          closeMathFormulaEditorModal();
        }
      });
      input.dataset.listenerAttached = 'true';
    }
  }

  // クイック入力欄をクリア
  const qNum = document.getElementById('quickFractionNum');
  const qDen = document.getElementById('quickFractionDen');
  const qSqrt = document.getElementById('quickSqrtVal');
  const qBase = document.getElementById('quickPowerBase');
  const qExp = document.getElementById('quickPowerExp');
  if (qNum) qNum.value = '';
  if (qDen) qDen.value = '';
  if (qSqrt) qSqrt.value = '';
  if (qBase) qBase.value = '';
  if (qExp) qExp.value = '';

  modal.classList.remove('hidden');
  switchMathTab('common');
  renderMathFormulaPreview();
  renderPaletteButtonKatex();

  setTimeout(() => {
    if (input) input.focus();
  }, 100);
}
window.openMathFormulaEditorModal = openMathFormulaEditorModal;

// モーダルを閉じる
function closeMathFormulaEditorModal() {
  const modal = document.getElementById('mathFormulaEditorModal');
  if (modal) modal.classList.add('hidden');
  currentEditingKatex = null;
}
window.closeMathFormulaEditorModal = closeMathFormulaEditorModal;

// タブ切り替え
function switchMathTab(tabId) {
  const tabs = document.querySelectorAll('.math-tab-btn');
  tabs.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mathtab') === tabId);
  });
  const panes = document.querySelectorAll('.math-pane');
  panes.forEach(p => {
    p.classList.toggle('active', p.id === `mathPane-${tabId}`);
  });
  renderPaletteButtonKatex();
}
window.switchMathTab = switchMathTab;

// パレット内の各ボタンの数式を描画
function renderPaletteButtonKatex() {
  if (typeof katex === 'undefined') return;
  const elements = document.querySelectorAll('#mathFormulaEditorModal [data-tex]');
  elements.forEach(el => {
    if (el.getAttribute('data-rendered')) return;
    const tex = el.getAttribute('data-tex');
    if (!tex) return;
    try {
      katex.render(tex, el, { throwOnError: false });
      el.setAttribute('data-rendered', 'true');
    } catch (e) {
      // フォールバック
    }
  });
}
window.renderPaletteButtonKatex = renderPaletteButtonKatex;

// リアルタイムプレビュー描画
function renderMathFormulaPreview() {
  const input = document.getElementById('mathFormulaTexInput');
  const stage = document.getElementById('mathFormulaStage');
  if (!stage) return;
  const tex = (input ? input.value : '').trim();

  if (!tex) {
    stage.innerHTML = '<span class="math-preview-placeholder">下のボタンを押すか、数式を入力するとここに表示されます</span>';
    return;
  }

  if (typeof katex !== 'undefined') {
    try {
      katex.render(tex, stage, {
        throwOnError: false,
        displayMode: true
      });
    } catch (e) {
      stage.textContent = tex;
    }
  } else {
    stage.textContent = tex;
  }
}
window.renderMathFormulaPreview = renderMathFormulaPreview;

// スニペットをカーソル位置に挿入
function insertMathFormulaSnippet(snippet) {
  const input = document.getElementById('mathFormulaTexInput');
  if (!input) return;

  const start = input.selectionStart || 0;
  const end = input.selectionEnd || 0;
  const oldVal = input.value;
  const newVal = oldVal.substring(0, start) + snippet + oldVal.substring(end);
  input.value = newVal;

  // カーソル移動
  input.focus();
  const newPos = start + snippet.length;
  input.setSelectionRange(newPos, newPos);

  renderMathFormulaPreview();
}
window.insertMathFormulaSnippet = insertMathFormulaSnippet;

// かんたん分数生成
function insertQuickFraction() {
  const num = (document.getElementById('quickFractionNum')?.value || 'a').trim();
  const den = (document.getElementById('quickFractionDen')?.value || 'b').trim();
  insertMathFormulaSnippet(`\\frac{${num}}{${den}}`);
}
window.insertQuickFraction = insertQuickFraction;

// かんたん平方根生成
function insertQuickSqrt() {
  const val = (document.getElementById('quickSqrtVal')?.value || 'x').trim();
  insertMathFormulaSnippet(`\\sqrt{${val}}`);
}
window.insertQuickSqrt = insertQuickSqrt;

// かんたん累乗生成
function insertQuickPower() {
  const base = (document.getElementById('quickPowerBase')?.value || 'x').trim();
  const exp = (document.getElementById('quickPowerExp')?.value || '2').trim();
  insertMathFormulaSnippet(`${base}^{${exp}}`);
}
window.insertQuickPower = insertQuickPower;

// クリア・1文字削除
function clearMathFormulaEditor() {
  const input = document.getElementById('mathFormulaTexInput');
  if (input) {
    input.value = '';
    renderMathFormulaPreview();
    input.focus();
  }
}
window.clearMathFormulaEditor = clearMathFormulaEditor;

function backspaceMathFormulaEditor() {
  const input = document.getElementById('mathFormulaTexInput');
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  if (start !== end) {
    input.value = input.value.substring(0, start) + input.value.substring(end);
    input.setSelectionRange(start, start);
  } else if (start > 0) {
    input.value = input.value.substring(0, start - 1) + input.value.substring(start);
    input.setSelectionRange(start - 1, start - 1);
  }
  renderMathFormulaPreview();
  input.focus();
}
window.backspaceMathFormulaEditor = backspaceMathFormulaEditor;

// プリント上の選択要素に数式を挿入・反映
function applyMathFormulaToActivePrint() {
  const input = document.getElementById('mathFormulaTexInput');
  const tex = (input ? input.value : '').trim();
  if (!tex) {
    alert('数式が入力されていません。');
    return;
  }

  // 1. 既存のKaTeX要素を更新する場合
  if (currentEditingKatex) {
    const editable = currentEditingKatex.closest('[contenteditable="true"]');
    const t = getEditTarget(editable);
    const textNode = document.createTextNode(`$${tex}$`);
    currentEditingKatex.replaceWith(textNode);
    closeMathFormulaEditorModal();

    if (editable && t) {
      pushB4History();
      updateColBlockData(t.col, t.index, t.field, extractHtmlWithTeX(editable));
      if (typeof applyKaTeXIfAvailable === 'function') {
        applyKaTeXIfAvailable(editable);
      }
    }
    if (typeof showToast === 'function') showToast('<i class="fa-solid fa-check text-success"></i> 数式を更新しました', 'success');
    return;
  }

  // 2. 直前にフォーカスしていた編集領域がある場合
  let targetEditable = lastFocusedB4Editable;
  if (!targetEditable || !document.body.contains(targetEditable)) {
    // ターゲットがなければ、右側または左側の最初の編集ブロックを探す
    const firstBlockText = document.querySelector('#printableSheet [contenteditable="true"]');
    targetEditable = firstBlockText;
  }

  if (targetEditable) {
    targetEditable.focus();
    const formulaStr = `$${tex}$`;

    // セレクション位置に挿入
    if (lastB4CaretRange && targetEditable.contains(lastB4CaretRange.commonAncestorContainer)) {
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(lastB4CaretRange);
        document.execCommand('insertText', false, formulaStr);
      } catch (e) {
        document.execCommand('insertText', false, formulaStr);
      }
    } else {
      // 末尾に追加
      if (targetEditable.innerHTML.trim() !== '') {
        targetEditable.innerHTML += ' ' + formulaStr;
      } else {
        targetEditable.innerHTML = formulaStr;
      }
    }

    const t = getEditTarget(targetEditable);
    if (t) {
      pushB4History();
      updateColBlockData(t.col, t.index, t.field, extractHtmlWithTeX(targetEditable));
    }
    if (typeof applyKaTeXIfAvailable === 'function') {
      setTimeout(() => applyKaTeXIfAvailable(targetEditable), 10);
    }
    closeMathFormulaEditorModal();
    if (typeof showToast === 'function') showToast('<i class="fa-solid fa-square-root-variable text-purple"></i> 数式を挿入しました', 'success');
  } else {
    // クリップボードにコピー
    copyMathFormulaToClipboard();
    closeMathFormulaEditorModal();
    alert('数式をコピーしました。挿入したい枠をクリックして Ctrl+V で貼り付けてください。');
  }
}
window.applyMathFormulaToActivePrint = applyMathFormulaToActivePrint;

// クリップボードにコピー
function copyMathFormulaToClipboard() {
  const input = document.getElementById('mathFormulaTexInput');
  const tex = (input ? input.value : '').trim();
  if (!tex) return;
  const str = `$${tex}$`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(str).then(() => {
      if (typeof showToast === 'function') showToast('<i class="fa-solid fa-copy text-info"></i> 数式をクリップボードにコピーしました', 'info');
    }).catch(() => {
      prompt('数式コード:', str);
    });
  } else {
    prompt('数式コード:', str);
  }
}
window.copyMathFormulaToClipboard = copyMathFormulaToClipboard;

// 互換性ラッパー
function openMathEditorPopover(katexEl) {
  openMathFormulaEditorModal('', katexEl);
}
window.openMathEditorPopover = openMathEditorPopover;

function closeMathEditorPopover() {
  closeMathFormulaEditorModal();
}
window.closeMathEditorPopover = closeMathEditorPopover;

function applyMathEditorPopover() {
  applyMathFormulaToActivePrint();
}
window.applyMathEditorPopover = applyMathEditorPopover;

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
  const timeStr = custom ? formatShortDate(custom.savedAt) : '';
  return (custom ? '★ ' : '') + '第' + lesson.hour + '時　' + stripTeXForOption(title) + (timeStr ? ' (' + timeStr + ')' : '');
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


// ロード時に保存済みテンプレートのTeXコードを自動マイグレーション
if (typeof window !== 'undefined') {
  try {
    migrateStoredLessonTemplates();
  } catch (e) {
    console.warn(e);
  }
}


// ---- 見通し・ヒント枠の削除 / 追加操作 ----
function removeBoardTaskGuide(colSide, index) {
  pushB4History();
  const arr = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (arr && arr[index] && arr[index].data) {
    arr[index].data.guide = '';
    syncB4Blocks();
    setB4Dirty(true);
    renderWorksheetB4();
    showToast('<i class="fa-solid fa-trash-can text-danger"></i> 見通しヒント欄を削除しました');
  }
}

function addBoardTaskGuide(colSide, index) {
  pushB4History();
  const arr = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (arr && arr[index] && arr[index].data) {
    arr[index].data.guide = '教科書の例題を参考にしながら考えてみよう。';
    syncB4Blocks();
    setB4Dirty(true);
    renderWorksheetB4();
    showToast('<i class="fa-solid fa-plus text-primary"></i> 見通しヒント欄を追加しました');
  }
}

// 自分の考え・途中式枠の削除 / 追加操作
function toggleBoardTaskCanvas(colSide, index, hide) {
  pushB4History();
  const arr = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (arr && arr[index] && arr[index].data) {
    arr[index].data.hideCanvas = !!hide;
    syncB4Blocks();
    setB4Dirty(true);
    renderWorksheetB4();
    showToast(hide ? '<i class="fa-solid fa-trash-can text-danger"></i> 自分の考え・途中式枠を削除しました' : '<i class="fa-solid fa-plus text-primary"></i> 自分の考え・途中式枠を追加しました');
  }
}
window.toggleBoardTaskCanvas = toggleBoardTaskCanvas;

// 振り返りコメント枠の削除 / 追加操作
function toggleReflectionComment(colSide, index, hide) {
  pushB4History();
  const arr = colSide === 'left' ? state.blocksLeft : state.blocksRight;
  if (arr && arr[index] && arr[index].data) {
    arr[index].data.hideComment = !!hide;
    syncB4Blocks();
    setB4Dirty(true);
    renderWorksheetB4();
    showToast(hide ? '<i class="fa-solid fa-trash-can text-danger"></i> コメント記述枠を削除しました' : '<i class="fa-solid fa-plus text-primary"></i> コメント記述枠を追加しました');
  }
}
window.toggleReflectionComment = toggleReflectionComment;
