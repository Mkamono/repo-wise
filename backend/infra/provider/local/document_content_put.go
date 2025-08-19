package local

import (
	"backend/handler"
	"context"
	"os"
)

var _ handler.DocumentContentUpdateProvider = (*local)(nil)

func (p *local) UpdateDocumentContent(ctx context.Context, path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}
