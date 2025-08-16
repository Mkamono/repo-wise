package main

import (
	"backend/config"
	"backend/handler"
	"backend/middleware"
	"fmt"
	"net/http"
)

func main() {
	config, err := config.NewConfig()
	if err != nil {
		panic(err)
	}

	router, err := handler.NewHandler(
		middleware.NewLogger(), // Add the logger middleware
	)

	if err != nil {
		panic(err)
	}

	// 開発環境での情報を表示
	if config.Env == "dev" {
		printServerInfo(config.Host, config.Port)
	}

	err = http.ListenAndServe(fmt.Sprintf("%s:%d", config.Host, config.Port), router)
	if err != nil {
		panic(err)
	}
}

// 開発環境での情報を表示する関数
func printServerInfo(host string, port int) {
	baseURL := fmt.Sprintf("http://%s:%d", host, port)
	fmt.Println("Running in development mode")
	fmt.Println("API documentation available at:     ", baseURL+"/docs")
	fmt.Println("YAML API specification available at:", baseURL+"/openapi.yaml")
}
