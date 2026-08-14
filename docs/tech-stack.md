# 技術スタック - Trello風タスク管理アプリ

[要件定義書](requirements.md) に対応する技術スタック詳細ドキュメント。

## 1. バックエンド

| 項目 | 選定 |
|---|---|
| 言語 | Java |
| フレームワーク | Spring Boot |
| ビルドツール | Gradle |
| ORM | Spring Data JPA (Hibernate) |
| API方式 | REST API |
| バリデーション | Bean Validation (Jakarta Validation) |

## 2. フロントエンド

| 項目 | 選定 |
|---|---|
| フレームワーク | React |
| 言語 | TypeScript |
| ビルドツール | Vite |
| ドラッグ&ドロップ | dnd kit |
| HTTPクライアント | Axios |
| スタイリング | Tailwind CSS |

- Next.js は今回のスコープ対象外とする(素の React 構成)。

## 3. データベース

| 項目 | 選定 |
|---|---|
| DBMS | PostgreSQL |
| マイグレーション | Flyway |

## 4. 開発・実行環境

| 項目 | 選定 |
|---|---|
| コンテナ | Docker / Docker Compose |
| パッケージ管理(FE) | npm |
| APIドキュメント | springdoc-openapi (Swagger UI) |
| テスト(BE) | JUnit 5 + Spring Boot Test |
| テスト(FE) | Vitest + React Testing Library |
