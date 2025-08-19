package local

import (
	"backend/domain"
	"backend/handler"
	"context"
	"os"
	"path/filepath"
	"strings"
)

var _ handler.DocumentsProvider = (*local)(nil)

func (p *local) GetDocuments(ctx context.Context, path string, condition handler.DocumentCondition) ([]domain.Document, error) {
	// ディレクトリをスキャンして条件に合うファイルを探す
	var matchedFiles []domain.Document

	err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// ディレクトリの場合はスキップ
		if info.IsDir() {
			// 除外条件をチェック
			for _, dirName := range condition.Excludes.DirNames {
				if dirName != "" && matchPattern(dirName, info.Name()) {
					return filepath.SkipDir
				}
			}
			return nil
		}

		// ファイルが条件を満たすかチェック
		if matchesCondition(filePath, info, condition) {
			relPath, _ := filepath.Rel(path, filePath)
			matchedFiles = append(matchedFiles, domain.Document{
				Path: filePath,
				Name: relPath,
			})
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	if len(matchedFiles) > 0 {
		return matchedFiles, nil
	}

	return []domain.Document{}, nil
}

// ファイルが条件を満たすかチェック
func matchesCondition(filePath string, info os.FileInfo, condition handler.DocumentCondition) bool {
	fileName := info.Name()
	dirName := filepath.Base(filepath.Dir(filePath))

	// 除外条件をチェック
	// 拡張子の除外チェック
	for _, ext := range condition.Excludes.Exts {
		if ext != "" && strings.HasSuffix(fileName, "."+ext) {
			return false
		}
	}
	// ディレクトリ名の除外チェック
	for _, excludeDirName := range condition.Excludes.DirNames {
		if excludeDirName != "" && matchPattern(excludeDirName, dirName) {
			return false
		}
	}

	// 含む条件をチェック
	// 拡張子か拡張子リストが空の場合は全て対象
	extMatches := len(condition.Includes.Exts) == 0
	if !extMatches {
		for _, ext := range condition.Includes.Exts {
			if ext != "" && strings.HasSuffix(fileName, "."+ext) {
				extMatches = true
				break
			}
		}
	}

	// ディレクトリ名の条件チェック（空の場合は全て対象、*の場合も全て対象）
	dirMatches := len(condition.Includes.DirNames) == 0
	if !dirMatches {
		for _, includeDirName := range condition.Includes.DirNames {
			if includeDirName == "*" || matchPattern(includeDirName, dirName) {
				dirMatches = true
				break
			}
		}
	}

	return extMatches && dirMatches
}

// シンプルなパターンマッチング（*をワイルドカードとして使用）
func matchPattern(pattern, str string) bool {
	if pattern == "*" {
		return true
	}
	if pattern == str {
		return true
	}
	// より複雑なパターンマッチングが必要な場合は filepath.Match を使用
	matched, _ := filepath.Match(pattern, str)
	return matched
}
