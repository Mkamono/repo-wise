# GitHub Repository Viewer セットアップガイド

## 概要

GitHub Repository Viewer は GitHub Device Flow を使用した認証システムを採用しており、Client Secret が不要で安全な認証が可能です。

## 1. GitHub OAuth App 作成

### ステップ 1: GitHub開発者設定へ移動
1. GitHubにログインし、画面右上のプロフィール画像をクリック
2. **Settings** を選択
3. 左サイドバーの下部 **Developer settings** をクリック
4. **OAuth Apps** をクリック
5. **New OAuth App** ボタンをクリック

### ステップ 2: OAuth App 情報入力

以下の情報を正確に入力してください：

```
Application name: Repository Viewer
（注意: "GitHub" で始まる名前は使用できません）

Homepage URL: http://localhost:8080

Authorization callback URL: http://localhost:8080/callback
（注意: Device Flowでは使用されませんが、フォーム入力必須）

Application description: (任意)
Simple repository viewer using GitHub Device Flow
```

### ステップ 3: アプリケーション作成
1. **Register application** をクリック
2. 作成されたアプリの詳細ページが表示されます
3. **Client ID** をコピーして保存します（例: `Ov23liABC123DEF456`）

**重要**: Client Secret は**作成も使用もしません**

## 2. 環境設定

### 環境変数の設定
コピーした Client ID を環境変数として設定します：

```bash
# bashの場合
export GITHUB_CLIENT_ID="Ov23liABC123DEF456"

# 永続化したい場合は ~/.bashrc または ~/.zshrc に追加
echo 'export GITHUB_CLIENT_ID="Ov23liABC123DEF456"' >> ~/.bashrc
```

### 設定確認
```bash
echo $GITHUB_CLIENT_ID
# 正しいClient IDが表示されることを確認
```

## 3. アプリケーション起動

### 方法1: 実行スクリプト使用（推奨）
```bash
./run.sh
```

### 方法2: 直接実行
```bash
go run main.go
```

### 方法3: バイナリビルド
```bash
go build -o github-repo-viewer main.go
./github-repo-viewer
```

## 4. Device Flow 認証手順

### 1. ブラウザアクセス
http://localhost:8080 にアクセス

### 2. 認証開始
「GitHubで認証開始」ボタンをクリック

### 3. デバイスコード確認
- ユーザーコード（例: `WDJB-MJHT`）が表示される
- 「GitHub認証ページを開く」リンクをクリック

### 4. GitHub認証
1. 新しいタブでGitHubの認証ページが開く
2. 表示されたユーザーコードを入力
3. 「Continue」をクリック
4. アプリケーションを承認（Authorize）

### 5. 自動完了
- 認証完了後、元のページが自動的に更新される
- リポジトリ一覧が表示される

## 5. 期待される結果

認証成功後、以下の情報が表示されます：

- **ユーザー情報**: アバター、名前、ユーザー名
- **リポジトリ一覧**: 最新20件のリポジトリ
  - リポジトリ名とリンク
  - 説明文（ある場合）
  - Private/Publicの表示

## トラブルシューティング

### 認証関連

**Client ID が無効**
```
エラー: "Invalid client_id"
→ GitHub OAuth AppのClient IDを正しく設定してください
```

**認証タイムアウト**
```
タイムアウト：認証に時間がかかりすぎました
→ GitHub認証ページで10分以内にコード入力してください
```

**権限不足**
```
403 Forbidden
→ OAuth Appのスコープ設定を確認（repo, user）
```

### 環境設定関連

**環境変数未設定**
```bash
# エラー確認
./run.sh

# 修正方法
export GITHUB_CLIENT_ID="your_actual_client_id"
```

**ポート競合**
```bash
# 別ポート使用
export PORT="3000"
go run main.go
```

### ネットワーク関連

**GitHub API接続エラー**
- GitHub のサービス状況を確認: https://www.githubstatus.com/
- ネットワーク接続を確認
- ファイアウォール設定を確認

## 6. 本番環境での使用

本番環境で使用する場合は、OAuth Appの設定を更新してください：

```
Homepage URL: https://your-domain.com
Authorization callback URL: https://your-domain.com/callback
```

HTTPSの使用を強く推奨します。

## 7. セキュリティ注意事項

- Client IDは公開情報として扱われますが、適切に管理してください
- Client Secretは一切不要です（Device Flow使用）
- アクセストークンはサーバーのメモリ内のみ保存
- 本番環境ではHTTPS必須
- 定期的なアクセストークンの更新を推奨


pnpx create-tsrouter-app@latest my-app --template file-router --tailwind --package-manager pnpm
