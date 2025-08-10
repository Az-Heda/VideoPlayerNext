package utils

type GS[T any] struct {
	Getter T
	Setter chan T
}

func (gs *GS[T]) run() {
	for {
		newData := <-gs.Setter
		gs.Getter = newData
	}
}

func NewGetterSetter[T any](initialData T) *GS[T] {
	var data = &GS[T]{
		Getter: initialData,
		Setter: make(chan T),
	}

	go data.run()
	return data
}
