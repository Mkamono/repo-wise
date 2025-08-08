package main

import (
	"encoding/json"
	"fmt"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Config struct {
	ClientID string
	Port     string
}

type Repository struct {
	Name        string `json:"name"`
	FullName    string `json:"full_name"`
	Description string `json:"description"`
	Private     bool   `json:"private"`
	HTMLURL     string `json:"html_url"`
}

type User struct {
	Login     string `json:"login"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url"`
}

type DeviceCodeResponse struct {
	DeviceCode      string `json:"device_code"`
	UserCode        string `json:"user_code"`
	VerificationURI string `json:"verification_uri"`
	ExpiresIn       int    `json:"expires_in"`
	Interval        int    `json:"interval"`
}

type DeviceTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Scope       string `json:"scope"`
	Error       string `json:"error"`
}

type Document struct {
	Path         string    `json:"path"`
	Title        string    `json:"title"`
	RelativePath string    `json:"relative_path"`
	ModTime      time.Time `json:"mod_time"`
	Size         int64     `json:"size"`
	IsDir        bool      `json:"is_dir"`
}

var config Config
var accessToken string

func main() {
	// 設定を初期化
	config = Config{
		ClientID: "Ov23li47XYtQ5ucc3uAf", // GitHub OAuth App Client ID (public)
		Port:     getEnv("PORT", "8080"),
	}

	// ルート設定
	http.HandleFunc("/", homeHandler)
	http.HandleFunc("/auth/device", deviceAuthHandler)
	http.HandleFunc("/auth/poll", pollTokenHandler)
	http.HandleFunc("/repos", reposHandler)
	http.HandleFunc("/documents", documentsHandler)
	http.HandleFunc("/document/", documentHandler)
	http.HandleFunc("/logout", logoutHandler)

	fmt.Printf("🚀 GitHub Repository Viewer starting on http://localhost:%s\n", config.Port)
	fmt.Printf("📱 Client ID: %s\n", config.ClientID)
	fmt.Printf("🔒 Authentication: GitHub Device Flow\n")
	fmt.Printf("✨ Ready to use - no configuration needed!\n")
	
	log.Fatal(http.ListenAndServe(":"+config.Port, nil))
}

func homeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl := `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>GitHub Repository Viewer</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { border: 1px solid #ddd; padding: 20px; border-radius: 8px; margin: 20px 0; }
        button { background: #238636; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 16px; }
        button:hover { background: #2ea043; }
        .repo-list { display: grid; gap: 15px; margin-top: 20px; }
        .repo-item { border: 1px solid #d1d9e0; padding: 15px; border-radius: 6px; }
        .repo-name { font-weight: bold; color: #0969da; margin-bottom: 5px; }
        .repo-desc { color: #656d76; margin-bottom: 10px; }
        .repo-private { background: #fff8c5; color: #9a6700; padding: 2px 6px; border-radius: 3px; font-size: 12px; }
        .user-info { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .avatar { width: 40px; height: 40px; border-radius: 20px; }
        .device-auth { text-align: center; padding: 20px; background: #f6f8fa; border-radius: 6px; margin: 20px 0; }
        .user-code { font-size: 24px; font-weight: bold; color: #0969da; margin: 15px 0; letter-spacing: 2px; }
        .auth-url { color: #0969da; text-decoration: none; font-weight: bold; }
        .polling { color: #656d76; margin-top: 15px; }
        #pollStatus { margin-top: 10px; font-weight: bold; }
        .success { color: #1a7f37; }
        .error { color: #cf222e; }
    </style>
</head>
<body>
    <h1>GitHub Repository Viewer</h1>
    
    {{if .IsAuthenticated}}
        <div class="container">
            <div class="user-info">
                <img src="{{.User.AvatarURL}}" alt="Avatar" class="avatar">
                <div>
                    <strong>{{.User.Name}}</strong> ({{.User.Login}})
                    <br>
                    <a href="/logout">ログアウト</a>
                </div>
            </div>
            
            <h3>リポジトリ一覧</h3>
            <div class="repo-list">
                {{range .Repositories}}
                <div class="repo-item">
                    <div class="repo-name">
                        <a href="{{.HTMLURL}}" target="_blank">{{.FullName}}</a>
                        {{if .Private}}<span class="repo-private">Private</span>{{end}}
                    </div>
                    {{if .Description}}
                    <div class="repo-desc">{{.Description}}</div>
                    {{end}}
                </div>
                {{end}}
            </div>
        </div>
        
        <div class="container">
            <h3>📚 Knowledge Documents</h3>
            <div class="repo-list">
                {{range .Documents}}
                <div class="repo-item">
                    <div class="repo-name">
                        <a href="/document/{{.RelativePath}}">{{.Title}}</a>
                    </div>
                    <div class="repo-desc">{{.RelativePath}} - {{.ModTime.Format "2006-01-02 15:04"}}</div>
                </div>
                {{end}}
            </div>
        </div>
    {{else}}
        <div class="container">
            <h3>GitHub Device Flow認証</h3>
            <p>GitHubリポジトリを表示するには、まずGitHub認証を行ってください。</p>
            <button onclick="startDeviceAuth()">GitHubで認証開始</button>
            
            <div id="deviceAuthSection" style="display: none;" class="device-auth">
                <h4>GitHub認証手順</h4>
                <p>1. 以下のリンクをクリックして、GitHubの認証ページを開いてください：</p>
                <p><a id="authUrl" href="" target="_blank" class="auth-url">GitHub認証ページを開く</a></p>
                <p>2. 以下のコードを入力してください：</p>
                <div id="userCode" class="user-code"></div>
                <div class="polling">認証完了を待機中...</div>
                <div id="pollStatus"></div>
            </div>
        </div>
        
        <div class="container">
            <h3>設定方法</h3>
            <p><strong>GitHub OAuth App設定 (Device Flow):</strong></p>
            <ol>
                <li>GitHub Settings → Developer settings → OAuth Apps → New OAuth App</li>
                <li>Application name: GitHub Repository Viewer</li>
                <li>Homepage URL: <code>http://localhost:{{.Port}}</code></li>
                <li>Authorization callback URL: 空欄でOK（Device Flowでは不要）</li>
            </ol>
            <p><strong>環境変数設定:</strong></p>
            <pre>export GITHUB_CLIENT_ID="your_client_id"</pre>
            <p><small>※ Client Secret は不要です</small></p>
        </div>
    {{end}}

    <script>
    async function startDeviceAuth() {
        try {
            const response = await fetch('/auth/device');
            const data = await response.json();
            
            if (data.error) {
                document.getElementById('pollStatus').innerHTML = '<span class="error">エラー: ' + data.error + '</span>';
                return;
            }
            
            // UI更新
            document.getElementById('deviceAuthSection').style.display = 'block';
            document.getElementById('userCode').textContent = data.user_code;
            document.getElementById('authUrl').href = data.verification_uri;
            
            // ポーリング開始（GitHubが指定した間隔を使用）
            console.log('Starting polling with GitHub specified interval:', data.interval + 's');
            pollForToken(data.device_code, data.interval);
            
        } catch (error) {
            document.getElementById('pollStatus').innerHTML = '<span class="error">通信エラー: ' + error.message + '</span>';
        }
    }

    async function pollForToken(deviceCode, interval) {
        const maxAttempts = 60; // 最大60回（約10分）
        let attempts = 0;
        
        const poll = async () => {
            try {
                attempts++;
                console.log('Polling attempt:', attempts, 'Device code:', deviceCode);
                const response = await fetch('/auth/poll', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ device_code: deviceCode })
                });
                
                const result = await response.json();
                console.log('Poll result:', result);
                
                if (result.success) {
                    document.getElementById('pollStatus').innerHTML = '<span class="success">認証成功！ページを再読み込みします...</span>';
                    setTimeout(() => location.reload(), 1000);
                    return;
                }
                
                if (result.error && (result.error.includes('authorization_pending') || result.error.includes('slow_down'))) {
                    document.getElementById('pollStatus').textContent = '認証待機中... (' + attempts + '/' + maxAttempts + ')';
                    if (attempts < maxAttempts) {
                        console.log('Scheduling next poll in', interval, 'seconds');
                        setTimeout(poll, interval * 1000);
                    } else {
                        document.getElementById('pollStatus').innerHTML = '<span class="error">タイムアウト：認証に時間がかかりすぎました</span>';
                    }
                } else if (result.error) {
                    console.log('Unexpected error:', result.error);
                    document.getElementById('pollStatus').innerHTML = '<span class="error">認証エラー: ' + result.error + '</span>';
                }
                
            } catch (error) {
                document.getElementById('pollStatus').innerHTML = '<span class="error">ポーリングエラー: ' + error.message + '</span>';
            }
        };
        
        // 最初のポーリング
        setTimeout(poll, interval * 1000);
    }
    </script>
</body>
</html>`

	t, _ := template.New("home").Parse(tmpl)
	
	data := struct {
		IsAuthenticated bool
		User            *User
		Repositories    []Repository
		Documents       []Document
		Port            string
	}{
		IsAuthenticated: accessToken != "",
		Port:            config.Port,
	}

	if accessToken != "" {
		// ユーザー情報を取得
		if user, err := fetchUser(); err == nil {
			data.User = user
		}
		
		// リポジトリ一覧を取得
		if repos, err := fetchRepositories(); err == nil {
			data.Repositories = repos
		}
	}

	// ドキュメント一覧を取得（認証状態に関係なく表示）
	if docs, err := fetchDocuments(); err == nil {
		data.Documents = docs
	}

	t.Execute(w, data)
}

func deviceAuthHandler(w http.ResponseWriter, r *http.Request) {
	deviceCode, err := requestDeviceCode()
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deviceCode)
}

func pollTokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		DeviceCode string `json:"device_code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	token, err := pollDeviceToken(req.DeviceCode)
	w.Header().Set("Content-Type", "application/json")

	if err != nil {
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	if token != "" {
		accessToken = token
		json.NewEncoder(w).Encode(map[string]bool{"success": true})
	} else {
		json.NewEncoder(w).Encode(map[string]string{"error": "authorization_pending"})
	}
}

func reposHandler(w http.ResponseWriter, r *http.Request) {
	if accessToken == "" {
		http.Error(w, "認証が必要です", http.StatusUnauthorized)
		return
	}

	repos, err := fetchRepositories()
	if err != nil {
		http.Error(w, "リポジトリ取得エラー: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(repos)
}

func documentsHandler(w http.ResponseWriter, r *http.Request) {
	documents, err := fetchDocuments()
	if err != nil {
		http.Error(w, "ドキュメント取得エラー: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(documents)
}

func documentHandler(w http.ResponseWriter, r *http.Request) {
	// URLから相対パスを取得
	relativePath := strings.TrimPrefix(r.URL.Path, "/document/")
	filePath := filepath.Join("knowledge", relativePath)
	
	// ファイルの存在確認とセキュリティチェック
	if !strings.HasPrefix(filePath, "knowledge/") {
		http.Error(w, "無効なパスです", http.StatusBadRequest)
		return
	}
	
	content, err := os.ReadFile(filePath)
	if err != nil {
		http.Error(w, "ファイルが見つかりません", http.StatusNotFound)
		return
	}
	
	// Markdownファイルをプレーンテキストとして表示
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Write(content)
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	accessToken = ""
	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}

func requestDeviceCode() (*DeviceCodeResponse, error) {
	data := url.Values{}
	data.Set("client_id", config.ClientID)
	data.Set("scope", "repo user")

	req, err := http.NewRequest("POST", "https://github.com/login/device/code", strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result DeviceCodeResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return &result, nil
}

func pollDeviceToken(deviceCode string) (string, error) {
	data := url.Values{}
	data.Set("client_id", config.ClientID)
	data.Set("device_code", deviceCode)
	data.Set("grant_type", "urn:ietf:params:oauth:grant-type:device_code")

	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result DeviceTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.Error != "" {
		return "", fmt.Errorf("device token error: %s", result.Error)
	}

	return result.AccessToken, nil
}

func fetchUser() (*User, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "token "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var user User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

func fetchRepositories() ([]Repository, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=20", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "token "+accessToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var repos []Repository
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, err
	}

	return repos, nil
}

func fetchDocuments() ([]Document, error) {
	var documents []Document
	knowledgeDir := "knowledge"
	
	err := filepath.WalkDir(knowledgeDir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		
		// .mdファイルのみ処理
		if !d.IsDir() && strings.HasSuffix(path, ".md") {
			info, err := d.Info()
			if err != nil {
				return err
			}
			
			// 相対パスを取得（knowledge/ を除く）
			relativePath, err := filepath.Rel(knowledgeDir, path)
			if err != nil {
				return err
			}
			
			// ファイル名から拡張子を除いたものをタイトルとする
			title := strings.TrimSuffix(filepath.Base(path), ".md")
			
			document := Document{
				Path:         path,
				Title:        title,
				RelativePath: relativePath,
				ModTime:      info.ModTime(),
				Size:         info.Size(),
				IsDir:        false,
			}
			
			documents = append(documents, document)
		}
		
		return nil
	})
	
	return documents, err
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}