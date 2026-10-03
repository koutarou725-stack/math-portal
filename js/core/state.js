// ==========================================
// // 教材・書籍 OneDrive クラウド共有リンク設定（オンライン完全対応）
// 先生のOneDrive共有URLにより、Webブラウザ上からどこでも直接PDFを参照可能

const CLOUD_DOC_LINKS = {
  // 学研『中1〜中3 数学をひとつひとつわかりやすく。』
  pointBooks: {
    '1': 'https://1drv.ms/b/c/7afb9670452d4dba/IQC4gcHZTgFoRoBOL7FbI00uAYAo4hpgqWuZtjHhb4r7J_0?e=Ak1hV9',
    '2': 'https://1drv.ms/b/c/7afb9670452d4dba/IQCGShIQnCM6Ro_fEPW9OmVhAUe0_xiCbUTJC7fY-2_AnUI?e=XJU1aJ',
    '3': 'https://1drv.ms/b/c/7afb9670452d4dba/IQCblJE6bR7eTbSxIJztZhC7AT3DtdJt5CoGfk2ny97l7m0?e=OZ0znx'
  },
  // 明治図書『板書＆展開例でよくわかる 数学的活動でつくる365日の全授業 中学校数学』
  boardBooks: {
    '3': 'https://1drv.ms/b/c/7afb9670452d4dba/IQBsot4tPrvfR6d1CrKod23RAbnHrYbd4ENCW_ch6H37kTo?e=soOvGY'
  },
  // 数学学習プリント (全学年・全単元 OneDrive共有フォルダ)
  officialPrintsFolder: 'https://1drv.ms/f/c/7afb9670452d4dba/IgArL_GI1AWCQYg6h-hpgVgwAQPwpkTBvGcOttXocqZee9s?e=sZb37F'
};


// クラス名から学年（1, 2, 3）を正確に抽出する共通ヘルパー
function extractGradeFromClassName(cls) {
  if (!cls) return '2';
  const trimmed = String(cls).trim();
  const m = trimmed.match(/^([1-3])/);
  if (m) return m[1];
  const m2 = trimmed.match(/([1-3])年/);
  if (m2) return m2[1];
  if (trimmed.includes('3')) return '3';
  if (trimmed.includes('2')) return '2';
  if (trimmed.includes('1')) return '1';
  return '2';
}

/**
 * 中学数学科 教員ポータル & 授業工房
 * メインスクリプト (app.js)
 */

// ==========================================
// // 3層時間割システム: 設定とデフォルトデータ

// ==========================================
// // 状態管理 (State)