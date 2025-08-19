package config

import "fmt"

type AppConfigProvider interface {
	Load() (*AppConfig, error)
	Save(*AppConfig) error // AppModeは更新しない
}

type AppMode struct {
	value string
}

func (m AppMode) String() string {
	return m.value
}

func ParseAppMode(value string) (AppMode, error) {
	switch value {
	case "web":
		return Web, nil
	case "cli":
		return CLI, nil
	case "native":
		return Native, nil
	default:
		return AppMode{}, fmt.Errorf("unknown app mode: %s", value)
	}
}

var (
	Web    = AppMode{value: "web"}
	CLI    = AppMode{value: "cli"}
	Native = AppMode{value: "native"}
)

type AppConfig struct {
	Github    Github
	LocalFile LocalFile
	AppMode   AppMode
}

type Github struct {
	AccessToken string
	IgnoreRepos []string
}

type LocalFile struct {
	Directories []string
}
