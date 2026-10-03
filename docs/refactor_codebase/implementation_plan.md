# 実装計画：機能別コードベースの分割

## 1. 背景と課題
- `app.js` と `style.css` が肥大化し、1つのファイルに全機能が混在している。
- 「練習プリント」の修正が「授業プリント」に影響を及ぼすなど、機能間の密結合による副作用が発生している。
- 現代的な機能別モジュール化（Feature-based architecture）を導入し、影響範囲を局所化する。

## 2. 目指すアーキテクチャ案
ES Modules (`<script type="module">`) を活用し、フロントエンドのビルドツール（Webpackなど）無しでもブラウザネイティブで動作するモジュールシステムを構築します。

### 新しいディレクトリ構造案
```text
中学数学科ポータル/
├── index.html
├── docs/                 # ドキュメント群
├── css/                  # 分割したCSS
│   ├── base.css          # リセット、変数設定
│   ├── layout.css        # 全体レイアウト、共通コンポーネント
│   ├── print.css         # 共通の印刷用設定
│   └── features/         # 各機能固有のスタイル
│       ├── timetable.css
│       ├── class-print.css
│       ├── practice-print.css
│       └── quick-test.css
└── js/                   # 分割したJavaScript
    ├── main.js           # エントリーポイント（各モジュールの初期化）
    ├── core/             # 共通ロジック
    │   ├── data.js       # 単元データや設定値
    │   ├── utils.js      # 汎用関数群
    │   └── print.js      # 印刷制御の共通基盤
    └── features/         # 機能別モジュール
        ├── timetable/
        │   └── index.js
        ├── class-print/
        │   └── index.js
        ├── practice-print/
        │   └── index.js
        └── quick-test/
            └── index.js
```

## 3. 移行ステップ
非常にコードベースが大きいため、一度にすべてを書き換えるのではなく、安全に段階的に移行します。

**Step 1: 分析と準備**
- `app.js` 内のグローバル変数と、機能ごとの依存関係をマッピングする。

**Step 2: 共通基盤の抽出**
- どの機能からも呼ばれるデータ（`subUnitGeneratorMap` など）とユーティリティ関数を `core` に移動。

**Step 3: 各機能の抽出**
- 授業プリント、練習プリント、小テストなどの各機能を `features/` 配下に移動し、ES Modulesの `import`/`export` でつなぎ合わせる。

**Step 4: CSSのモジュール化**
- html側で用途別にCSSファイルを分けて読み込む構造に整理。

**Step 5: 結合とテスト**
- `index.html` を修正し、新しい構造を読み込む。
- 各機能（特に印刷周り）が正常に動くかテストする。
