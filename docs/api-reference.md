# API仕様 - Trello風タスク管理アプリ

[要件定義書](requirements.md) に対応するREST API仕様ドキュメント。実装(`backend/src/main/java/com/example/taskmanagement/controller/`)に基づく。

OpenAPI(springdoc-openapi/Swagger)は未導入(導入方針は[技術スタック](tech-stack.md)を参照)。それまでの間、本ドキュメントを正とする。

## 1. カードAPI (`/api/cards`)

### GET /api/cards/{id}

カード1件を取得する。

**パスパラメータ**

| 名前 | 型 | 説明 |
|---|---|---|
| id | Long | カードID |

**レスポンス** `200 OK`

```json
{
  "id": 1,
  "columnId": 1,
  "title": "string",
  "description": "string",
  "priority": "string",
  "dueDate": "2026-08-20",
  "displayOrder": 0,
  "createdAt": "2026-08-20T10:00:00",
  "updatedAt": "2026-08-20T10:00:00"
}
```

存在しないIDの場合 `404 Not Found`。

### POST /api/cards

カードを新規作成する。作成されたカードは指定カラムの末尾に追加される。

**リクエストボディ**

| 名前 | 型 | 必須 | 制約 | 説明 |
|---|---|---|---|---|
| columnId | Long | ○ | `@NotNull` | 所属カラムID |
| title | String | ○ | `@NotBlank` `@Size(max=100)` | タイトル |
| description | String | - | 制約なし | 説明文 |
| priority | String | ○ | `@NotBlank` `@Size(max=10)` | 優先度(画面上は「高」「中」「低」の選択式だが、APIレベルでは値の制約はかけていない) |
| dueDate | LocalDate (`yyyy-MM-dd`) | - | 制約なし | 期限 |

**レスポンス** `201 Created` — 作成されたカード(`CardResponse`、GETと同形式)

### PUT /api/cards/{id}

カードを更新する。`columnId` を変更すると別カラムへの移動になる。

**パスパラメータ**: `id` (Long)

**リクエストボディ**: `POST /api/cards` と同じ(`columnId`/`title`/`priority` は必須)

**レスポンス** `200 OK` — 更新後のカード。存在しないIDの場合 `404 Not Found`。

### PATCH /api/cards/{id}/position

カードの表示位置(カラム内順序・所属カラム)のみを変更する。ドラッグ&ドロップによる並び替えで使用。

**パスパラメータ**: `id` (Long)

**リクエストボディ**

| 名前 | 型 | 必須 | 説明 |
|---|---|---|---|
| columnId | Long | ○(`@NotNull`) | 移動先カラムID |
| afterCardId | Long | - (nullable) | このカードの直後に挿入する。`null` の場合はカラインの先頭に挿入 |

**レスポンス** `200 OK` — 更新後のカード

### DELETE /api/cards/{id}

カードを削除する。

**レスポンス** `204 No Content`。存在しないIDの場合 `404 Not Found`。

## 2. カラムAPI (`/api/columns`)

### GET /api/columns

全カラムを表示順に取得する。

**レスポンス** `200 OK`

```json
[
  { "id": 1, "name": "未着手", "displayOrder": 0, "createdAt": "...", "updatedAt": "..." }
]
```

### GET /api/columns/{columnId}/cards

指定カラムに属するカードを表示順に取得する。

**レスポンス** `200 OK` — `CardResponse` の配列

### PATCH /api/columns/{columnId}/cards/sort

指定カラム内のカードを一括で並び替え、その並び順を新しい `displayOrder` として保存する。

**リクエストボディ**

| 名前 | 型 | 必須 | 説明 |
|---|---|---|---|
| sortKey | String (enum) | ○(`@NotNull`) | `PRIORITY`(優先度順:高→中→低) または `DUE_DATE`(期限が早い順、未設定は最後) |

**レスポンス** `200 OK` — 並び替え後のカード一覧(`CardResponse` の配列)

### POST /api/columns

カラムを新規作成する。末尾に追加される。

**リクエストボディ**

| 名前 | 型 | 必須 | 制約 |
|---|---|---|---|
| name | String | ○ | `@NotBlank` `@Size(max=50)` |

**レスポンス** `201 Created` — 作成されたカラム(`ColumnResponse`)

### PUT /api/columns/{id}

カラム名を更新する。

**リクエストボディ**: `POST /api/columns` と同じ

**レスポンス** `200 OK`。存在しないIDの場合 `404 Not Found`。

### DELETE /api/columns/{id}

カラムを削除する。**カラムに属するカードも全て連動して削除される(カスケード削除)**。

**レスポンス** `204 No Content`。存在しないIDの場合 `404 Not Found`。

## 3. ヘルスチェックAPI

### GET /api/health

アプリケーションの死活監視用エンドポイント。

**レスポンス** `200 OK`、Content-Type: `text/plain`、body: `"OK"` 固定文字列。

## 4. 共通事項

- 全エンドポイントで認証・認可は行っていない(現状APIは無認証でオープン)。
- バリデーションエラー時は Spring Boot デフォルトの `400 Bad Request` レスポンスを返す(独自のエラーレスポンス形式・`@RestControllerAdvice` は未導入)。
- CORS設定は明示的に行っていない。
