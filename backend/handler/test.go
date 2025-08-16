package handler

import (
	"context"
	"fmt"

	"github.com/danielgtaylor/huma/v2"
)

type GreetingInput struct {
	Name string `path:"name" maxLength:"30" example:"world" doc:"Name to greet"`
}

// GreetingOutput represents the greeting operation response.
type GreetingOutput struct {
	Body struct {
		Message string `json:"message" example:"Hello, world!" doc:"Greeting message"`
	}
}

func newTestHandler(api huma.API) {
	// Register GET /greeting/{name} handler.
	huma.Get(api, "/greeting/{name}", func(ctx context.Context, input *GreetingInput) (*GreetingOutput, error) {
		resp := &GreetingOutput{}
		resp.Body.Message = fmt.Sprintf("Hello, %s!", input.Name)
		return resp, nil
	})
}
