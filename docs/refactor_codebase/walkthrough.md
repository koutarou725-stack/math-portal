# 修正内容の確認 (Walkthrough)

## 修正のハイライト
巨大な `app.js`（約10,000行）と `style.css`（約5,400行）を、機能別（Feature-based architecture）にモジュール分割しました。これにより、1つのファイルを修正した際に他の機能が壊れるリスクを大幅に減らすことができます。

### CSSの分割 (`css/`)
元の `style.css` を以下のファイルに分割しました。
- `base.css`, `layout.css`: 共通スタイルやレイアウト
- `features/home.css`, `timetable.css`, `class-print.css`, `practice-print.css` 等: 各画面専用のスタイル
- `print.css`: 印刷（A4・B4）専用のメディアクエリ設定（`@media print`）

### JavaScriptの分割 (`js/`)
JSの機能がHTML上のイベント（`onclick`等）と密結合していたため、安全に分割するためにES Modules化は行わず、機能ごとのJSファイルとして分割・順番に読み込む方式を採用しました。
- `core/state.js`, `init.js`, `utils.js`, `cloud-sync.js`: 全体で共有する状態管理・設定データ・ユーティリティ関数
- `features/timetable.js`, `class-print.js`, `practice-print.js` 等: 各機能に特化したメインロジック

### その他
- 元の `app.js` と `style.css` は、万が一のロールバックに備えて `app.legacy.js`、`style.legacy.css` としてリネームし保存してあります。
- `index.html` の読み込みパスを新構造に変更しました。

## 動作確認ポイント
ブラウザをリロードし（必要であればキャッシュクリア `Ctrl + F5`）、以下の機能が以前と同じように動作するかご確認ください。
1. ホーム画面の表示とタブの切り替え
2. 時間割の編集、特時の設定
3. 授業プリントの機能（保存、プレビュー）
4. **練習プリントの印刷プレビュー（A4縦に1枚で収まるか）**
5. PDF教材へのリンク（別タブで正しく開くか）
