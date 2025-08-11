package utils

import "sync"

type GS[T any] struct {
	Getter T
	Setter chan T
	mut    sync.Mutex
}

func (gs *GS[T]) run() {
	for {
		newData := <-gs.Setter
		gs.mut.Lock()
		gs.Getter = newData
		gs.mut.Unlock()
	}
}

func NewGetterSetter[T any](initialData T) *GS[T] {
	var data = &GS[T]{
		Setter: make(chan T),
	}

	go data.run()
	data.Setter <- initialData
	return data
}
