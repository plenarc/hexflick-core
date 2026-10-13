# workflow: hexflick-core

## 設定

| 項目 | 値 |
| --- | --- |
| flow | pr |
| language | ja |
| bump | start-issue |
| bump-file | package.json |
| bump-rule | kind |
| checks | `npm run typecheck` → `npm test` |
| commit-style | plain |
| implementer | direct |
| after-merge | none |

## メモ

- GitHub Actions は無い。verify-pr は checks をローカルで実行して代わりにする

- ブランチ命名の詳細は `.claude/rules/branch-nabing-rules.md` (ファイル名は typo のまま参照されている)
- 以前は start-issue と commit-push の両方でバージョンを上げていた。今後は start-issue の 1 回だけ
