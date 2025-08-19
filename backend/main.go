package main

import (
	"backend/config"
	"backend/config/mode"
	"backend/handler"
	"backend/infra/provider/local"
	"backend/middleware"
	"backend/util"

	"fmt"
	"net/http"
)

func getConfigProvider() (config.AppConfigProvider, error) {
	appMode, err := config.ParseAppMode(util.LookupEnvOr("APP_MODE", config.CLI.String()))
	if err != nil {
		return nil, err
	}

	if appMode == config.CLI || appMode == config.Native {
		return mode.NewLocalProvider()
	}

	return nil, fmt.Errorf("unsupported app mode: %s", appMode)
}

func main() {
	serverConfig, err := config.NewServerConfig()
	if err != nil {
		panic(err)
	}

	configProvider, err := getConfigProvider()
	if err != nil {
		panic(err)
	}

	appConfig, err := configProvider.Load()
	if err != nil {
		panic(err)
	}

	fmt.Printf("Loaded app config: %+v\n", appConfig)

	localRepoProvider, err := local.NewLocalProvider()
	if err != nil {
		panic(err)
	}

	router, err := handler.NewHandler(
		appConfig.AppMode,
		configProvider,
		[]handler.DocumentsProvider{
			localRepoProvider,
		},
		middleware.NewLogger(),
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
