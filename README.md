# hexflick-core

フラットトップ正六角形のハニカム配置による6方向フリック日本語入力方式「HEXフリック」の、プラットフォーム非依存な入力ロジック（`src/`）と、それをブラウザで動かす公開デモ（`demo/`）。

- `src/`: DOM・window・イベントに一切依存しない純粋なTypeScript。将来 Kotlin (Android IME) へ移植する際の正解テストベクタもここに置く。
- `demo/`: `src/` を読み込むだけの薄いブラウザデモ（GitHub Pages でホスト予定）。
- かな漢字変換は対象外。本ライブラリが出力するのは確定したかな文字列まで。

## 開発

```sh
npm install
npm run dev       # デモを起動
npm test          # vitest
npm run typecheck
npm run build     # demo/ を dist/ にビルド
```

## 先行技術について

本方式に類似する既存事例（アルテのターンフリック等）が存在することを認識した上で、六角ハニカム配置・訪問制約・トグルHEX等の設計を公開実装として記録することを目的の一つとしています（先行技術公開）。

## プライバシー

`src/` と `demo/` はネットワーク通信を一切行わず、広告SDKも組み込みません。

## ライセンス

Apache-2.0（`LICENSE` 参照、特許条項付き）。

将来 Android 本体に Mozc（BSD-3-Clause）を組み込む段階では、著作権表示保持義務が発生します。
