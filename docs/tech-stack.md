# 技術スタック - Trello風タスク管理アプリ

[要件定義書](requirements.md) に対応する技術スタック詳細ドキュメント。

## 1. バックエンド

| 項目 | 選定 | バージョン |
|---|---|---|
| 言語 | Java | 25 |
| フレームワーク | Spring Boot | 4.1.0 |
| ビルドツール | Gradle | 9.5.1 |
| ORM | Spring Data JPA (Hibernate) | Spring Boot 4.1.0 管理下 |
| API方式 | REST API | - |
| バリデーション | Bean Validation (Jakarta Validation) | Spring Boot 4.1.0 管理下 |

## 2. フロントエンド

| 項目 | 選定 | バージョン |
|---|---|---|
| フレームワーク | React | 19.2.8 |
| 言語 | TypeScript | 6.0.2 |
| ビルドツール | Vite | 8.2.0 |
| ドラッグ&ドロップ | dnd kit | (未導入・今後追加予定) |
| HTTPクライアント | Axios | 1.19.0 |
| スタイリング | Tailwind CSS | 4.3.3 |
| Lint | oxlint | 1.75.0 |
| パッケージ管理 | npm | - |

- Next.js は今回のスコープ対象外とする(素の React 構成)。

## 3. データベース

| 項目 | 選定 | バージョン |
|---|---|---|
| DBMS | PostgreSQL | 17 |
| マイグレーション | Flyway | (未導入・今後追加予定) |

## 4. 開発・実行環境

| 項目 | 選定 | バージョン |
|---|---|---|
| コンテナ | Docker / Docker Compose | - |
| パッケージ管理(FE) | npm | - |
| バージョン管理 | Git + GitHub | - |
| APIドキュメント | springdoc-openapi (Swagger UI) | (未導入・今後追加予定) |
| テスト(BE) | JUnit 5 + Spring Boot Test | Spring Boot 4.1.0 管理下 |
| テスト(FE) | Vitest + React Testing Library | (未導入・今後追加予定) |
