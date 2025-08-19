package local

import (
	"context"
	"os"

	"github.com/danielgtaylor/huma/v2"
)

type DirectoryInput struct {
	Path string `query:"path" example:"/home/user" doc:"Absolute path to directory"`
}

type FileInfo struct {
	Name  string `json:"name" example:"file.txt" doc:"File or directory name"`
	IsDir bool   `json:"is_dir" example:"false" doc:"Whether this is a directory"`
}

type DirectoryOutput struct {
	Body struct {
		Path  string     `json:"path" example:"/home/user" doc:"Searched directory path"`
		Items []FileInfo `json:"items" doc:"Files and directories in the path"`
	}
}

func NewDirectoryHandler(api huma.API) {
	huma.Get(api, "/directory", func(ctx context.Context, input *DirectoryInput) (*DirectoryOutput, error) {
		resp := &DirectoryOutput{}
		resp.Body.Path = input.Path

		entries, err := os.ReadDir(input.Path)
		if err != nil {
			return nil, huma.Error400BadRequest("Failed to read directory", err)
		}

		resp.Body.Items = make([]FileInfo, 0, len(entries))
		for _, entry := range entries {
			resp.Body.Items = append(resp.Body.Items, FileInfo{
				Name:  entry.Name(),
				IsDir: entry.IsDir(),
			})
		}

		return resp, nil
	})
}
