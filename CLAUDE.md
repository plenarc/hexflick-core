# hexflick-core 開発ルール（憲法）

## Git運用

1. **勝手にコミット・プッシュしない。** 明示的な指示がある場合、または下記スラッシュコマンドの実行時のみ行う。
2. **git履歴に影響する操作は原則禁止。** commit / push / rebase / reset / amend / force-push などは、ユーザーの明示指示か、下記スラッシュコマンド経由でのみ行う。
3. 変更はステージ済み or 作業ツリーに置いたままにしてよい。コミットするかどうかはユーザーが判断する。

## スラッシュコマンド

リポジトリ固有のコマンドは持たず、共通 skill (`~/.claude/skills/`) を使う。各 skill はこのリポジトリの設定を `.claude/workflow.md` から読む。

- `/create-issue` — 指示内容をGitHub issueとして追加する。
- `/start-issue <issue番号>` — issueの内容に沿ってbranchを作成し、編集・ステージまで行う。バージョンはここで1回だけ上げる。コミットはしない。
- `/commit-staged` — ステージ済みファイルだけをコミットし、ブランチをpushする。
- `/create-pr` — 作業ブランチから draft PR を作成する。
- `/verify-pr` — checks をローカルで実行し、PRのチェックリストを確かめて draft を解除する。
- `/merged` — PRのMerge後に、ブランチ削除・issueのclose・mainの最新化を行う。

## ブランチ命名規則

`/start-issue` を含め、ブランチ名は `.claude/rules/branch-nabing-rules.md` に従う。

## 未確定・保留事項（TODO）

- パッケージマネージャ: npm → bun への移行を予定。移行後は `mise` でbunのバージョンを管理する。移行自体はまだ未着手。
