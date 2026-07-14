# Markdown

## 基本 {#basic}

### 章立て {#chapter}

1. 例
   ```markdown
   # 章タイトル

   ## 章タイトルごとに"#"を増やす。最大で5章まで

   1. 実用的には3、4階層が妥当
   1. 深すぎる階層が多くなる場合は抽象度を再検討する
   ```
1. 章のひとつ上の行は空行にする
   1. ただし、更に上の行が章の場合は空行不要
   1. 例

      ```markdown
      # 本タイトル

      ## サブタイトル1。本タイトルとサブタイトルの間に空行は不要

      1. 箇条書き例

      ## サブタイトル2。上の行は章ではないため、空行を入れる

      1. 箇条書き例
      ```

### 箇条書き {#itemization}

1. 仕様を会話で伝える際、番号であったほうが伝えやすいので数値になるように `1. ` を使用する
1. 数値はレンダリング時に連番になるので、2番目以降でもすべて `1. ` とする
1. 例
   ```markdown
   1. 1つ目
   1. 2つ目でも "1. "
      1. インデントは半角スペース4つ。タブ文字禁止
      1. 2つ目でも "1. "
   ```
1. 例のレンダリング結果
   1. 1つ目
   1. 2つ目でも "1. "
      1. インデントは半角スペース4つ。タブ文字禁止
      1. 2つ目でも "1. "
1. VSCode利用時にインクリメントされてしまう場合は以下の設定にする
   ```json title="settings.json"
   "markdown.extension.orderedList.marker": "one",
   ```

### 強調表示 {#highlighting}

1. 以下を参考
   1. 公式Docusaurus - Markdown Features: https://docusaurus.io/docs/markdown-features

:::note

1. 斜体(italic)も使えるけど、あまり見やすいと思えないので、仕様としては使わないようにしたい
   :::

### その他 {#other}

1. 使えるemoji。絵文字
   1. 参考: WebFX - [EMOJI CHEAT SHEET](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)

## 応用 {#application}

### 他ドキュメントへのリンク {#link-to-other-documents}

1. 別のドキュメントファイルへのリンクは相対パスで書く

```markdown
1. 同じ階層なら > [別のmdx](other.mdx)
1. 子階層 > [カレントにあるフォルダー内のファイル](subfolder/dummy.mdx)
1. 別階層 > [親をたどって書く](../rules/markdown.mdx)
```

### 詳細表示 {#details}

1. htmlの記述と同じ
1. 例
   ```mdx-code-block
   <details>
     <summary>ここをクリックして開閉</summary>
     <div>
       <div>詳細はここに書く</div>
       \
       <details>
         <summary>ネストして書くこともできる</summary>
         <div>
           :grinning::smile::grin::laughing::blush::wink:
         </div>
       </details>
     </div>
   </details>
   ```
1. 例のレンダリング結果
<details>
  <summary>ここをクリックして開閉</summary>
  <div>
    <div>詳細はここに書く</div>
    \
    <details>
      <summary>ネストして書くこともできる</summary>
      <div>
        :grinning::smile::grin::laughing::blush::wink:
      </div>
    </details>
  </div>
</details>

### コードブロック {#code-block}

1. \`\`\`(バッククォート3つ)で囲うとコードブロックになる
1. 使えるコードは以下を参照
   1. prismjs.com - [Supported languages](https://prismjs.com/#supported-languages)
1. `{`、`}` で囲うとその行がハイライト表示される
1. `title=` を追加するとタイトル表示できる
   1. ハイライトとtitleを続けて書く場合は区切りとして半角スペースが必要
1. 例

   ````md
       ```nim {4-6,8} title="sample.nim" showLineNumbers
       import tables, strutils

       var wordFrequencies = initCountTable[string]()
       for line in stdin.lines:
       for word in line.split(", "):
         wordFrequencies.inc(word)

       echo "The most frequent word is '", wordFrequencies.largest, "'"
   ````

1. 例のレンダリング結果

   ```nim {4-6,8} title="sample.nim" showLineNumbers
   import tables, strutils

   var wordFrequencies = initCountTable[string]()
   for line in stdin.lines:
   for word in line.split(", "):
     wordFrequencies.inc(word)

   echo "The most frequent word is '", wordFrequencies.largest, "'"
   ```

## docusaurus用 {#for-docusaurus}

### 強調記号 {#emphasis-added}

1. アンダーバー(`_`)やアスタリスクなどを使う時、強調表示されてしまうので円マークorバックスラッシュ(`\`)を使って回避する
   1. `_Italic_` {'>'} _Italic_
   1. `\_Italic\_` {'>'} \_Italic\_

### 不等号 {#inequality-sign}

1. `<`、`>` を使うとhtmlタグ扱いでエラーとなる場合があるので以下の方法を使って回避する
   1. 全角不等号を使う
      1. :x:: `<強調したい文言>`
      1. :o:: `＜強調したい文言＞`
   1. `{'`、`'}` で括る
      1. :x:: `abc <= 100`
      1. :o:: `abc {'<='} 100`
