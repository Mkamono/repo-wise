package main

import (
	"backend/config"
	"backend/config/local"
	"backend/handler"
	"backend/middleware"

	"fmt"
	"net/http"
)

func main() {
	serverConfig, err := config.NewServerConfig()
	if err != nil {
		panic(err)
	}

	// TODO: 動作環境ごとに分離
	appConfigProvider, err := local.NewLocalAppConfigProvider()
	if err != nil {
		panic(err)
	}

	appConfig, err := appConfigProvider.Load()
	if err != nil {
		panic(err)
	}

	fmt.Printf("Loaded app config: %+v\n", appConfig)

	router, err := handler.NewHandler(
		middleware.NewLogger(), // Add the logger middleware
	)

	if err != nil {
		panic(err)
	}

	// 開発環境での情報を表示
	if serverConfig.Env == "dev" {
		printServerInfo(serverConfig.Host, serverConfig.Port)
	}

	err = http.ListenAndServe(fmt.Sprintf("%s:%d", serverConfig.Host, serverConfig.Port), router)
	if err != nil {
		panic(err)
	}
}

// 開発環境での情報を表示する関数
func printServerInfo(host string, port int) {
	baseURL := fmt.Sprintf("http://%s:%d", host, port)
	fmt.Println("API documentation available at:     ", baseURL+"/docs")
	fmt.Println("YAML API specification available at:", baseURL+"/openapi.yaml")
}
