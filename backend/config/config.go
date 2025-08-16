package config

import (
	"os"
	"strconv"
)

type Config struct {
	Port int
	Host string
	Env  string
}

func NewConfig() (*Config, error) {
	strPort := lookupEnvOr("PORT", "8070")
	port, err := strconv.Atoi(strPort)
	if err != nil {
		return nil, err
	}

	env := lookupEnvOr("ENV", "dev")

	return &Config{
		Port: port,
		Host: "localhost",
		Env:  env,
	}, nil
}

func lookupEnvOr(key string, defaultValue string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		return defaultValue
	}
	return value
}
