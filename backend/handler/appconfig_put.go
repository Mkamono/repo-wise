package handler

import (
	"backend/config"
	"context"

	"github.com/danielgtaylor/huma/v2"
)

type AppConfigUpdateInput struct {
	Body config.AppConfig `json:"body"`
}

type AppConfigUpdateOutput struct {
	Body struct {
		Message string `json:"message" example:"Configuration updated successfully" doc:"Update status message"`
	}
}

func newAppConfigUpdateHandler(api huma.API, provider config.AppConfigProvider) {
	huma.Put(api, "/appconfig", func(ctx context.Context, input *AppConfigUpdateInput) (*AppConfigUpdateOutput, error) {
		err := provider.Save(&input.Body)
		if err != nil {
			return nil, huma.Error500InternalServerError("Failed to save configuration", err)
		}

		resp := &AppConfigUpdateOutput{}
		resp.Body.Message = "Configuration updated successfully"
		return resp, nil
	})
}
