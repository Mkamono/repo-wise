package local

import (
	"backend/config"
	"encoding/json"
	"io/fs"
	"os"
	"os/user"
	"path/filepath"
)

func configFilePath() string {
	XDG_CONFIG_HOME := os.Getenv("XDG_CONFIG_HOME")
	user, err := user.Current()
	if err != nil {
		return ""
	}

	configDir := func() string {
		if XDG_CONFIG_HOME != "" {
			return XDG_CONFIG_HOME
		}
		return filepath.Join(user.HomeDir, ".config")
	}

	return filepath.Join(configDir(), "repowise", "config.json")
}

var _ config.AppConfigProvider = &localAppConfigProvider{}

type localAppConfigProvider struct {
	Path string // CONFIG_DIR/repowise/config.json
}

type localAppConfig struct {
	Github struct {
		AccessToken string   `json:"access_token"`
		IgnoreRepos []string `json:"ignore_repos"`
	} `json:"github"`
	LocalFile struct {
		Directories []string `json:"directories"`
	} `json:"local_file"`
}

func NewLocalAppConfigProvider() (config.AppConfigProvider, error) {
	configPath := configFilePath()
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		if err := os.MkdirAll(filepath.Dir(configPath), fs.ModePerm); err != nil {
			return nil, err
		}
		file, err := os.Create(configPath)
		if err != nil {
			return nil, err
		}
		defer file.Close()

		// 初期設定を書き込む
		defaultConfig := localAppConfig{}
		b, err := json.MarshalIndent(defaultConfig, "", "  ")
		if err != nil {
			return nil, err
		}
		if _, err := file.Write(b); err != nil {
			return nil, err
		}
		// 設定ファイルはユーザーのみが読み書きできるようにするのが安全です
		if err := os.Chmod(file.Name(), 0600); err != nil {
			return nil, err
		}
	}

	return &localAppConfigProvider{
		Path: configFilePath(),
	}, nil
}

func (p *localAppConfigProvider) Load() (*config.AppConfig, error) {
	file, err := os.Open(p.Path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var cfg localAppConfig
	if err := json.NewDecoder(file).Decode(&cfg); err != nil {
		return nil, err
	}

	return &config.AppConfig{
		Github: config.Github{
			AccessToken: cfg.Github.AccessToken,
			IgnoreRepos: cfg.Github.IgnoreRepos,
		},
		LocalFile: config.LocalFile{
			Directories: cfg.LocalFile.Directories,
		},
		AppMode: config.CLI,
	}, nil
}

func (p *localAppConfigProvider) Save(appConfig *config.AppConfig) error {
	file, err := os.OpenFile(p.Path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer file.Close()

	cfg := localAppConfig{
		Github: struct {
			AccessToken string   `json:"access_token"`
			IgnoreRepos []string `json:"ignore_repos"`
		}{
			AccessToken: appConfig.Github.AccessToken,
			IgnoreRepos: appConfig.Github.IgnoreRepos,
		},
		LocalFile: struct {
			Directories []string `json:"directories"`
		}{
			Directories: appConfig.LocalFile.Directories,
		},
	}

	b, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	if _, err := file.Write(b); err != nil {
		return err
	}
	return nil
}
