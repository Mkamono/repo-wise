# Document App - GitHub OAuth + Actions Integration

AI-first document management application using GitHub as backend with client-side OAuth authentication.

## Quick Start

### 1. GitHub OAuth App Setup

1. Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
2. Fill in the form:
   - **Application name**: Document App Test (任意の名前)
   - **Homepage URL**: `http://localhost:3000` (テスト用) または実際のURL
   - **Authorization callback URL**: `http://localhost:3000` (テスト用) または実際のURL

### 2. Personal Access Token Setup

GitHub Actions Dispatchを使用するために、以下のスコープを持つPersonal Access Tokenが必要です：
- `repo` (repository dispatch用)
- `gist` (結果保存用)

1. GitHub Settings → Developer settings → Personal access tokens → Generate new token
2. 上記スコープを選択して作成

### 3. Repository Settings

1. Actions を有効にする (Settings → Actions → Allow all actions)
2. 以下のファイルを適切な場所に配置：
   - `.github/workflows/minimal-oauth-proxy.yml`
   - `github-action-minimal/minimal-oauth-client.js`
   - `github-action-minimal/usage-example.html`
   - `pkce-test.html`

### 4. Configuration

各ファイルの設定箇所を更新：

#### `github-action-minimal/usage-example.html`
```javascript
window.GITHUB_OWNER = 'your-github-username';  // 実際のユーザー名に変更
window.GITHUB_REPO = 'your-repo-name';         // 実際のリポジトリ名に変更
```

#### `pkce-test.html` (コード内で設定)
```javascript
const oauth = new MinimalGitHubOAuth(
    'your-github-username',  // 実際のユーザー名に変更
    'your-repo-name',        // 実際のリポジトリ名に変更
    localStorage.getItem('github_pat')
);
```

## Testing

### Option 1: Simple PKCE Test (`pkce-test.html`)

1. ブラウザで `pkce-test.html` を開く
2. Client ID を入力
3. Personal Access Token をLocalStorageに設定 (`github_pat` key)
4. 「GitHub でログイン」をクリック
5. 認証後、「GitHub API テスト」をクリックして動作確認

### Option 2: Minimal Proxy Test (`github-action-minimal/usage-example.html`)

1. ブラウザで `github-action-minimal/usage-example.html` を開く
2. GitHub Personal Access Token を入力
3. OAuth App Client ID を入力
4. 「最小限プロキシでOAuth開始」をクリック

## Architecture

### OAuth Flow with GitHub Actions

```
1. Client → GitHub OAuth (PKCE flow)
2. GitHub → Callback with authorization code
3. Client → GitHub Actions Dispatch (repository_dispatch)
4. Actions → GitHub OAuth token exchange
5. Actions → Save result to Gist
6. Client → Poll for Gist result
7. Client → Receive access token
```

### Performance Benefits

| Method | Execution Time | Cost | Dependencies |
|--------|----------------|------|--------------|
| Cloud Functions | 1-3s | Paid | Server |
| Full GitHub Actions | 30-60s | Free | Many |
| **Minimal Proxy** | **5-10s** | **Free** | **None** |

## Files Structure

```
/
├── .github/workflows/
│   └── minimal-oauth-proxy.yml     # GitHub Actions OAuth proxy
├── github-action-minimal/
│   ├── README.md                   # Japanese documentation
│   ├── minimal-oauth-client.js     # OAuth client with Actions dispatch  
│   └── usage-example.html          # Example usage
├── pkce-test.html                  # Simple OAuth PKCE test
├── doc.md                          # Core concepts (Japanese)
├── implementation.md               # Implementation details (Japanese)
├── setup-guide.md                  # OAuth App setup guide (Japanese)
└── README.md                       # This file
```

## Security Notes

- Personal Access Tokens should have minimal required scopes
- Gists are deleted immediately after OAuth result retrieval  
- Request IDs provide randomness for security
- No client secrets required (PKCE flow)

## Troubleshooting

### Workflow not triggered
```bash
# Check repository_dispatch permissions
gh api repos/owner/repo/dispatches --method POST --field event_type=test
```

### Gist creation failed
```bash
# Check gist permissions
gh auth status
```

### Timeout errors
- Check GitHub Actions queue status
- Adjust polling interval (currently 1s)
- Check workflow logs in Actions tab