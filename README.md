# 草野球チーム成績管理 MVP

Step3 UIモックを Next.js + Supabase で実装したアプリです。

## ローカルで動かす

```bash
cd my-mvp
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

**デモモード**: `.env.local` がない場合、サンプルデータで閲覧できます（保存は不可）。

## Supabase を接続する

1. [Supabase](https://supabase.com) でプロジェクトを作成（Region: Tokyo）
2. SQL Editor で `supabase/schema.sql` を実行
3. Project Settings → API から URL と anon key をコピー
4. `.env.local.example` を `.env.local` にコピーして値を貼る

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

5. `npm run dev` を再起動

## 画面

| パス | 内容 |
|------|------|
| `/` | ランキング（S1） |
| `/players` | 選手一覧 |
| `/players/[id]` | 個人成績（S2） |
| `/games` | 試合検索（S6） |
| `/games/[id]` | 試合詳細・記録変更へ |
| `/admin` | 記録員エリア（S5） |
| `/admin/games/new` | 試合入力（S3） |
| `/admin/players/new` | 選手登録（S4） |

## GitHub / Vercel

`my-mvp/` は ai-course-starter とは**別リポジトリ**に push してください。

```bash
git add .
git commit -m "initial commit"
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```

Vercel でこのリポジトリを接続し、環境変数を設定してデプロイします。
詳細は `../docs/VERCEL_SETUP.md` を参照してください。
