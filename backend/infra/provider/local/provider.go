package local

import (
	"backend/domain"
	"backend/handler"
	"context"
	"os"
)

type local struct {
}

func NewLocalProvider() (*local, error) {
	return &local{}, nil
}

func (p *local) Match(kind domain.RepoKind) bool {
	return kind == domain.LocalRepoKind
}

var _ handler.DocumentCreateProvider = (*local)(nil)
var _ handler.DocumentDeleteProvider = (*local)(nil)

func (p *local) CreateDocument(ctx context.Context, path string) error {
	return os.WriteFile(path, []byte(""), 0644)
}

func (p *local) DeleteDocument(ctx context.Context, path string) error {
	return os.Remove(path)
}
