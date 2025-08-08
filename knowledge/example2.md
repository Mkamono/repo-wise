# Git ワークフロー決定記録

## 決定事項

チーム開発におけるGitワークフローとして **GitHub Flow** を採用する。

## 背景

プロジェクト開始にあたり、以下の選択肢を検討した：

1. **Git Flow**: 複雑だが大規模開発向け
2. **GitHub Flow**: シンプルで継続的デプロイ向け  
3. **GitLab Flow**: 環境別ブランチが特徴

## 選択理由

### GitHub Flowを選んだ理由
- ✅ **シンプル**: mainブランチ + feature branchのみ
- ✅ **CI/CD親和性**: 継続的デプロイに適している
- ✅ **学習コスト低**: 新メンバーが理解しやすい
- ✅ **小規模チーム向け**: 現在のチーム規模(5名)に適している

### 却下した理由
- **Git Flow**: 複雑すぎる、リリース頻度が低い前提
- **GitLab Flow**: 環境別ブランチが現在は不要

## ワークフロー手順

```bash
# 1. 最新のmainブランチを取得
git checkout main
git pull origin main

# 2. featureブランチを作成
git checkout -b feature/new-functionality

# 3. 開発・コミット
git add .
git commit -m "Add new functionality"

# 4. プルリクエスト作成
git push origin feature/new-functionality
# GitHub上でPRを作成

# 5. レビュー後、mainにマージ
# GitHub上でSquash and mergeを実行
```

## ブランチ命名規則

- `feature/機能名`: 新機能開発
- `fix/バグ名`: バグ修正
- `hotfix/緊急修正`: 本番緊急対応

## レビュー規則

- 必須レビュワー: 2名以上
- 自動テスト通過が必須
- コンフリクト解決は作成者が実施

---

**決定日**: 2024-01-15  
**次回見直し**: 2024-07-15 (6ヶ月後)