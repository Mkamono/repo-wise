# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains documentation and prototypes for building a team-oriented document management application with AI-first design. The project focuses on:

- **AI-first document management** - Using AI to automatically categorize, organize, and maintain documentation
- **GitHub as backend** - Leveraging GitHub API, repositories, and Issues for data storage and workflow management
- **Client-side OAuth authentication** - PKCE (Proof Key for Code Exchange) flow for secure GitHub authentication without server-side components

## Architecture

### Core Components

1. **Document Storage**: Markdown files in GitHub repositories with YAML frontmatter for metadata
2. **Authentication**: GitHub OAuth with PKCE for client-side authentication
3. **GitHub Actions Integration**: Minimal proxy for OAuth token exchange using GitHub Actions and Gists
4. **Quality Management**: GitHub Issues as notification queue for document maintenance tasks

### File Structure

```
/
├── doc.md                    # Core concept and design philosophy
├── implementation.md         # Technical implementation details and architecture decisions
├── setup-guide.md           # GitHub OAuth App setup instructions
├── pkce-test.html           # OAuth PKCE authentication testing interface
└── github-action-minimal/   # Minimal GitHub Actions OAuth proxy
    ├── README.md            # Japanese documentation for minimal proxy approach
    ├── minimal-oauth-client.js  # OAuth client with GitHub Actions dispatch
    └── usage-example.html   # Example usage of the OAuth client
```

## Key Design Patterns

### Document Structure
Documents use YAML frontmatter for metadata:
```yaml
---
title: "Document Title"
type: "decision-log" | "requirements" | "research"
created: "YYYY-MM-DD"
summary: "Brief summary for AI categorization"
tags: ["tag1", "tag2"]
---
```

### File Naming Convention
- `decision-logs/YYYY-MM-DD_project-name_topic.md`
- `requirements/YYYY-MM-DD_feature-name_requirements.md`
- `research/YYYY-MM-DD_topic_research-report.md`

### GitHub Integration
- **Issues as Tasks**: Quality check notifications are GitHub Issues with labels like `doc-quality-check`
- **API-first**: All operations use GitHub API for repository interaction
- **Actions Dispatch**: `repository_dispatch` events trigger minimal OAuth proxy workflows

## Authentication Flow

The project implements GitHub OAuth with PKCE:

1. Generate `code_verifier` (random string) and `code_challenge` (SHA256 hash)
2. Redirect to GitHub OAuth with `code_challenge`
3. Exchange authorization `code` + `code_verifier` for access token
4. Use access token for GitHub API calls

## Testing OAuth Integration

To test the OAuth flow:
1. Open `pkce-test.html` in browser
2. Create GitHub OAuth App with appropriate callback URLs
3. Enter Client ID and test authentication
4. Use "GitHub API テスト" to verify token functionality

## GitHub Actions Minimal Proxy

The `github-action-minimal/` contains a ultra-fast OAuth proxy using GitHub Actions:
- Reduces OAuth exchange time from 30-60s (full CI) to 5-10s
- Uses `repository_dispatch` + Gists for result storage
- No dependencies - just curl and gh commands
- Requires Personal Access Token with `repo` and `gist` scopes

## Development Notes

- All text content is in Japanese
- No build system or package.json - pure HTML/JS/CSS
- Client-side only implementation (no server required)
- GitHub Pages compatible
- Security: Gists are deleted immediately after OAuth result retrieval