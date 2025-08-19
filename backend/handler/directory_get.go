package handler

import (
	"backend/domain"
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

type FileInfo struct {
	Name  string `json:"name" example:"file.txt" doc:"File or directory name"`
	IsDir bool   `json:"is_dir" example:"false" doc:"Whether this is a directory"`
}

type DirectoryProvider interface {
	Match(kind domain.RepoKind) bool
	GetDirectory(ctx context.Context, path string) ([]FileInfo, error)
}

type GetDirectoryInput struct {
	Path string `query:"path" example:"/home/user" doc:"Absolute path to directory"`
	Kind string `query:"kind" example:"local" doc:"Kind of directory source (e.g., 'local', 'github')"`
}

type GetDirectoryOutput struct {
	Body struct {
		Path  string     `json:"path" example:"/home/user" doc:"Searched directory path"`
		Items []FileInfo `json:"items" doc:"Files and directories in the path"`
	}
}

func newDirectoryHandler(api huma.API, providers []DirectoryProvider) {
	huma.Get(api, "/directory", func(ctx context.Context, input *GetDirectoryInput) (*GetDirectoryOutput, error) {
		kind, err := domain.ParseRepoKind(input.Kind)
		if err != nil {
			return nil, err
		}

		var provider DirectoryProvider
		for _, p := range providers {
			if p.Match(kind) {
				provider = p
				break
			}
		}
		if provider == nil {
			return nil, fmt.Errorf("no provider found for kind: %s", input.Kind)
		}

		items, err := provider.GetDirectory(ctx, input.Path)
		if err != nil {
			return nil, huma.Error400BadRequest("Failed to read directory", err)
		}

		resp := &GetDirectoryOutput{}
		resp.Body.Path = input.Path
		resp.Body.Items = items

		return resp, nil
	})
}
