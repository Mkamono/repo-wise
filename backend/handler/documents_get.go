package handler

import (
	"backend/domain"
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

type Documents struct {
	Documents []domain.Document `json:"documents"`
}

type DocumentsProvider interface {
	Match(kind domain.RepoKind) bool
	GetDocuments(ctx context.Context, path string, condition DocumentCondition) ([]domain.Document, error) // path配下に存在するドキュメントを取得する
}

type Condition struct {
	Exts     []string
	DirNames []string
}

type DocumentCondition struct {
	Includes Condition
	Excludes Condition
}

type GetDocumentsInput struct {
	Path string `query:"path" example:"/home/user" doc:"Absolute path to directory"`
	Kind string `query:"kind" example:"local" doc:"Kind of document source (e.g., 'local', 'github')"`
}

type GetDocumentsOutput struct {
	Body struct {
		Documents []domain.Document `json:"documents" doc:"List of documents found in the directory"`
	}
}

func newDocumentsHandler(api huma.API, providers []DocumentsProvider) {
	huma.Get(api, "/documents", func(ctx context.Context, input *GetDocumentsInput) (*GetDocumentsOutput, error) {
		kind, err := domain.ParseRepoKind(input.Kind)
		if err != nil {
			return nil, err
		}

		var provider DocumentsProvider
		for _, p := range providers {
			if p.Match(kind) {
				provider = p
				break
			}
		}
		if provider == nil {
			return nil, fmt.Errorf("no provider found for kind: %s", input.Kind)
		}

		condition := DocumentCondition{
			Includes: Condition{
				Exts:     []string{"md"},
				DirNames: []string{"*"},
			},
			Excludes: Condition{
				DirNames: []string{".git", "node_modules", ".Trash"},
			},
		}

		doc, err := provider.GetDocuments(ctx, input.Path, condition)
		if err != nil {
			return nil, err
		}
		return &GetDocumentsOutput{Body: struct {
			Documents []domain.Document `json:"documents" doc:"List of documents found in the directory"`
		}{Documents: doc}}, nil
	})
}
