package handler

import (
	"backend/config"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"

	"backend/handler/internal/local"

	_ "github.com/fxamacker/cbor/v2"
)

type Middleware interface {
	Use(ctx huma.Context, next func(huma.Context))
}

func newAPI() (http.Handler, huma.API) {
	router := chi.NewMux()
	api := humachi.New(router, huma.DefaultConfig("backend", "1.0.0"))

	return router, api
}

func setupMiddleware(
	api huma.API,
	middlewares []Middleware,
) {
	for _, mw := range middlewares {
		api.UseMiddleware(mw.Use)
	}
}

func NewHandler(
	appMode config.AppMode,
	appConfigProvider config.AppConfigProvider,
	providers []DocumentsProvider,
	middlewares ...Middleware,
) (http.Handler, error) {
	router, api := newAPI()

	setupMiddleware(api, middlewares)
	newAppConfigUpdateHandler(api, appConfigProvider)
	newStaticHandler(api)
	newDocumentsHandler(api, providers)

	if appMode == config.CLI || appMode == config.Native {
		local.NewDirectoryHandler(api)
	}
	return router, nil
}
