# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Repository Viewer - A React web application that displays GitHub repositories and local knowledge documents. Currently in transition from Go backend to full React frontend.

**Key Features:**
- React 19 with TanStack Router for navigation
- TypeScript for type safety
- TailwindCSS v4 for styling
- Vite for build tooling and development server
- Biome for linting and formatting

## Development Commands

### Frontend Development (src/)
```bash
# Development server (port 3000)
pnpm dev

# Build production bundle
pnpm build

# Preview production build
pnpm serve

# Run tests
pnpm test

# Linting and formatting
pnpm lint
pnpm format
pnpm check
```

### Dependencies
- Node.js with pnpm package manager
- React 19 with modern concurrent features
- TanStack Router v1.130+ for client-side routing
- TypeScript 5.7+ for static typing
- Vite 6.3+ for build tooling

## Architecture

### Frontend Architecture
Modern React application built with contemporary tooling and patterns:

**Core Stack:**
- **React 19**: Latest stable version with concurrent features
- **TanStack Router**: File-based routing with type-safe navigation
- **TypeScript**: Strict type checking with modern ESNext modules
- **Vite**: Fast development server and optimized production builds
- **TailwindCSS v4**: Utility-first CSS framework with latest features

**Application Structure:**
- `src/main.tsx`: Application entry point with router setup
- `src/routes/__root.tsx`: Root layout component with header and outlet
- `src/routes/index.tsx`: Home page component (currently template)
- `src/components/Header.tsx`: Navigation header component
- `src/routeTree.gen.ts`: Auto-generated route tree (do not edit manually)

### Development Tooling

**Build Configuration (vite.config.ts):**
- Auto-generates routes with TanStack Router plugin
- React JSX transformation
- TailwindCSS integration via Vite plugin
- Path alias resolution (`@/` → `./src/`)
- Uses `path.resolve(process.cwd())` instead of `__dirname` for compatibility

**Code Quality (biome.json):**
- **Formatter**: Tab indentation, double quotes for JavaScript
- **Linter**: Recommended rules enabled
- **Import Organization**: Automatic import sorting
- **File Exclusions**: Ignores generated `routeTree.gen.ts`

**TypeScript Configuration:**
- **Target**: ES2022 with DOM libraries
- **Module Resolution**: Bundler mode for modern tooling
- **Strict Mode**: All strict checks enabled
- **Path Mapping**: `@/*` → `./src/*` for clean imports
- **Node Types**: Included for development utilities

### Key Patterns

**Route Definition Pattern:**
```typescript
// File-based routing in src/routes/
export const Route = createFileRoute('/')({
  component: ComponentName,
})
```

**Component Structure:**
- Functional components with TypeScript
- TanStack Router `Link` components for navigation
- TailwindCSS classes for styling
- Header component provides consistent navigation

### Build Process

**Development Server:**
- Port 3000 (configured in package.json)
- Hot module replacement via Vite
- TanStack Router devtools enabled in development

**Production Build:**
- `vite build` compiles React application
- `tsc` runs TypeScript type checking
- Route tree auto-generated before build
- Assets optimized and hashed for caching

### Migration Status

**Current State:**
- Go backend has been removed from the repository
- React frontend is functional but contains template content
- Knowledge document system from original Go app not yet implemented
- GitHub authentication flow needs to be reimplemented in React

## File Structure Context
```
/
├── src/                       # React application root
│   ├── src/                   # Source code
│   │   ├── main.tsx           # Application entry point
│   │   ├── routes/            # File-based routing
│   │   │   ├── __root.tsx     # Root layout with header
│   │   │   └── index.tsx      # Home page
│   │   ├── components/        # Reusable components
│   │   │   └── Header.tsx     # Navigation header
│   │   ├── routeTree.gen.ts   # Auto-generated (do not edit)
│   │   ├── styles.css         # Global styles
│   │   └── logo.svg           # React logo asset
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies and scripts
│   ├── vite.config.ts         # Vite build configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── biome.json             # Linter and formatter config
│   └── dist/                  # Production build output
├── knowledge/                 # Markdown documents directory
│   ├── example1.md
│   ├── example2.md
│   └── directory/
│       └── in-dir.md
├── README.md                  # User documentation
├── setup-guide.md             # Setup instructions
├── doc.md                     # Design concepts
├── implementation.md          # Implementation notes
├── LICENSE                    # License file
└── CLAUDE.md                  # This file
```

## Important Development Notes

### File Generation
- `src/src/routeTree.gen.ts` is auto-generated by TanStack Router plugin
- Never edit this file manually - it will be overwritten
- Routes are automatically discovered from `src/routes/` directory

### TypeScript Configuration
- Uses modern `"moduleResolution": "bundler"` for Vite compatibility
- Includes `@types/node` for build-time utilities like `process.cwd()`
- Path aliases configured for clean imports (`@/` → `./src/`)

### Working Directory
- When running commands, work from the `src/` directory
- All npm/pnpm commands should be run from `src/` not project root
- Development server runs on port 3000, not default Vite port 5173