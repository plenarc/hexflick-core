# ブランチ命名規約

ブランチ名の統一性を確保し、プロジェクトの管理を容易にするため、以下の規則に従ってブランチ名を命名してください。

## 基本ルール {#basic-rules}

使用可能なブランチ名の種類は次のとおりです。これ以外の命名は禁止します。

:::tip tip
接頭の `\p` はイメージ表示に使っているPlantUMLの決まり事なので利用時には不要なので注意
正しくは各詳細で確認すること
:::

1. `\p{#issue_id}` = `[0-9]+` : GitHubのIssue ID
1. `\p{summary}` = `[a-z0-9-]+` : 概要を英語で書く
1. `\p{date(yyyymmdd)}` = `[0-9]{8}` : 作成日(作業開始日)
1. `\p{commit_hash}` = `[a-f0-9]{7,40}` : コミットハッシュ

```pumld
@startregex
^((feature|bugfix|hotfix)/\p{#issue_id}-\p{summary}|revert/\p{commit_hash})-\p{date(yyyymmdd)}$
@endregex
```

### Feature

1. 機能開発用
1. 新機能の開発や改善作業で使用します。

```bash
feature/{#issue_id}-{summary}-{date(yyyymmdd)}
```

- 例: issue IDが `10` の場合

```bash
feature/#10-add-api-nameabc-20250316
```

### Bugfix

1. 本番環境バグ対応用
1. 本番環境で発生したバグを修正するために使用します。

```bash
bugfix/{#issue_id}-{summary}-{date(yyyymmdd)}
```

- 例: issue IDが `15` の場合

```bash
bugfix/#15-fix-login-error-20250316
```

### Hotfix

1. 緊急の修正対応
1. 本番環境で発生した致命的な不具合に対し、緊急対応を要する場合に使用します。

```bash
hotfix/{#issue_id}-{summary}-{date(yyyymmdd)}
```

- 例: issue IDが `20` の場合

```bash
hotfix/#20-critical-security-patch-20250316
```

### Revert

1. 変更の取り消し用
1. 過去のコミットを取り消す際に使用します。

```bash
revert/{commit_hash}-{date(yyyymmdd)}
```

- 例: コミットハッシュが `abcd123` の場合

```bash
revert/abcd123-20250316
```

## 使用可能文字 {#allowed-characters}

1. アルファベット小文字 (`a`-`z`)
1. 数字 (`0`-`9`)
1. ハイフン (`-`)

必ず **ケバブケース**(単語同士をハイフンで繋ぐ)を使用してください。

## 使用禁止文字 {#prohibited-characters}

1. 大文字 (`A-Z`)
1. スペース (` `)
1. アンダースコア (`_`)
1. その他記号 (`!`, `@`, `#`, `$`, `%`, `^`, `&`, `*`, `(`, `)`, 等)

## 注意事項 {#notes}

1. ブランチ名は可能な限り明確かつ簡潔にしてください。
1. issueがない場合は省略せず、必ずissueを作成したうえでブランチを作成してください。
1. 一度作成したブランチの名前を変更することは禁止します。
