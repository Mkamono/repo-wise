# GitHub OAuth App セットアップガイド

## 1. GitHub OAuth App 作成

1. GitHubにログインし、Settings に移動
2. 左メニューから **Developer settings** をクリック
3. **OAuth Apps** をクリック
4. **New OAuth App** をクリック

## 2. OAuth App 設定

以下の情報を入力：

- **Application name**: `Document App Test` (任意の名前)
- **Homepage URL**: `http://localhost:3000` (テスト用)
- **Authorization callback URL**: `http://localhost:3000` (テスト用)
- **Webhook URL**: 空欄のままでOK（使用しません）

**本番環境では**:
- Homepage URL: `https://yourdomain.github.io/document-app`
- Callback URL: `https://yourdomain.github.io/document-app`

## 3. Client ID 取得

作成後、**Client ID** をコピーしてください。
（Client Secret は PKCE では不要です）

## 4. テスト実行

1. `pkce-test.html` をブラウザで開く
2. Client ID を入力
3. 「GitHub でログイン」をクリック
4. 認証後、「GitHub API テスト」をクリック

## 5. 期待される結果

認証成功後、ユーザー情報とリポジトリ一覧が JSON 形式で表示されます：

```json
{
  "user": {
    "login": "username",
    "name": "Your Name", 
    "public_repos": 10
  },
  "repositories": [
    {
      "name": "repo1",
      "full_name": "username/repo1",
      "private": false
    }
  ]
}
```

## トラブルシューティング

- **CORS エラー**: 正しい callback URL を設定してください
- **認証失敗**: Client ID が正しいか確認してください  
- **API エラー**: スコープ権限を確認してください (`repo user`)