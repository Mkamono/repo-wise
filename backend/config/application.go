package config

type AppConfigProvider interface {
	Load() (*AppConfig, error)
	Save(*AppConfig) error
}

type appMode struct {
	value string
}

var (
	Web    = appMode{value: "web"}
	CLI    = appMode{value: "cli"}
	Native = appMode{value: "native"}
)

type AppConfig struct {
	Github    Github
	LocalFile LocalFile
	AppMode   appMode
}

type Github struct {
	AccessToken string
	IgnoreRepos []string
}

type LocalFile struct {
	Directories []string
}
