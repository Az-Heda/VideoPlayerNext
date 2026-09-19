package registry

import (
	"context"
)

type Registry struct {
	Folders   IRegistryFolder
	Videos    IRegistryVideo
	Playlists IRegistryPlaylist
	Tags      IRegistryTag
	Rules     IRegistryRule
	SystemLog IRegistrySystemLog
}

func getRegistry() Registry {
	return Registry{
		Folders:   registryFolder{},
		Videos:    registryVideo{},
		Playlists: registryPlaylist{},
		Tags:      registryTag{bannedChars: []string{"%"}},
		Rules:     registryRule{},
		SystemLog: registrySystemLog{},
	}
}

func Setup(parent context.Context) context.Context {
	var registry = getRegistry()
	var contextValues map[string]any = map[string]any{
		"registry":           registry,
		"registry-folders":   registry.Folders,
		"registry-videos":    registry.Videos,
		"registry-playlists": registry.Videos,
		"registry-tags":      registry.Tags,
		"registry-rules":     registry.Videos,
		"registry-systemlog": registry.SystemLog,
	}
	return chainContext(parent, contextValues)
}

func chainContext(parent context.Context, values map[string]any) context.Context {
	for k, v := range values {
		parent = context.WithValue(parent, k, v)
	}
	return parent
}
