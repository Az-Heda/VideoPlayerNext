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
	return context.WithValue(parent, "registry", registry)
}
