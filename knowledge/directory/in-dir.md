# データベース設計メモ

## テーブル構造

### users テーブル
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### documents テーブル
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    author_id INTEGER REFERENCES users(id),
    category VARCHAR(50),
    tags TEXT[], -- PostgreSQL array
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## インデックス設計

```sql
-- 検索性能向上のため
CREATE INDEX idx_documents_title ON documents USING gin(to_tsvector('japanese', title));
CREATE INDEX idx_documents_content ON documents USING gin(to_tsvector('japanese', content));
CREATE INDEX idx_documents_tags ON documents USING gin(tags);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_author ON documents(author_id);
```

## 検討事項

### 全文検索
- PostgreSQLの全文検索機能を使用
- 日本語対応のため `japanese` 設定を使用
- 将来的にElasticsearchも検討

### パフォーマンス
- 大量データ時のパーティション検討
- 読み取り専用レプリカの活用
- キャッシュ戦略（Redis使用）

### セキュリティ
- パスワードはbcryptでハッシュ化
- SQLインジェクション対策（prepared statement使用）
- 個人情報の暗号化検討

## 移行戦略

1. **Phase 1**: 基本テーブル作成
2. **Phase 2**: インデックス最適化
3. **Phase 3**: 全文検索機能追加
4. **Phase 4**: パフォーマンス調整

---

**作成日**: 2024-01-10  
**担当者**: DB設計チーム