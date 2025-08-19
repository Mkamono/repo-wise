package local

import (
	"backend/handler"
	"context"
	"os"
)

var _ handler.DirectoryProvider = (*local)(nil)

func (p *local) GetDirectory(ctx context.Context, path string) ([]handler.FileInfo, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}

	items := make([]handler.FileInfo, 0, len(entries))
	for _, entry := range entries {
		items = append(items, handler.FileInfo{
			Name:  entry.Name(),
			IsDir: entry.IsDir(),
		})
	}

	return items, nil
}
