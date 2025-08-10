# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Repository Viewer - A Go web application that displays GitHub repositories and local knowledge documents using GitHub Device Flow authentication.

**Key Features:**
- GitHub Device Flow authentication (no Client Secret required)
- Single binary deployment with embedded HTML template
- Web interface for repository browsing
- Local knowledge document viewer from `knowledge/` directory
- Support for both public and private repositories

## Development Commands

### Running the Application
```bash
# Direct Go execution (primary method)
go run main.go

# Build binary
go build -o repo-wise main.go

# Cross-platform builds
GOOS=darwin GOARCH=amd64 go build -o repo-wise-mac main.go
GOOS=linux GOARCH=amd64 go build -o repo-wise-linux main.go
GOOS=windows GOARCH=amd64 go build -o repo-wise.exe main.go
```

### Dependencies
- Go 1.24.5+ required
- External dependency: `github.com/danielgtaylor/huma/v2` (currently unused but imported in handler package)
- Module name: `repo-wise`

## Architecture

### Hybrid Architecture
The application combines a main monolithic structure with modular components:

**Main Application (main.go:543 lines):**
- Embedded HTML template (lines 81-253)
- HTTP handlers for authentication and API proxy
- GitHub Device Flow implementation 
- Local document serving from `knowledge/` directory

**Modular Components:**
- `src/config/config.go`: Configuration management with embedded defaults
- `src/handler/handler.go`: Huma v2 API handler setup (currently unused)
- `src/infra/github/client.go`: GitHub client infrastructure (empty stub)

### Core Components

1. **HTTP Server**: Standard library HTTP server with embedded HTML
2. **Device Flow Authentication**: GitHub OAuth without Client Secret
3. **GitHub API Proxy**: Server-side calls to GitHub API with token storage
4. **In-memory Token Storage**: Access tokens stored only in memory (global variable)
5. **Knowledge Document System**: File system-based Markdown serving

### Configuration System
Configuration is handled through the `src/config` package:
- **Default Client ID**: `Ov23li47XYtQ5ucc3uAf` (embedded in config)
- **Default Port**: `10238` (not 8080 as documented elsewhere)
- **Environment Override**: Not currently implemented for ClientID/Port

### HTTP Handlers (main.go)
- `GET /` - Main page with embedded HTML template (homeHandler:80)
- `GET /auth/device` - Initiate Device Flow, returns JSON (deviceAuthHandler:288)
- `POST /auth/poll` - Poll for access token, JSON request/response (pollTokenHandler:300)
- `GET /repos` - Get user repositories JSON API (reposHandler:331)
- `GET /documents` - List knowledge documents (documentsHandler:347)
- `GET /document/{path}` - Serve individual knowledge document (documentHandler:358)
- `GET /logout` - Clear access token and redirect (logoutHandler:380)

### Key Data Structures
```go
// Config (src/config/config.go)
type Config struct {
    ClientID string // GitHub OAuth Client ID (public)
    Port     int
}

// Main types (main.go)
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
- **User Info**: `GET /user` (fetchUser:446)
- **Repositories**: `GET /user/repos?sort=updated&per_page=20` (fetchRepositories:470)
- **Authentication**: Bearer token in Authorization header
- **Error Handling**: Basic JSON decoding error handling

### Knowledge Document System (fetchDocuments:494)
- Scans `knowledge/` directory recursively for `.md` files
- Serves documents as plain text at `/document/{relativePath}`
- Security: Path validation prevents directory traversal (line 364)
- Title extraction from filename (without .md extension)

## Authentication Flow (Device Flow)

**Implementation Functions:**
1. **Device Code Request** (requestDeviceCode:385): POST to `https://github.com/login/device/code`
2. **Token Polling** (pollDeviceToken:413): POST to `https://github.com/login/oauth/access_token`
3. **Frontend Polling** (JavaScript:207): Client-side polling with interval control

**Critical Implementation Details:**
- Uses GitHub's recommended polling interval from device code response
- Maximum 60 polling attempts (10 minutes timeout)
- Handles `authorization_pending` and `slow_down` responses appropriately
- JavaScript-based polling with status updates (lines 207-250)
- Access token stored in global variable `accessToken` (line 56)

## Development Workflow Considerations

**Current State:**
- Application is in transition from single-file to modular structure
- `src/handler/handler.go` contains Huma v2 setup but is not integrated with main.go
- `src/infra/github/client.go` is an empty stub waiting for implementation
- Configuration system is split between embedded defaults and external config package

**Architectural Inconsistencies:**
- Main application uses `cfg.Port` from config package but still calls `fmt.Sprintf("%d", cfg.Port)` (main.go:77)
- Default port mismatch between code (10238) and documentation (8080)
- Huma v2 dependency imported but not used in main application flow
- Environment variable override mentioned in docs but not implemented

## File Structure Context
```
/
├── main.go                    # Main application (543 lines)
├── go.mod                     # Module: repo-wise, Go 1.24.5
├── go.sum                     # Dependency checksums
├── src/
│   ├── config/
│   │   └── config.go          # Configuration with embedded defaults
│   ├── handler/
│   │   └── handler.go         # Huma v2 API setup (unused)
│   └── infra/
│       └── github/
│           └── client.go      # Empty GitHub client stub
├── knowledge/                 # Markdown documents directory
│   ├── example1.md
│   ├── example2.md
│   └── directory/
│       └── in-dir.md
├── README.md                  # User documentation
├── setup-guide.md             # Detailed setup instructions
├── doc.md                     # Design concepts
├── implementation.md          # Implementation notes
├── LICENSE                    # License file
└── CLAUDE.md                  # This file
```