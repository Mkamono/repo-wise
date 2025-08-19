package handler

import (
	"context"
	"embed"

	"github.com/danielgtaylor/huma/v2"
)

//go:embed static/index.html
var staticFiles embed.FS

type StaticOutput struct {
	Body []byte
}

func newStaticHandler(api huma.API) {
	huma.Get(api, "/", func(ctx context.Context, input *struct{}) (*StaticOutput, error) {
		content, err := staticFiles.ReadFile("static/index.html")
		if err != nil {
			return nil, huma.Error500InternalServerError("Failed to read index.html", err)
		}

		return &StaticOutput{Body: content}, nil
	})
}
