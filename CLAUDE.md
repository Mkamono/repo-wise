# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Repository Viewer - A simple Go web application for viewing GitHub repositories using Device Flow authentication.

**Key Features:**
- GitHub Device Flow authentication (no Client Secret required)
- Single binary deployment  
- Web interface for repository browsing
- Support for both public and private repositories

## Architecture

### Core Components

1. **Go HTTP Server**: Serves web interface and handles API requests
2. **Device Flow Authentication**: GitHub OAuth without Client Secret
3. **GitHub API Proxy**: Server-side GitHub API calls
4. **In-memory Token Storage**: Access tokens stored in memory only

### File Structure

```
/
├── main.go              # Main Go application with embedded HTML
├── go.mod              # Go module definition
├── run.sh              # Convenience run script with validation
├── README.md           # Main documentation
├── CLAUDE.md           # This file
└── setup-guide.md      # Detailed setup instructions
```

## Authentication Flow (Device Flow)

GitHub Device Flow provides secure authentication without Client Secret:

1. **Device Code Request**: App requests device code from GitHub
2. **User Code Display**: App shows user code (e.g., `WDJB-MJHT`) and GitHub URL
3. **User Authorization**: User visits GitHub, enters code, and authorizes
4. **Token Polling**: App polls GitHub API for access token
5. **API Access**: Use access token for GitHub API calls

### Flow Diagram
```
App → GitHub: Request device code
App ← GitHub: Device code + User code + Verification URL
App → User: Display user code and GitHub URL
User → GitHub: Enter code and authorize
App → GitHub: Poll for access token (until success)
App ← GitHub: Access token
App → GitHub API: Use access token for repository data
```

## Development Commands

### Environment Setup
```bash
export GITHUB_CLIENT_ID="your_client_id_here"
```

### Running the Application
```bash
# Using run script (recommended)
./run.sh

# Direct Go execution
go run main.go

# Build binary
go build -o github-repo-viewer main.go
```

### GitHub OAuth App Configuration
- Go to: https://github.com/settings/developers
- Create OAuth App (not GitHub App)
- Application name: `Repository Viewer` (cannot start with "GitHub")  
- Homepage URL: `http://localhost:8080`
- Callback URL: `http://localhost:8080/callback` (required but not used)

## Key Implementation Details

### HTTP Handlers
- `GET /` - Main page with embedded HTML template
- `GET /auth/device` - Initiate Device Flow (returns JSON)
- `POST /auth/poll` - Poll for access token (JSON request/response)  
- `GET /repos` - Get user repositories (JSON API)
- `GET /logout` - Clear access token and redirect

### Template Variables
The main HTML template uses Go template variables:
- `{{.IsAuthenticated}}` - Boolean authentication status
- `{{.User}}` - User information struct
- `{{.Repositories}}` - Array of repository objects
- `{{.Port}}` - Server port for configuration display

### GitHub API Integration
- `GET /user` - Fetch authenticated user information
- `GET /user/repos` - Fetch user repositories (20 most recent)
- All API calls include `Authorization: token {access_token}` header
- Proper error handling for API rate limits and failures

## Security Considerations

- **No Client Secret**: Device Flow eliminates Client Secret storage/exposure
- **Server-side tokens**: Access tokens never sent to browser
- **Memory-only storage**: Tokens lost on restart (no persistent storage)
- **Direct GitHub authentication**: Users authenticate directly with GitHub
- **No callback vulnerabilities**: No redirect URI validation needed

## Troubleshooting

### Common Issues
- Missing `GITHUB_CLIENT_ID`: Run script will show clear error message
- Invalid Client ID: Device flow will fail with authentication error
- Network issues: Check GitHub API status and connectivity

### Build Issues
- Ensure Go 1.19+ is installed
- All dependencies are in standard library (no external deps)
- Cross-platform builds supported with GOOS/GOARCH

## Testing Notes

Device Flow testing requires:
1. Valid GitHub OAuth App with Client ID
2. Active network connection to GitHub
3. Web browser for user authentication
4. Manual authorization step (cannot be automated)

The polling mechanism has built-in timeout and retry logic with user feedback.