package domain

import "fmt"

type RepoKind struct {
	value string
}

func (k RepoKind) String() string {
	return k.value
}

var (
	LocalRepoKind  = RepoKind{"local"}
	GithubRepoKind = RepoKind{"github"}
)

func ParseRepoKind(value string) (RepoKind, error) {
	switch value {
	case "local":
		return LocalRepoKind, nil
	case "github":
		return GithubRepoKind, nil
	default:
		return RepoKind{}, fmt.Errorf("invalid Repokind: %s", value)
	}
}
