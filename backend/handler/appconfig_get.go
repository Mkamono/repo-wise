package handler

import (
	"backend/config"
	"context"

	"github.com/danielgtaylor/huma/v2"
)

type AppConfigGetOutput struct {
	Body config.AppConfig `json:"body"`
}

func newAppConfigGetHandler(api huma.API, provider config.AppConfigProvider) {
	huma.Get(api, "/appconfig", func(ctx context.Context, input *struct{}) (*AppConfigGetOutput, error) {
		appConfig, err := provider.Load()
		if err != nil {
			return nil, huma.Error500InternalServerError("Failed to load configuration", err)
		}

		resp := &AppConfigGetOutput{}
		resp.Body = *appConfig
		return resp, nil
	})
}
