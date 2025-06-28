# ito-game

リアルタイムマルチプレイヤー対応のイトゲーム（数字当てゲーム）のWebアプリケーションです。プレイヤーは与えられた数字をお題に沿って表現し、チーム全体でその表現を昇順に並び替えることを目指します。

## 🎮 ゲーム概要

- プレイヤーは1-100の重複しない数字を割り当てられます
- お題に沿って自分の数字を表現します（具体的な数字は言わない）
- ホストが全プレイヤーの表現を昇順に並び替えます
- 実際の数字を発表し、正しい順番かどうかを確認します
- 最も順番から離れたプレイヤーがライフを1失います
- 誰かのライフが0になるまで、または任意のタイミングでゲーム終了

## 🛠 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク（App Router使用）
- **TypeScript** - 型安全性の確保
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネントライブラリ
- **Lucide React** - アイコンライブラリ

### バックエンド・データベース
- **Supabase** - Backend as a Service
  - PostgreSQL データベース
  - リアルタイム購読機能
  - 認証・認可（今回は匿名認証）

### 状態管理
- **Zustand** - 軽量な状態管理ライブラリ

## 📁 プロジェクト構成

```
ito-game/
├── app/                    # Next.js App Router
│   └── page.tsx           # メインページ
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── whileGame/        # ゲーム中のコンポーネント
│   │   ├── watch-own-number.tsx      # 数字確認・表現入力
│   │   ├── arrange-expression.tsx    # 表現並び替え
│   │   ├── reveal-real-order.tsx     # 結果発表
│   │   └── show-result.tsx           # 最終結果
│   ├── title-screen.tsx             # タイトル画面
│   ├── create-team-screen.tsx       # チーム作成画面
│   ├── join-team-screen.tsx         # チーム参加画面
│   ├── waiting-screen.tsx           # 待機画面
│   ├── genre-select-screen.tsx      # ジャンル選択画面
│   └── while-game-base.tsx          # ゲーム画面統括
├── stores/               # 状態管理
│   └── gameStore.ts      # Zustandストア
├── lib/                  # ユーティリティ
│   └── supabase.ts       # Supabase設定・型定義
└── migrations/           # データベースマイグレーション
    └── 001_initial_schema.sql
```

## 🗄 データベース設計

### テーブル構成

#### rooms（ルーム）
```sql
- id: UUID (Primary Key)
- room_code: VARCHAR(8) (ルームコード)
- host_id: UUID (ホストプレイヤーID)
- status: 'waiting' | 'playing' | 'finished'
- current_round: INTEGER (現在のラウンド数)
- max_rounds: INTEGER (最大ラウンド数)
- created_at, updated_at: TIMESTAMP
```

#### players（プレイヤー）
```sql
- id: UUID (Primary Key)
- room_id: UUID (外部キー)
- name: VARCHAR(50) (プレイヤー名)
- avatar_color: VARCHAR(7) (アバターカラー)
- total_life: INTEGER (ライフ数, デフォルト3)
- is_host: BOOLEAN (ホストフラグ)
- is_online: BOOLEAN (オンライン状態)
- joined_at: TIMESTAMP
```

#### topics（お題）
```sql
- id: UUID (Primary Key)
- number: INTEGER (お題番号)
- title: VARCHAR(100) (お題タイトル)
- description: TEXT (お題説明)
- category: VARCHAR(50) (カテゴリ)
```

#### games（ゲーム）
```sql
- id: UUID (Primary Key)
- room_id: UUID (外部キー)
- round_number: INTEGER (ラウンド番号)
- topic_id: UUID (お題ID)
- topic_number: INTEGER (お題番号)
- phase: 'discuss' | 'arrange' | 'reveal' | 'result'
- player_order: TEXT[] (プレイヤー順序)
- started_at, ended_at: TIMESTAMP
```

#### player_numbers（プレイヤー数字）
```sql
- id: UUID (Primary Key)
- game_id: UUID (外部キー)
- player_id: UUID (外部キー)
- number: INTEGER (割り当てられた数字)
- position: INTEGER (並び替え後の位置)
- match_word: VARCHAR(100) (プレイヤーの表現)
```

## 🎯 ゲームフロー

1. **タイトル画面** - チーム作成またはチーム参加を選択
2. **チーム作成/参加** - ルームコードでマッチング
3. **待機画面** - プレイヤーが揃うまで待機
4. **ジャンル選択** - ホストがお題のジャンルを選択
5. **ゲーム開始** - 以下のフェーズを繰り返し

### ゲーム内フェーズ

#### Discuss（議論フェーズ）
- プレイヤーが自分の数字を確認
- お題に沿って数字を表現
- 全員が表現を送信すると次のフェーズへ

#### Arrange（並び替えフェーズ）
- ホストが全プレイヤーの表現を確認
- 数字の小さい順になるよう並び替え
- 並び替え確定で次のフェーズへ

#### Reveal（発表フェーズ）
- 並び替えた順番で実際の数字を発表
- 正解/不正解の判定
- 最も離れたプレイヤーのライフ減少

#### Result（結果フェーズ）
- 最終的なランキング表示
- ライフ順でプレイヤーをソート

## 🔄 リアルタイム機能

Supabaseのリアルタイム購読機能を使用して以下を実現：

- **プレイヤー参加/退出** の即座反映
- **ゲーム状態変更** の全プレイヤー同期
- **フェーズ遷移** の自動画面切り替え
- **表現送信** の進捗共有
- **ライフ変更** の即座反映

## 🎨 お題カテゴリ

- **恋愛** (1-20番): 恋愛関連のお題
- **盛り上がる** (21-40番): 一般的で盛り上がるお題
- **エッチ** (41-60番): 大人向けのお題

## 🚀 セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
cp .env.example .env.local
# NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定
```

3. データベースマイグレーション
```sql
-- migrations/001_initial_schema.sql を Supabase で実行
```

4. 開発サーバー起動
```bash
npm run dev
```

## 📝 主要機能

### ホスト権限
- ゲーム開始/終了
- ジャンル選択
- プレイヤー表現の並び替え
- 次のゲーム開始

### プレイヤー機能
- チーム参加/退出
- 表現入力
- リアルタイム状態確認

### ゲームロジック
- 重複しない数字割り当て
- 順番判定アルゴリズム
- ライフ管理システム
- ランキング計算

## 🔧 主要なライブラリ

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "@supabase/supabase-js": "^2.x",
    "zustand": "^4.x",
    "tailwindcss": "^3.x",
    "@radix-ui/react-*": "^1.x",
    "lucide-react": "^0.x"
  }
}
```

## 🎯 今後の拡張可能性

- ユーザー認証システム
- カスタムお題作成機能
- ゲーム履歴・統計機能
- チャット機能
- 観戦者モード
- トーナメント機能

