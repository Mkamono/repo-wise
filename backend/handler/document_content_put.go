package handler

import (
	"backend/domain"
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

type DocumentContentUpdateProvider interface {
	Match(kind domain.RepoKind) bool
	UpdateDocumentContent(ctx context.Context, path string, content string) error
}

type UpdateDocumentContentInput struct {
	Path string `query:"path" example:"/home/user/document.md" doc:"Absolute path to the document"`
	Kind string `query:"kind" example:"local" doc:"Kind of document source (e.g., 'local', 'github')"`
	Body struct {
		Content string `json:"content" doc:"New content for the document"`
	}
}

type UpdateDocumentContentOutput struct {
	Body struct {
		Path    string `json:"path" example:"/home/user/document.md" doc:"Document path"`
		Success bool   `json:"success" doc:"Whether the update was successful"`
		Message string `json:"message" doc:"Success or error message"`
	}
}

func NewDocumentContentUpdateHandler(api huma.API, providers []DocumentContentUpdateProvider) {
	huma.Put(api, "/document/content", func(ctx context.Context, input *UpdateDocumentContentInput) (*UpdateDocumentContentOutput, error) {
		kind, err := domain.ParseRepoKind(input.Kind)
		if err != nil {
			return nil, err
		}

		var provider DocumentContentUpdateProvider
		for _, p := range providers {
			if p.Match(kind) {
				provider = p
				break
			}
		}
		if provider == nil {
			return nil, fmt.Errorf("no provider found for kind: %s", input.Kind)
		}

		err = provider.UpdateDocumentContent(ctx, input.Path, input.Body.Content)
		if err != nil {
			return nil, huma.Error400BadRequest("Failed to update document content", err)
		}

		resp := &UpdateDocumentContentOutput{}
		resp.Body.Path = input.Path
		resp.Body.Success = true
		resp.Body.Message = "Document updated successfully"

		return resp, nil
	})
}