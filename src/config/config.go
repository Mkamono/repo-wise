package config

type Config struct {
	ClientID string // GitHub OAuth App Client ID (public)
	Port     int
}

func NewConfig() Config {
	return Config{
		ClientID: "Ov23li47XYtQ5ucc3uAf",
		Port:     10238,
	}
}
