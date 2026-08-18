INSERT INTO columns (id, name, display_order, created_at, updated_at) VALUES
	(1, '未着手', 1, now(), now()),
	(2, '進行中', 2, now(), now()),
	(3, '完了', 3, now(), now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO cards (id, column_id, title, description, priority, due_date, display_order, created_at, updated_at) VALUES
	(1, 1, '要件定義書を作成する', 'プロジェクトの要件をまとめる', '高', '2026-09-01', 1, now(), now()),
	(2, 1, 'DB設計を行う', 'テーブル定義とER図を作成する', '中', '2026-09-05', 2, now(), now()),
	(3, 2, 'READ APIを実装する', 'カード・カラムの一覧/詳細取得APIを実装する', '高', '2026-08-25', 1, now(), now()),
	(4, 2, 'フロントの雛形を作成する', NULL, '低', NULL, 2, now(), now()),
	(5, 3, 'リポジトリを初期化する', 'Gitリポジトリとプロジェクト構成を作成する', '中', '2026-08-01', 1, now(), now())
ON CONFLICT (id) DO NOTHING;

SELECT setval('columns_id_seq', (SELECT MAX(id) FROM columns));
SELECT setval('cards_id_seq', (SELECT MAX(id) FROM cards));
