package utility

import (
	"embed"
	"path"
)

func ReadEmbedFiles(fs embed.FS, startPath string) ([]string, error) {
	var f []string
	entries, err := fs.ReadDir(startPath)
	if err != nil {
		return nil, err
	}
	for _, e := range entries {
		var fullpath = path.Join(startPath, e.Name())
		if e.IsDir() {
			if fi, err := ReadEmbedFiles(fs, fullpath); err == nil {
				f = append(f, fi...)
			} else {
				return f, err
			}
			continue
		}
		f = append(f, fullpath)
	}

	return f, nil
}
