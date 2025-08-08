# ドキュメントアプリ - 実装設計

## 参考: コアコンセプト
- AIファースト + シンプル管理
- チーム向け（エンジニア + 非エンジニア混合）
- アクション指向UI（「情報を追加」「検索」）
- 品質管理エージェントによる定期メンテナンス

## 実装アプローチ

### アーキテクチャ方針
- **GitHubラッパー設計**: GitHubをデータストア + メタデータ管理として活用
- Markdownファイル + GitHub API + Git操作の組み合わせ

### 技術スタック
- **データストア**: GitHubリポジトリ (Markdownファイル)
- **メタデータ**: GitHub API (コミット履歴、作成者、更新日時、Issues/PRでタスク管理)
- **バックエンド**: GitHub API + Git操作

### GitHubからのメタデータ取得
- 作成日時・更新日時: コミット履歴から取得
- 作成者・更新者: GitHub APIのコミット情報

### 品質管理システム
- **通知キュー**: GitHub Issues として品質チェックタスクを自動作成
- **ラベル管理**: `doc-quality-check`, `decision-log`, `requirements` など
- **自動クローズ**: ドキュメント更新時にIssueを自動クローズ
- **チーム割り当て**: Issue assigneeで担当者管理

### UI設計方針
- **GitHub API活用**: リポジトリ内容をAPIで取得し、アプリ内で表示
- **ドキュメント特化UI**: GitHubの複雑さを隠蔽し、ドキュメント管理に最適化
- **非エンジニア配慮**: Markdown/Git操作を意識させない

### 画面構成案
- **メイン画面**: 「情報を追加」「知識を検索」のアクション選択
- **ドキュメント一覧**: GitHub APIから取得したファイル一覧をカード表示
- **エディター**: WYSIWYG + Markdownハイブリッド
- **品質チェック画面**: GitHub Issuesを整理して表示
- **関連ドキュメント**: 要約ベースの自動リンク表示

### データ構造

#### Markdownファイル構造
```markdown
---
title: "プロジェクトX API設計決定"
type: "decision-log"
created: "2024-01-15"
summary: "REST APIからGraphQLへの変更を決定した理由と経緯"
tags: ["api", "architecture", "project-x"]
---

## 背景
...

## 選択肢
...

## 決定
...

## 理由
...
```

#### ファイル命名規則
- `decision-logs/YYYY-MM-DD_project-name_topic.md`
- `requirements/YYYY-MM-DD_feature-name_requirements.md`  
- `research/YYYY-MM-DD_topic_research-report.md`

### デプロイ方式検討

#### GitHub Pages + 静的サイト案
- **メリット**: 無料、該当リポジトリアクセス権限者のみ使用可能
- **課題**: GitHub API認証（シークレット管理）

#### 認証方式の選択肢
1. **GitHub Apps**: リポジトリレベルでの権限管理、インストール型
2. **Personal Access Token**: ユーザーが個別に設定
3. **GitHub OAuth**: アプリ経由でログイン認証
4. **完全クライアントサイド**: ユーザーのブラウザから直接API呼び出し

#### 推奨アプローチ
**GitHub Apps + Installation認証**

```javascript
// 認証フロー
1. GitHub App作成 (リポジトリレベル権限設定)
2. ユーザーがリポジトリにAppをインストール
3. Installation tokenで認証 (client_secret不要)
4. リポジトリアクセス権限を自動継承
```

**GitHub Appsの利点**:
- client_secret不要でセキュア
- リポジトリ単位でのアクセス制御
- 必要最小限の権限スコープ
- インストール済みのリポジトリのみアクセス可能
- GitHub Pages完全対応

### 技術的検証項目

#### GitHub Pages + GitHub Apps の実現可能性
**課題**:
- GitHub Appsのinstallation tokenは**サーバー側**で取得する必要がある
- JWTの署名にprivate keyが必要（フロントエンドに置けない）
- 完全クライアントサイドでは困難

**実際の制約**:
```
GitHub Apps認証フロー:
1. private keyでJWT署名 → server required
2. JWTでinstallation token取得 → server required  
3. installation tokenでAPI呼び出し → client ok
```

#### 現実的な代替案
1. **GitHub OAuth** (従来方式) + minimal server
2. **Netlify Functions** / **Vercel Edge** での認証処理
3. **完全サーバーアプリ** として開発

### 推奨修正案
**HTML-only + GitHub OAuth + PKCE**

```javascript
// PKCE フロー
1. code_verifier生成 (ランダム文字列)
2. code_challenge生成 (SHA256 hash of verifier)
3. GitHub OAuth認証 + code_challenge送信
4. コールバックでcode受信
5. code + code_verifier でaccess_token取得
```

**メリット**:
- client_secret不要
- 完全にHTML/JS/CSSのみ
- どこでもホスト可能 (GitHub Pages, Netlify, etc.)
- サーバーレス

**GitHub PKCE対応確認**: ✅ 
- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

### 実装方針決定
**HTML-only SPA + GitHub OAuth PKCE**
- 完全クライアントサイド実装
- GitHub Pages直接配信可能
- サーバーレス、メンテナンスフリー

### MVP機能
1. **GitHub OAuth PKCE認証**: 完全フロントエンド実装
2. **基本CRUD**: GitHub APIでMarkdownファイル操作
3. **テンプレート機能**: Decision Log, Requirements, Research Report
4. **要約ベース検索**: FrontMatter summaryでの関連ドキュメント検索
5. **シンプルUI**: アクション選択型インターフェース