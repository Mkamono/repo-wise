# GitHub Repository Viewer

Simple Go web application for viewing your GitHub repositories using GitHub Device Flow authentication.

## Features

- 🔒 **GitHub Device Flow authentication** (no Client Secret required!)
- 📦 **Single binary deployment**
- 🌐 **Clean web interface**
- 📚 **View your repository list** with descriptions
- 🔒 **Support for both public and private repositories**
- ⚡ **No callback URL setup needed**

## Quick Start

**🎉 No configuration needed! Client ID is embedded.**

### 1. Run the Application

```bash
go run main.go
```

**Or build a binary:**
```bash
go build -o github-repo-viewer main.go
./github-repo-viewer
```

### 2. Open in Browser

Visit http://localhost:8080 and click "GitHubで認証開始"

### 3. GitHub Device Flow Authentication

1. Click "GitHubで認証開始"
2. A user code will be displayed (例: `WDJB-MJHT`)
3. Click the link to open GitHub authentication page
4. Enter the user code on GitHub
5. Authorize the app
6. Return to the application - authentication will complete automatically!

## Configuration

**Client ID**: `Ov23li47XYtQ5ucc3uAf` (embedded)

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 8080 |

### Example

```bash
export PORT="3000"  # Optional: change port
go run main.go
```

## Architecture (Device Flow)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │ ←→ │   Go Server     │ ←→ │  GitHub API     │
│                 │    │                 │    │                 │
│ - Repository    │    │ - Device Code   │    │ - Device Flow   │
│   List Display  │    │   Request       │    │ - User Info     │  
│ - User Code     │    │ - Token Polling │    │ - Repositories  │
│   Display       │    │ - API Proxy     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              ↓
                    ┌─────────────────┐
                    │ GitHub Web UI   │
                    │                 │
                    │ - User enters   │
                    │   device code   │
                    │ - Authorization │
                    └─────────────────┘
```

## Files Structure

```
/
├── main.go              # Main Go application (Client ID embedded)
├── go.mod              # Go module definition
├── README.md           # This file
├── CLAUDE.md           # Claude Code guidance
├── setup-guide.md      # Detailed setup guide
├── doc.md              # Original design concepts  
├── implementation.md   # Implementation notes
└── LICENSE             # License file
```

## Development

### Build for different platforms

```bash
# macOS
GOOS=darwin GOARCH=amd64 go build -o github-repo-viewer-mac main.go

# Linux
GOOS=linux GOARCH=amd64 go build -o github-repo-viewer-linux main.go

# Windows  
GOOS=windows GOARCH=amd64 go build -o github-repo-viewer.exe main.go
```

## Security Notes

- **Device Flow**: No client secrets required or stored
- **Server-side token management**: Access tokens never exposed to browser
- **Memory-only storage**: Tokens are stored in memory only (lost on restart)
- **No callback vulnerabilities**: No redirect URI validation needed
- **User controls authorization**: Users authenticate directly with GitHub
- **HTTPS recommended** for production use