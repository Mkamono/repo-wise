package domain

type Document struct {
	Path string `json:"path"`
	Name string `json:"name" example:"README.md" doc:"File name"`
}
