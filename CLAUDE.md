# hexflick-core 開発ルール（憲法）

## Git運用

1. **勝手にコミット・プッシュしない。** 明示的な指示がある場合、または下記スラッシュコマンドの実行時のみ行う。
2. **git履歴に影響する操作は原則禁止。** commit / push / rebase / reset / amend / force-push などは、ユーザーの明示指示か、下記スラッシュコマンド経由でのみ行う。
3. 変更はステージ済み or 作業ツリーに置いたままにしてよい。コミットするかどうかはユーザーが判断する。

## スラッシュコマンド

- `/commit-push` — ステージ済みファイルをコミット&プッシュする。削除ファイルがあれば実行前に確認を取り、`package.json` のバージョンを更新する（スクリプト系ファイル(`.js`/`.mjs`/`.cjs`/`.ts`/`.mts`)の変更を含む場合はminorを+1・patchを0にリセット、それ以外はpatchのみ+1。詳細は `.claude/commands/commit-push.md`）。
- `/create-issue` — 指示内容をGitHub issueとして追加する（詳細は `.claude/commands/create-issue.md`）。
- `/start-issue <issue番号>` — issueの内容に沿ってbranchを作成し、編集・ステージまで行う。コミットはしない（詳細は `.claude/commands/start-issue.md`）。

## 未確定・保留事項（TODO）

- ブランチ命名規則: `/start-issue` は暫定で `issue-<番号>-<slug>` を使う。正式なルールは別途決定する。
- パッケージマネージャ: npm → bun への移行を予定。移行後は `mise` でbunのバージョンを管理する。移行自体はまだ未着手。
