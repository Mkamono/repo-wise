package mode

import (
	"backend/config"
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
)

type local struct {
	configPath string
}

func NewLocalProvider() (*local, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}

	configPath := filepath.Join(configDir, "repo-wise", "config.json")

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		if err := initConfig(configPath); err != nil {
			return nil, err
		}
	}
	return &local{
		configPath: configPath,
	}, nil
}

var _ config.AppConfigProvider = (*local)(nil)

type localAppConfig struct {
	Github struct {
		AccessToken string   `json:"access_token"`
		IgnoreRepos []string `json:"ignore_repos"`
	} `json:"github"`
	LocalFile struct {
		Directories []string `json:"directories"`
	} `json:"local_file"`
}

func (p *local) Load() (*config.AppConfig, error) {
	file, err := os.Open(p.configPath)
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

// AppModeは更新しない
func (p *local) Save(appConfig *config.AppConfig) error {
	file, err := os.OpenFile(p.configPath, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
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

func initConfig(configPath string) error {
	if err := os.MkdirAll(filepath.Dir(configPath), fs.ModePerm); err != nil {
		return err
	}
	file, err := os.Create(configPath)
	if err != nil {
		return err
	}
	defer file.Close()

	// 初期設定を書き込む
	defaultConfig := localAppConfig{}
	b, err := json.MarshalIndent(defaultConfig, "", "  ")
	if err != nil {
		return err
	}
	if _, err := file.Write(b); err != nil {
		return err
	}
	// 設定ファイルはユーザーのみが読み書きできるようにする
	if err := os.Chmod(file.Name(), 0600); err != nil {
		return err
	}

	return nil
}
