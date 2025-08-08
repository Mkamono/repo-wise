// 最小限のGitHub Actions OAuth プロキシクライアント

class MinimalGitHubOAuth {
    constructor(owner, repo, token) {
        this.owner = owner;
        this.repo = repo;
        this.token = token;
        this.baseUrl = 'https://api.github.com';
    }

    async exchangeCodeForToken(clientId, code, codeVerifier) {
        const resultId = `oauth_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        try {
            // 1. 最小限のプロキシワークフローを起動
            await this.dispatchMinimalProxy(resultId, clientId, code, codeVerifier);
            
            // 2. 結果を高速ポーリング
            return await this.waitForResult(resultId, 15000); // 15秒タイムアウト
            
        } catch (error) {
            throw new Error(`OAuth failed: ${error.message}`);
        }
    }

    async dispatchMinimalProxy(resultId, clientId, code, codeVerifier) {
        console.log(`Dispatching OAuth exchange for result ID: ${resultId}`);
        
        const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/dispatches`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                event_type: 'oauth_exchange',
                client_payload: {
                    result_id: resultId,
                    client_id: clientId,
                    code: code,
                    code_verifier: codeVerifier
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Dispatch failed: ${response.status} - ${errorText}`);
        }
        
        console.log('Dispatch successful, waiting for workflow...');
    }

    async waitForResult(resultId, timeoutMs) {
        const startTime = Date.now();
        const pollInterval = 1000; // 1秒間隔でポーリング
        
        console.log(`Polling for result ${resultId}...`);
        
        while (Date.now() - startTime < timeoutMs) {
            const result = await this.checkResult(resultId);
            if (result) {
                console.log('OAuth result received');
                return result;
            }
            
            const elapsed = Math.round((Date.now() - startTime) / 1000);
            console.log(`Still waiting... (${elapsed}s elapsed)`);
            
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
        
        throw new Error(`Timeout waiting for OAuth result (${resultId})`);
    }

    async checkResult(resultId) {
        try {
            // ユーザーのGistから結果を検索
            const response = await fetch(`${this.baseUrl}/users/${this.owner}/gists`, {
                headers: {
                    'Authorization': `token ${this.token}`
                }
            });

            if (!response.ok) {
                console.log(`Gist fetch failed: ${response.status}`);
                return null;
            }

            const gists = await response.json();
            const resultGist = gists.find(gist => gist.description === resultId);
            
            if (!resultGist) {
                console.log(`No gist found with description: ${resultId}`);
                return null;
            }
            
            console.log(`Found result gist: ${resultGist.id}`);

            // Gist内容を取得
            const gistResponse = await fetch(resultGist.url, {
                headers: { 'Authorization': `token ${this.token}` }
            });
            
            if (!gistResponse.ok) return null;

            const gistData = await gistResponse.json();
            const content = Object.values(gistData.files)[0]?.content;
            
            if (content) {
                // 結果取得後即座に削除
                await this.deleteGist(resultGist.id);
                return JSON.parse(content);
            }
            
            return null;
            
        } catch (error) {
            return null;
        }
    }

    async deleteGist(gistId) {
        try {
            await fetch(`${this.baseUrl}/gists/${gistId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `token ${this.token}` }
            });
        } catch (error) {
            // 削除失敗は無視
        }
    }
}

// HTMLで直接使用するためのグローバル関数
async function exchangeViaMinimalProxy(clientId, code, codeVerifier) {
    const oauth = new MinimalGitHubOAuth(
        window.GITHUB_OWNER || 'YOUR_USERNAME',
        window.GITHUB_REPO || 'YOUR_REPO', 
        localStorage.getItem('github_token') || window.GITHUB_TOKEN
    );
    
    return await oauth.exchangeCodeForToken(clientId, code, codeVerifier);
}

// モジュールとしてもエクスポート
if (typeof module !== 'undefined') {
    module.exports = MinimalGitHubOAuth;
}