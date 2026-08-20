# Trello風タスク管理アプリ

付箋やExcel等での進捗管理では状況が見えづらく対応漏れが発生しやすい、という課題を解決するための個人用タスク管理ツールです。スクールの学習課題として、要件定義・設計・実装・テストの一連の工程を通し、フロントエンド・バックエンド・データベースからなる3層構成のWebアプリケーション開発を実践しています。

## 概要

- ボード上にカラム(リスト)を作成し、カラムの中にカード(タスク)を配置して管理します。
- カードはドラッグ&ドロップでカラム間を移動したり、同一カラム内で並び替えたりできます。
- ログイン機能は持たず、開発者本人が個人で使用するシングルユーザー向けアプリケーションです。

詳細な要件は [docs/requirements.md](docs/requirements.md) を参照してください。

## ドキュメント

| ドキュメント | 内容 |
|---|---|
| [要件定義書](docs/requirements.md) | 目的・背景、スコープ、非機能要件など |
| [機能要件](docs/functional-requirements.md) | 基本機能、カードが持つ情報、CRUD操作、ユースケース一覧 |
| [画面設計](docs/screen-design.md) | 画面一覧、画面遷移図、ワイヤーフレーム |
| [データベース設計](docs/database-design.md) | ER図、テーブル定義 |
| [技術スタック](docs/tech-stack.md) | バックエンド/フロントエンド/DBの採用技術とバージョン |

## 技術スタック

| レイヤー | 技術 | バージョン |
|---|---|---|
| バックエンド | Java / Spring Boot | 25 / 4.1.0 |
| フロントエンド | React / TypeScript / Vite | 19.2.8 / 6.0.2 / 8.2.0 |
| データベース | PostgreSQL | 17 |

バージョンの詳細・その他採用ライブラリ(ORM、スタイリング、テストツール等)は [docs/tech-stack.md](docs/tech-stack.md) を参照してください。

## プロジェクト構成

```
task management/
├── backend/                          # Spring Boot によるREST API (Java)
├── frontend/                         # React + Vite によるSPA (TypeScript)
├── docs/                             # 要件定義・設計ドキュメント
│   ├── database-design.md            # データベース設計(ER図、テーブル定義)
│   ├── functional-requirements.md    # 機能要件・ユースケース
│   ├── requirements.md               # 要件定義書
│   ├── screen-design.md              # 画面設計
│   └── tech-stack.md                 # 技術スタック
├── prototype/                        # UIプロトタイプ
└── docker-compose.yml                # PostgreSQL コンテナ定義
```

## セットアップ・起動方法

### 前提

- Java 25
- Node.js / npm
- Docker / Docker Compose

### 1. データベースの起動

```
docker compose up -d
```

PostgreSQL 17 がポート `5432` で起動します(DB名・ユーザー・パスワードはいずれも `task_management`)。

### 2. バックエンドの起動

```
cd backend
./gradlew bootRun
```

`http://localhost:8080` で起動します。

### 3. フロントエンドの起動

```
cd frontend
npm install
npm run dev
```

`http://localhost:5173` で起動します。

> バックエンド・フロントエンドとも、デフォルトポート(8080 / 5173)で起動することを前提としています。ポートが競合している場合は、別ポートに変更するのではなく、競合しているプロセスを確認・停止してください。

## API概要

現時点で実装済みの主なエンドポイント(すべて `/api` 配下、JSON形式):

| メソッド | パス | 内容 |
|---|---|---|
| GET | `/api/health` | ヘルスチェック |
| GET | `/api/columns` | カラム一覧取得 |
| GET | `/api/columns/{columnId}/cards` | 指定カラムに属するカード一覧取得 |
| PATCH | `/api/columns/{columnId}/cards/sort` | カラム内のカードを優先度順・期限順に一括並び替え |
| POST | `/api/columns` | カラム作成 |
| PUT | `/api/columns/{id}` | カラム名更新 |
| DELETE | `/api/columns/{id}` | カラム削除(所属するカードも合わせて削除) |
| GET | `/api/cards/{id}` | カード詳細取得 |
| POST | `/api/cards` | カード作成 |
| PUT | `/api/cards/{id}` | カード更新 |
| PATCH | `/api/cards/{id}/position` | カードの所属カラム・表示順を更新(ドラッグ&ドロップ) |
| DELETE | `/api/cards/{id}` | カード削除 |

## 開発フロー

このリポジトリでは GitHub Issue → ブランチ → Pull Request のフローで開発を行っています。詳細は [CLAUDE.md](CLAUDE.md) を参照してください。

- `main` ブランチへの直接pushは禁止(ブランチ保護により強制)
- 変更はすべて Issue を起票した上でPull Requestを通して取り込む
- ブランチ命名規則: `<type>/<issue番号>-<概要>` (例: `feature/12-add-login`)
