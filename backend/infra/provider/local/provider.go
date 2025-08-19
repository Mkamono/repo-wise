package local

import (
	"backend/domain"
)

type local struct {
}

func NewLocalProvider() (*local, error) {
	return &local{}, nil
}

func (p *local) Match(kind domain.RepoKind) bool {
	return kind == domain.LocalRepoKind
}
