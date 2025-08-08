# APIドキュメント設計ガイド

## 概要

良いAPIドキュメントを作成するためのベストプラクティスをまとめました。

## 基本原則

### 1. 明確性を重視する
- エンドポイントの目的を一文で説明
- パラメータの型と必須/任意を明記
- レスポンス例を必ず含める

### 2. 実用的な例を提供する
```bash
# 良い例：実際に動作するコマンド
curl -X POST "https://api.example.com/v1/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "太郎", "email": "taro@example.com"}'
```

### 3. エラーケースも説明する
- よくあるエラーとその対処法
- HTTPステータスコードの意味
- デバッグのヒント

## チェックリスト

- [ ] 認証方法の説明
- [ ] 全エンドポイントの一覧
- [ ] リクエスト/レスポンスの例
- [ ] エラーコードの説明
- [ ] 更新履歴の記載

## 参考リンク

- [REST API設計のベストプラクティス](https://example.com)
- [OpenAPI Specification](https://spec.openapis.org/)