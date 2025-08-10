package handler

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humago"
)

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	api := humago.New(mux, huma.DefaultConfig("api", "1.0.0"))

	huma.Get(api, "/demo", func(ctx context.Context, input *struct{}) (*struct{}, error) {
		// TODO: Implement me!
		return nil, nil
	})

	return mux
}
