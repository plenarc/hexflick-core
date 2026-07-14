---
description: 指示された内容をGitHub issueとして追加する
argument-hint: <issueにしたい内容>
---

以下の内容でGitHub issueを作成する: $ARGUMENTS

1. `$ARGUMENTS` が空なら、issueにしたい内容をユーザーに尋ねてから進める。
2. `git remote -v` でGitHubリモートの有無を確認する。無ければユーザーに報告して終了する。
3. 内容から適切なタイトル（60文字程度まで）と本文を組み立てる。本文は背景・やりたいこと・完了条件などが読み取れるように整理する。指示が短い場合は無理に水増ししない。
4. `gh issue create --title "..." --body "..."` で作成する。ラベルやアサインの指定が無ければ付けない。
5. 作成されたissueのURLをユーザーに報告する。
