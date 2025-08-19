package local

import (
	"backend/handler"
	"context"
	"os"
)

var _ handler.DocumentContentProvider = (*local)(nil)

func (p *local) GetDocumentContent(ctx context.Context, path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}