package config

import (
	"backend/util"
	"strconv"
)

type ServerConfig struct {
	Port int
	Host string
	Env  string
}

func NewServerConfig() (*ServerConfig, error) {
	strPort := util.LookupEnvOr("PORT", "8070")
	port, err := strconv.Atoi(strPort)
	if err != nil {
		return nil, err
	}
	env := util.LookupEnvOr("ENV", "dev")

	return &ServerConfig{
		Port: port,
		Host: "localhost",
		Env:  env,
	}, nil
}
