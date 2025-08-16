package middleware

import (
	"backend/handler"
	"log"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

type loggerMiddleware struct{}

var _ handler.Middleware = (*loggerMiddleware)(nil)

func NewLogger() *loggerMiddleware {
	return &loggerMiddleware{}
}

func (m *loggerMiddleware) Use(ctx huma.Context, next func(huma.Context)) {
	start := time.Now()
	log.Printf("Started %s", ctx.Method())

	log.Println(ctx.URL().Path)
	next(ctx)
	log.Printf("Completed %s in %v", ctx.Operation().Path, time.Since(start))
}
