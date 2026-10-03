# 授業プリント リッチエディタ＆ブロックリサイズ タスクリスト

## フェーズ 1: UIとデザインの準備 (CSS)
- [x] 1.1 フローティング・ツールバーのデザイン (`class-print.css`)
- [x] 1.2 カラーパレットのデザイン (`class-print.css`)
- [x] 1.3 リサイズハンドルのデザイン (`class-print.css`)
- [x] 1.4 印刷用CSSの更新（ツールバーやハンドルを印刷対象外にする） (`print.css`)

## フェーズ 2: リサイズ機能の実装 (JS)
- [x] 2.1 ブロック生成HTMLに `<div class="sheet-resize-handle">` を追加 (`js/core/init.js`, `js/features/class-print.js`)
- [x] 2.2 ドラッグ開始（`mousedown`）、移動（`mousemove`）、終了（`mouseup`）のイベントリスナー実装
- [x] 2.3 `state.blocksLeft` / `state.blocksRight` / `state.blocks` の各高さデータ更新と状態保存の連結

## フェーズ 3: フローティングツールバーと文字装飾の実装 (JS)
- [x] 3.1 ツールバーのDOM要素を `body` に追加 (`#floatingTextToolbar`, `#ftColorPalette`, `#ftHighlightPalette`)
- [x] 3.2 文字選択（`selectionchange`, `mouseup`, `keyup`）を検知し、選択範囲の座標にツールバーを配置するロジック
- [x] 3.3 太字（Bold）、下線（Underline）、取り消し線（Strike）ボタンの処理
- [x] 3.4 文字サイズ変更ボタン（A- / A+ で 7段階のサイズ切り替えとラベル表示）の処理
- [x] 3.5 文字色変更ボタン（パレット表示、墨/赤/青/緑/橙/紫、カスタムカラーピッカー）の処理
- [x] 3.6 蛍光マーカー（ハイライト色切り替え）の処理
- [x] 3.7 装飾クリア（標準書式へリセット）機能の処理

## フェーズ 4: テストと調整
- [x] 4.1 全JavaScriptファイルの構文エラーチェック（全9ファイル構文検証完了）
- [x] 4.2 保存したプリントの復元時に、装飾と高さが正しく復元される構造の担保（`state.blocksLeft`/`Right` の自動同期）
- [x] 4.3 ローカルサーバー（http://localhost:3000）を通じたアセット正常配信（HTTP 200）の確認
