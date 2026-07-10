# HEXフリック — `hexflick-core` / `hexflick-web` 切り出し指示書

Claude Code 向けの実装指示書です。既存の単一HTMLプロトタイプ（`hexflick-prototype.html`）から、プラットフォーム非依存の入力ロジックを純粋なTypeScriptライブラリ（`core`）として切り出し、それをブラウザで動かす公開デモ（`web`）に分離します。

---

## 0. 背景と原則

- HEXフリックは、フラットトップ正六角形のハニカム配置による6方向フリック日本語入力の入力方式。
- プロトタイプで操作モデルは確定済み。本タスクは「動く実験HTML」を「テスト可能な本番ロジック + デモUI」に整理すること。
- **core はプラットフォーム非依存**。DOM・window・イベントに一切依存しない純粋関数とデータのみ。将来 Kotlin (Android IME) へ移植する際の「正解」テストベクタも core に置く。
- 変換（かな漢字変換）は core の対象外。core が出力するのは「確定したかな文字列」まで。変換は後段（Mozc等）に委ねる。
- コミュニティ規約: 4スペースインデント、コードコメントは英語、`plenarc` 配下。

---

## 1. 成果物のディレクトリ構成

単一リポジトリ `hexflick-core` に web デモも同梱する（別リポジトリにしない）。

```
hexflick-core/
├── src/
│   ├── geometry.ts      # 六角格子の座標計算（純粋）
│   ├── layout.ts        # 文字テーブル ROWS と型定義
│   ├── engine.ts        # 選択解決エンジン（純粋）: compute / buildCells など
│   └── index.ts         # 公開API re-export
├── test/
│   └── engine.test.ts   # 後述のテストベクタ
├── demo/                # = hexflick-web。coreを読み込むブラウザデモ
│   ├── index.html
│   ├── main.ts          # DOM描画・PointerEvents配線のみ（ロジックは持たない）
│   └── style.css
├── docs/
│   └── hexflick-prototype.html   # 初代プロトタイプをそのまま保存
├── package.json
├── tsconfig.json
├── LICENSE              # Apache-2.0
└── README.md
```

- ビルド: Vite を推奨（TS + デモを最小構成で回せる）。テストは vitest。
- `demo/` は GitHub Pages へデプロイ（`web`の役割）。これが公開デモ兼「先行技術の公開証跡」になる。

---

## 2. ロジック / 描画の境界（重要）

プロトタイプの関数を以下に振り分ける。**core に入るものは DOM を触ってはいけない。**

### core（純粋・移植対象）
- `geometry.ts`: `HR / H / HX / HY`, `OFF`, `DIRS`, `pos()`, `zoneOf()`
- `layout.ts`: `SH`, `Y`, `ROWS`, `HINT`, ヘルパ `isShift / echar / elabel / subOf / layerOf`, および型定義
- `engine.ts`: `curRoot()`, `buildCells()`, `compute()`, および入力状態 `State` の生成 `createState(row)`

### 描画・入出力（core に入れない。demo側 `main.ts` に残す）
- `render / commit / backspace`（テキスト出力）
- `addCell / draw`（DOM生成）
- `start / move / end / abort`（PointerEvents ハンドラ）
- スライダー `TH / CANCEL` のUI配線
- キーボードDOM、`pointerdown/move/up/cancel` 配線

**切り出しの肝**: プロトタイプでは `TH` と `CANCEL` がグローバル変数だが、core では純粋性のため `compute` の引数（設定オブジェクト）として渡す。demo側がスライダー値を渡し込む形にする。

---

## 3. core の公開API（TypeScript）

型と関数シグネチャを以下に固定する。実装中身はプロトタイプのロジックを移植すればよい。

```ts
// ---- 方向 ----
export type Dir = 'u' | 'd' | 'ul' | 'ur' | 'dl' | 'dr';

// ---- 文字テーブルのエントリ ----
// 文字列 = その文字 / {c,sub?} = 文字+二段目 / {shift} = シフトトリガ(baseのu,dのみ)
export type Entry =
  | string
  | { c: string; lab?: string; sub?: Partial<Record<Dir, Entry>> }
  | { shift: ShiftType };
export type ShiftType = 'daku' | 'handaku' | 'small';

export interface Layer { c: string; lab?: string;
  u?: Entry; d?: Entry; ul?: Entry; ur?: Entry; dl?: Entry; dr?: Entry; }
export interface Row { base: Layer; daku?: Layer; handaku?: Layer; small?: Layer; }
export type RowKey =
  'a'|'ka'|'sa'|'ta'|'na'|'ha'|'ma'|'ya'|'ra'|'wa'|'pn'|'space';
export const ROWS: Record<RowKey, Row>;

// ---- 幾何 ----
export const OFF: Record<Dir, [number, number]>;
export function pos(cx: number, cy: number, dir: Dir): { x: number; y: number };

// ---- 設定（旧グローバルを注入可能に）----
export interface Config { th: number; cancel: number; hr?: number }
export const DEFAULT_CONFIG: Config; // { th: 26, cancel: 48 }

// ---- 入力状態（1ストローク＝1 State）----
export interface State {
  row: Row; cx: number; cy: number;
  shift: ShiftType | null; shiftDir: Dir | null;
  rootDir: Dir | null; visited: Set<string>;
  lastSel: string | null;
}
export function createState(row: Row, cx: number, cy: number): State;

// ---- セル（描画側が使う中間表現）----
export interface Cell {
  key: string; x: number; y: number;
  ch: string;          // 確定に使う文字
  lab: string;         // 表示ラベル（空白の '␣' 等、ch と別）
  kind: 'center' | 'base' | 'shift' | 'sub';
  dir?: Dir; shiftType?: ShiftType;
}

// ---- 選択解決（唯一の副作用: State を更新する）----
export interface ComputeResult {
  char: string;        // 現時点で確定される文字
  cells: Cell[];       // 描画すべき全セル
  selCell: Cell;       // 選択中のセル
  cancel: boolean;     // セルから離れすぎ = 離すと無入力
}
export function compute(
  state: State, x: number, y: number, cfg?: Config
): ComputeResult;
```

- `compute` は `state` を破壊的に更新する（`shift/rootDir/visited/lastSel`）。これはプロトタイプと同じ設計。1ストロークで同一 State を使い回す。純粋性の観点では「State を明示的に受け渡す」ことで DOM 非依存を担保する（グローバル状態を持たない）。
- 描画側は `compute()` の返す `cells` を座標そのままに描くだけ。`cx,cy` はキー中心のスクリーン座標を demo 側が与える。

---

## 4. 操作モデル（実装の要点。移植時に崩さないこと）

1. **最近傍セル方式**: 角度ではなく、指に最も近いセルを選ぶ。中心・親セルには `CBIAS`(=8px) の距離優遇。
2. **訪問制約**: `sub`（拗音・外来音）は親を実際に踏んだ後（`visited` に親key）だけ出現・選択可。未訪問の子座標で離すとキャンセル。
3. **シフトHEXはトグル**: 中心の上下にある濁点/半濁点/小のHEX。乗った瞬間だけ `base ⇄ シフト` を切替（エッジ検出 `lastSel` で乗りっぱなし再切替を防ぐ）。乗っている間は結果文字（じ/し）を表示・確定。乗っていない間は目印（゛゜小）を表示。
4. **配置ルール**: `sub` は「中心へ戻る方向」と「隣接文字の方向」を避け外側の空きへ置く。ul コーナーの空きは dl/ul/u の3つ、など。中心セルは dedup で保護（bloom に潰させない）。
5. **最下段制約**: 最下段キー（space/wa/pn）は d/dl/dr フリックが指で隠れて不可。これらの行に下方向エントリを持たせない（レイアウト側の制約。engine 側の特別扱いは不要）。
6. **表示/入力の分離**: `lab`(表示) と `ch`(入力) を分離。全角空白は `ch='　', lab='␣'`、半角は `ch=' ', lab='␣'`。

---

## 5. テストベクタ（移植の正解。`test/engine.test.ts` に実装）

各ケースは「行 → 中継点の方向列」を順に `compute` へ流し（実指のように補間して8ステップ程度）、最終 `char` と `cancel` を検証する。方向オフセットは `OFF` を積み上げて絶対座標にする（親の位置＋子方向）。`A(...)` は複数方向の合成。

### シフトHEXのトグル・先出し抑制
| 操作 | 期待 char | cancel |
|---|---|---|
| さ>し（右上HEXは "゛" 表示のまま、じを先出ししない） | し | false |
| さ>し>右上(HEX) | じ | false |
| さ>し>右上>左下(じの位置) | じ | false |
| さ>し>右上(じ)>右上もう一度 | し | false |
| さ>し>右上>左上 | じょ | false |

### 訪問制約と ○/✗ ケース
| 操作 | 期待 | cancel |
|---|---|---|
| さ>上>左下(じの位置) | じ | false |
| さ>上>左上(じ未訪問=無効座標) | — | **true** |
| さ>し>しゃ(左下) | しゃ | false |
| さ>し>しゅ(左上) | しゅ | false |
| さ>し>しょ(上) | しょ | false |
| さ>上>じ>じゃ | じゃ | false |

### 再シフト（ミッドジェスチャー）
| 操作 | 期待 | cancel |
|---|---|---|
| し>しゃ>し(通過)>右上HEX | じ | false |
| し>しゃ>し>右上HEX>左下 | じゃ | false |

### 濁点/半濁点/小 と戻り
| 操作 | 期待 | cancel |
|---|---|---|
| か>上>中心 | が | false |
| か>上>中心>上(戻し) | か | false |
| は>下>中心 | ぱ | false |
| あ>上>中心 / あ>下>中心 | ぁ | false |
| は>ふ>ふぇ>中心(戻り) | は | false |
| は>ふ>ふぉ(=下HEX位置と同座標) | ふぉ | false |

### 外来音・ネスト
| 操作 | 期待 | cancel |
|---|---|---|
| う>うぉ | うぉ | false |
| う>うぉ>下 | ヴォ | false |
| う>うぃ>下 | ヴィ | false |
| う>うぇ>下 | ヴェ | false |
| う>左上 | ヴァ | false |
| た>濁>づ>左下 | ヅァ | false |
| は>濁>ぶ>左上 | ぶぁ | false |
| は>半濁>ぷ>左上 | ぷぁ | false |
| て>上 | てぃ | false |
| と>右上 | とぅ | false |

### や 括弧 / わ / 句読点 / 空白
| 操作 | 期待 | cancel |
|---|---|---|
| や>(>左下 | 「 | false |
| や>(>左上 | < | false |
| や>(>上 | 『 | false |
| や>)>右下 | 」 | false |
| や>)>右上 | > | false |
| や>)>上 | 』 | false |
| わ>左上 | を | false |
| わ>上 | ん | false |
| わ>右上 | － | false |
| わ>右上>上 | -(半角) | false |
| 空白(タップ) | 　(全角, lab=␣) | false |
| 空白>上 | (半角スペース, lab=␣) | false |
| 空白>右上 | ・ | false |
| 空白>右上>上 | ･(半角) | false |
| 空白>左上 | ゛ | false |
| 空白>左上>上 | ゜ | false |
| ？(pnの上) | ？ | false |
| ？>上 | ?(半角) | false |
| ！(pnの右上) | ！ | false |
| ！>上 | !(半角) | false |
| 。(pnの左上) | 。 | false |
| タップのみ | (各行の中心文字) | false |

### 静的検査
- `wa` / `pn` / `space` の base に `d` / `dl` / `dr` エントリが**無い**こと。
- 全行×全シフト方向で `compute` が例外を投げず、`cells.length > 0` であること。

> 補足: これらのケースはプロトタイプ開発時のシミュレーションで全て通過済み。移植後も同じ結果になれば挙動が保存されている。

---

## 6. web デモ（`demo/`）の要件

- core を import し、プロトタイプの描画・配線部分（`draw` / `start` / `move` / `end` / `abort` / PointerEvents）だけを持つ薄いUI。
- キーボードレイアウトは 5列×4行（プロトタイプと同一）。最下段は space / wa / pn を含む。
- 調整スライダー（TH / CANCEL）は残す。値を `compute(..., {th, cancel})` に渡す。
- `touch-action: none`、`setPointerCapture` はそのまま。マウスでもタッチでも動くこと。
- 出力欄・パスバーは demo 側の責務。
- GitHub Pages 用に単体ビルドできること。

---

## 7. ライセンス / 表記

- 本リポジトリ（自作コード）: **Apache-2.0**（特許条項付き＝防御目的）。`LICENSE` を置く。
- README に「先行技術（アルテのターンフリック等）が存在するが、六角ハニカム配置・訪問制約・トグルHEX等の設計を公開実装として記録する」旨を明記（先行技術公開＝防御戦略）。
- Mozc は core には含めない（変換は後段）。Android 本体で Mozc を組み込む段階で BSD-3-Clause の著作権表示保持義務が発生する旨だけ README に予告として書いておく。
- プライバシー方針: 「通信しない・広告SDKを積まない」を README に明記。core/web は当然ネットワークを使わない。

---

## 8. やらないこと（スコープ外）

- かな漢字変換（Mozc連携）は別フェーズ。
- Android / Kotlin 実装は別リポジトリ `hexflick-android`（後日）。
- 予測変換・辞書・学習。
- しょ表示の微調整、外来音の標準表記（ぶぁ/ヅァ 等）の要否整理は、Issue化して後回し可。

---

## 9. 最初の一歩（推奨手順）

1. Vite + TS + vitest で空リポジトリ雛形を作る。
2. `docs/hexflick-prototype.html` に既存HTMLをそのままコピー（証跡）。
3. `geometry.ts` → `layout.ts` → `engine.ts` の順に、プロトタイプの該当部分を DOM 非依存で移植。
4. §5 のテストベクタを `test/` に実装し、緑になるまで移植を調整。
5. `demo/main.ts` に描画・配線を移植し、ブラウザで実機確認。
6. README / LICENSE / GitHub Pages 設定。
