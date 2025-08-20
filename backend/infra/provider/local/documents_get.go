package local

import (
	"backend/domain"
	"backend/handler"
	"context"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

var _ handler.DocumentsProvider = (*local)(nil)

func (p *local) GetDocuments(ctx context.Context, path string, condition handler.DocumentCondition) ([]domain.Document, error) {
	type fileInfo struct {
		path string
		info os.FileInfo
	}

	// 適切なワーカー数（IOバウンドなので控えめに）
	numWorkers := 8
	fileChan := make(chan fileInfo, 1000)
	resultChan := make(chan domain.Document, 100)

	var wg sync.WaitGroup
	var matchedFiles []domain.Document

	// ワーカーgoroutineを起動（固定数でリソース使用を制御）
	for range numWorkers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for file := range fileChan {
				select {
				case <-ctx.Done():
					return
				default:
				}

				// 条件チェック（CPU処理）
				if matchesCondition(file.path, file.info, condition) {
					relPath, _ := filepath.Rel(path, file.path)
					select {
					case resultChan <- domain.Document{
						Path: file.path,
						Name: relPath,
					}:
					case <-ctx.Done():
						return
					}
				}
			}
		}()
	}

	// 結果収集goroutine
	done := make(chan bool)
	go func() {
		defer close(done)
		for doc := range resultChan {
			matchedFiles = append(matchedFiles, doc)
		}
	}()

	// ファイルシステム走査（単一goroutineでIO最適化）
	go func() {
		defer close(fileChan)
		filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			select {
			case <-ctx.Done():
				return ctx.Err()
			default:
			}

			if info.IsDir() {
				// ディレクトリ除外チェック
				for _, dirName := range condition.Excludes.DirNames {
					if dirName != "" && matchPattern(dirName, info.Name()) {
						return filepath.SkipDir
					}
				}
				return nil
			}

			// ファイル情報をワーカーに送信
			select {
			case fileChan <- fileInfo{path: filePath, info: info}:
			case <-ctx.Done():
				return ctx.Err()
			}

			return nil
		})
	}()

	// ワーカー完了待機goroutine
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// 結果収集完了を待機
	<-done

	if ctx.Err() != nil {
		return nil, ctx.Err()
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
