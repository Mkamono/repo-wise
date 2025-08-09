# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Repository Viewer - A Go web application that displays GitHub repositories and local knowledge documents using Device Flow authentication.

**Key Features:**
- GitHub Device Flow authentication (no Client Secret required)
- Single binary deployment with embedded HTML template
- Web interface for repository browsing
- Local knowledge document viewer from `knowledge/` directory
- Support for both public and private repositories

## Development Commands

### Environment Setup
Client ID is embedded in the application (`Ov23li47XYtQ5ucc3uAf`), but can be overridden:
```bash
export GITHUB_CLIENT_ID="your_client_id_here"  # Optional override
export PORT="8080"  # Optional port change
```

### Running the Application
```bash
# Direct Go execution (primary method)
go run main.go

# Build binary
go build -o github-repo-viewer main.go

# Cross-platform builds
GOOS=darwin GOARCH=amd64 go build -o github-repo-viewer-mac main.go
GOOS=linux GOARCH=amd64 go build -o github-repo-viewer-linux main.go
GOOS=windows GOARCH=amd64 go build -o github-repo-viewer.exe main.go
```

### Dependencies
- Go 1.24.5+ required
- No external dependencies (uses only Go standard library)
- Module name: `github-oauth-viewer`

## Architecture

### Single-File Design
The entire application is contained in `main.go` (549 lines) with:
- Embedded HTML template (lines 88-260)
- HTTP handlers for authentication and API proxy
- GitHub Device Flow implementation
- Local document serving from `knowledge/` directory

### Core Components

1. **HTTP Server**: Serves embedded HTML and handles API requests
2. **Device Flow Authentication**: OAuth without Client Secret
3. **GitHub API Proxy**: Server-side calls to GitHub API
4. **In-memory Token Storage**: Access tokens stored only in memory
5. **Knowledge Document System**: Serves Markdown files from `knowledge/` directory

### HTTP Handlers
- `GET /` - Main page with embedded HTML template (homeHandler)
- `GET /auth/device` - Initiate Device Flow, returns JSON (deviceAuthHandler)
- `POST /auth/poll` - Poll for access token, JSON request/response (pollTokenHandler)
- `GET /repos` - Get user repositories JSON API (reposHandler)
- `GET /documents` - List knowledge documents (documentsHandler)
- `GET /document/{path}` - Serve individual knowledge document (documentHandler)
- `GET /logout` - Clear access token and redirect (logoutHandler)

### Key Data Structures
```go
type Config struct {
    ClientID string  // GitHub OAuth Client ID
    Port     string  // Server port
}

type Repository struct {
    Name        string `json:"name"`
    FullName    string `json:"full_name"`
    Description string `json:"description"`
    Private     bool   `json:"private"`
    HTMLURL     string `json:"html_url"`
}

type Document struct {
    Path         string    `json:"path"`
    Title        string    `json:"title"`
    RelativePath string    `json:"relative_path"`
    ModTime      time.Time `json:"mod_time"`
    Size         int64     `json:"size"`
    IsDir        bool      `json:"is_dir"`
}
```

### GitHub API Integration
- Fetches user info via `GET /user`
- Fetches repositories via `GET /user/repos?sort=updated&per_page=20`
- Uses `Authorization: token {access_token}` header
- Proper error handling for API rate limits

### Knowledge Document System
- Scans `knowledge/` directory for `.md` files
- Serves documents as plain text at `/document/{relativePath}`
- Security: Path validation prevents directory traversal
- File metadata displayed: title, path, modification time

## Authentication Flow (Device Flow)

1. **Device Code Request**: App requests device/user codes from GitHub
2. **User Code Display**: Shows user code (e.g., `WDJB-MJHT`) and verification URL
3. **User Authorization**: User visits GitHub, enters code, authorizes app
4. **Token Polling**: App polls GitHub for access token with exponential backoff
5. **API Access**: Use access token for GitHub API calls

Critical implementation details:
- Uses GitHub's recommended polling interval from device code response
- Maximum 60 polling attempts (10 minutes timeout)
- Handles `authorization_pending` and `slow_down` responses appropriately
- JavaScript-based polling on frontend with status updates

## Security Considerations

- **No Client Secret**: Device Flow eliminates secret storage/exposure risk
- **Server-side tokens**: Access tokens never transmitted to browser
- **Memory-only storage**: Tokens lost on restart (no persistence)
- **Direct GitHub auth**: Users authenticate directly with GitHub
- **Path validation**: Knowledge document serving prevents directory traversal
- **No callback vulnerabilities**: No redirect URI validation needed

## Testing and Development Notes

- Device Flow requires manual user interaction (cannot be fully automated)
- Testing requires valid GitHub OAuth App and network connectivity
- Application starts immediately with embedded Client ID
- Knowledge documents can be added to `knowledge/` directory without restart
- Japanese interface text (easily modifiable in embedded template)

## File Structure Context
```
/
├── main.go              # Single-file application (549 lines)
├── go.mod              # Module definition (Go 1.24.5)
├── README.md           # User documentation
├── setup-guide.md      # Detailed setup instructions
├── CLAUDE.md           # This file
└── knowledge/          # Directory for Markdown documents (optional)
```