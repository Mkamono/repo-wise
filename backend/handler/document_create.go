package handler

import (
	"backend/domain"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/danielgtaylor/huma/v2"
)

type DocumentCreateProvider interface {
	Match(kind domain.RepoKind) bool
	CreateDocument(ctx context.Context, path string) error
}

type CreateDocumentInput struct {
	Body struct {
		Path string `json:"path" example:"/home/user/new-document.md" doc:"Absolute path for the new document (must end with .md)"`
		Kind string `json:"kind" example:"local" doc:"Kind of document source (e.g., 'local', 'github')"`
	}
}

type CreateDocumentOutput struct {
	Body struct {
		Path    string `json:"path" example:"/home/user/new-document.md" doc:"Created document path"`
		Success bool   `json:"success" doc:"Whether the document was created successfully"`
	}
}

func NewDocumentCreateHandler(api huma.API, providers []DocumentCreateProvider) {
	huma.Post(api, "/document", func(ctx context.Context, input *CreateDocumentInput) (*CreateDocumentOutput, error) {
		// Validate that the file extension is .md
		if !strings.HasSuffix(input.Body.Path, ".md") {
			return nil, huma.Error400BadRequest("File must have .md extension", nil)
		}

		kind, err := domain.ParseRepoKind(input.Body.Kind)
		if err != nil {
			return nil, err
		}

		var provider DocumentCreateProvider
		for _, p := range providers {
			if p.Match(kind) {
				provider = p
				break
			}
		}
		if provider == nil {
			return nil, fmt.Errorf("no provider found for kind: %s", input.Body.Kind)
		}

		// Check if file already exists
		if _, err := os.Stat(input.Body.Path); err == nil {
			return nil, huma.Error400BadRequest("File already exists", nil)
		}

		// Create directory if it doesn't exist
		dir := filepath.Dir(input.Body.Path)
		if err := os.MkdirAll(dir, 0755); err != nil {
			return nil, huma.Error500InternalServerError("Failed to create directory", err)
		}

		err = provider.CreateDocument(ctx, input.Body.Path)
		if err != nil {
			return nil, huma.Error500InternalServerError("Failed to create document", err)
		}

		resp := &CreateDocumentOutput{}
		resp.Body.Path = input.Body.Path
		resp.Body.Success = true

		return resp, nil
	})
}