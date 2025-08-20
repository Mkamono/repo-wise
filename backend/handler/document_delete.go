package handler

import (
	"backend/domain"
	"context"
	"fmt"
	"os"

	"github.com/danielgtaylor/huma/v2"
)

type DocumentDeleteProvider interface {
	Match(kind domain.RepoKind) bool
	DeleteDocument(ctx context.Context, path string) error
}

type DeleteDocumentInput struct {
	Body struct {
		Path string `json:"path" example:"/home/user/document.md" doc:"Absolute path of the document to delete"`
		Kind string `json:"kind" example:"local" doc:"Kind of document source (e.g., 'local', 'github')"`
	}
}

type DeleteDocumentOutput struct {
	Body struct {
		Path    string `json:"path" example:"/home/user/document.md" doc:"Deleted document path"`
		Success bool   `json:"success" doc:"Whether the document was deleted successfully"`
	}
}

func NewDocumentDeleteHandler(api huma.API, providers []DocumentDeleteProvider) {
	huma.Delete(api, "/document", func(ctx context.Context, input *DeleteDocumentInput) (*DeleteDocumentOutput, error) {
		kind, err := domain.ParseRepoKind(input.Body.Kind)
		if err != nil {
			return nil, err
		}

		var provider DocumentDeleteProvider
		for _, p := range providers {
			if p.Match(kind) {
				provider = p
				break
			}
		}
		if provider == nil {
			return nil, fmt.Errorf("no provider found for kind: %s", input.Body.Kind)
		}

		// Check if file exists
		if _, err := os.Stat(input.Body.Path); os.IsNotExist(err) {
			return nil, huma.Error404NotFound("File does not exist", nil)
		}

		err = provider.DeleteDocument(ctx, input.Body.Path)
		if err != nil {
			return nil, huma.Error500InternalServerError("Failed to delete document", err)
		}

		resp := &DeleteDocumentOutput{}
		resp.Body.Path = input.Body.Path
		resp.Body.Success = true

		return resp, nil
	})
}