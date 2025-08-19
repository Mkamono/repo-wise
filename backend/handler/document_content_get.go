package handler

import (
	"backend/domain"
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

type DocumentContentProvider interface {
	Match(kind domain.RepoKind) bool
	GetDocumentContent(ctx context.Context, path string) (string, error)
}

type GetDocumentContentInput struct {
	Path string `query:"path" example:"/home/user/document.md" doc:"Absolute path to the document"`
	Kind string `query:"kind" example:"local" doc:"Kind of document source (e.g., 'local', 'github')"`
}

type GetDocumentContentOutput struct {
	Body struct {
		Path    string `json:"path" example:"/home/user/document.md" doc:"Document path"`
		Content string `json:"content" doc:"Document content"`
	}
}

func NewDocumentContentHandler(api huma.API, providers []DocumentContentProvider) {
	huma.Get(api, "/document/content", func(ctx context.Context, input *GetDocumentContentInput) (*GetDocumentContentOutput, error) {
		kind, err := domain.ParseRepoKind(input.Kind)
		if err != nil {
			return nil, err
		}

		var provider DocumentContentProvider
		for _, p := range providers {
			if p.Match(kind) {
				provider = p
				break
			}
		}
		if provider == nil {
			return nil, fmt.Errorf("no provider found for kind: %s", input.Kind)
		}

		content, err := provider.GetDocumentContent(ctx, input.Path)
		if err != nil {
			return nil, huma.Error400BadRequest("Failed to read document content", err)
		}

		resp := &GetDocumentContentOutput{}
		resp.Body.Path = input.Path
		resp.Body.Content = content

		return resp, nil
	})
}