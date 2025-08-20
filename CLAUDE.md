# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack document management application that allows users to browse, edit, create, and delete markdown documents from local directories. The application provides a file explorer interface with directory navigation and an integrated text editor.

- **Backend**: Go-based REST API server using Huma v2 framework with Chi router
- **Frontend**: React SPA using TanStack Router and Vite

## Development Commands

### Frontend (from /frontend directory)
- `pnpm dev` - Start development server on port 3000
- `pnpm start` - Alternative to `pnpm dev`
- `pnpm build` - Build for production (runs vite build && tsc)
- `pnpm serve` - Preview production build locally
- `pnpm test` - Run Vitest tests
- `pnpm lint` - Run Biome linter only
- `pnpm format` - Format code with Biome only
- `pnpm check` - Run Biome check (lint + format combined)
- `pnpm orval` - Generate API client from backend OpenAPI spec

### Backend (from /backend directory)
- `go run main.go` - Start backend server on port 8070
- `go fmt ./...` - Format Go code
- `go vet ./...` - Run Go vet static analysis
- `go mod tidy` - Clean up dependencies
- `mise run backend` - Start backend server (alternative using mise task runner)

### Full Development Setup
1. Start backend: `cd backend && go run main.go` (or `mise run backend` from root)
2. Start frontend: `cd frontend && pnpm dev`
3. Backend API docs available at `http://localhost:8070/docs`
4. Frontend app available at `http://localhost:3000`

### Git Hooks (Lefthook)
Pre-commit hooks automatically run:
- Biome check --fix on frontend JS/TS files
- go fmt, go vet, go mod tidy on backend Go files

Pre-push hooks run:
- Frontend build validation

## Architecture

### Backend Architecture (Dependency Injection Pattern)
The backend uses a clean architecture with dependency injection:

- **Domain**: Core business entities (`Document`, `Kind`) representing documents and their metadata
- **Handler**: HTTP handlers implementing REST endpoints. Each handler type is injected with provider interfaces:
  - `DocumentsProvider` - List documents in directories
  - `DirectoryProvider` - Browse filesystem directories
  - `DocumentContentProvider` - Read document content
  - `DocumentContentUpdateProvider` - Update document content
  - `DocumentCreateProvider` - Create new documents
  - `DocumentDeleteProvider` - Delete documents
- **Infra/Provider/Local**: Concrete implementations of provider interfaces for local filesystem operations
- **Config**: Application configuration with different modes (`CLI`, `Native`) and config persistence
- **Middleware**: HTTP middleware (logging, CORS)

The main.go orchestrates dependency injection by creating providers and injecting them into handlers.

### Frontend Architecture (File-based Routing + Auto-generated API)
- **Routes**: File-based routing with TanStack Router in `src/routes/`
  - `__root.tsx` - Root layout with devtools
  - `index.tsx` - Landing/redirect page
  - `select-directory.tsx` - Directory selection UI
  - `browse.$path.tsx` - Document browser with file explorer and editor
- **Components**:
  - `Editor.tsx` - Document editor with delete functionality
  - `Header.tsx` - Navigation breadcrumbs and actions
  - `Sidebar.tsx` - File tree explorer with create/navigate actions
- **API Integration**: Auto-generated TypeScript client using Orval with SWR hooks for data fetching

### Key Technologies
- **Backend**: Go 1.24.5, Huma v2, Chi router, CBOR encoding
- **Frontend**: React 19, TypeScript, TanStack Router, Tailwind CSS 4, Vite, SWR for data fetching
- **Code Quality**: Biome for frontend linting/formatting, standard Go tools for backend
- **Development**: Mise for tool management, Lefthook for git hooks

### Application Flow
1. Users select a directory via `select-directory.tsx`
2. App navigates to `browse.$path.tsx` with the selected directory
3. Backend lists documents via local filesystem provider
4. Frontend displays file tree in Sidebar, selected document in Editor
5. CRUD operations flow through API → handlers → providers → filesystem

## API Integration

The frontend uses Orval to generate a typed API client from the backend's OpenAPI specification:
- Backend serves OpenAPI spec at `http://localhost:8070/openapi.yaml`
- Run `pnpm orval` from frontend directory to regenerate client after backend API changes
- Generated files are in `src/api/` with SWR hooks for data fetching
- Configuration in `orval.config.cjs` specifies split mode (separate model files)

### API Client Usage Pattern
```typescript
// Auto-generated hooks follow this pattern:
const { data, error, isLoading } = useGetDocuments({ path: "/some/path", kind: "local" });
const { trigger: createDoc } = usePostDocument();
const { trigger: deleteDoc } = useDeleteDocument();
```

## Environment Setup

The backend supports different app modes via `APP_MODE` environment variable:
- `CLI` (default): Command-line interface mode
- `Native`: Native application mode

Backend runs on port 8070 by default, with API docs available at `/docs`.

## Development Workflow

### Adding New API Endpoints
1. Add handler in `backend/handler/` following existing patterns
2. Register handler in `handler.go`
3. Add provider interface if needed
4. Implement provider in `infra/provider/local/`
5. Run `pnpm orval` in frontend to regenerate API client
6. Use generated hooks in React components

### UI Component Development
- Always add `cursor-pointer` class to clickable elements for better UX
- Follow existing patterns for file tree, navigation, and editor components
- Use SWR hooks for data fetching with loading/error states
- Implement confirmation dialogs for destructive actions (like delete)

## Testing

### Unit/Integration Testing
- Frontend uses Vitest with React Testing Library
- Run frontend tests with `pnpm test` from frontend directory

### Manual Testing with Playwright MCP

For UI testing and visual verification, use the Playwright MCP integration:

#### Setup and Navigation
```javascript
// Navigate to the application
await mcp__playwright__browser_navigate({ url: "http://localhost:3000" });

// Take full page screenshots for documentation
await mcp__playwright__browser_take_screenshot({
  filename: "feature-test.png",
  fullPage: true
});
```

#### Configuration Testing
Test different application states by modifying config via API:

```bash
# Check current config
curl -s http://localhost:8070/appconfig | jq .

# Update config for testing
curl -X PUT http://localhost:8070/appconfig \
  -H "Content-Type: application/json" \
  -d '{
    "LocalFile": {
      "Directories": ["/Users/test/Documents", "/tmp"]
    },
    "Github": {"AccessToken": "", "IgnoreRepos": null},
    "AppMode": {}
  }'
```

#### UI Interaction Testing
```javascript
// Test button clicks and navigation
await mcp__playwright__browser_click({
  element: "Quick Access button",
  ref: "button_ref"
});

// Take snapshots to verify state changes
await mcp__playwright__browser_snapshot();
```

#### Testing Workflow
1. **Baseline**: Test with empty/default config
2. **Configuration**: Add test data via API
3. **Interaction**: Test user flows with Playwright
4. **Verification**: Capture screenshots and verify behavior
5. **Cleanup**: Reset config if needed

This approach allows for comprehensive testing of different application states and user interactions.
- フロントエンドとバックエンドのサーバーは常にユーザーが起動しています
- フロントエンドを編集した際はpnpm orval, pnpm build, pnpm check --fixを実行してエラーがあれば修正し、pyalwritemcpを使って動作確認して下さい
