package utils

func Filter[T any](data []T, cb func(item T, idx int) bool) []T {
	var out []T
	for idx, item := range data {
		if cb(item, idx) {
			out = append(out, item)
		}
	}
	return out
}

func Map[T, K any](data []T, cb func(item T, idx int) K) []K {
	var out []K
	for idx, item := range data {
		out = append(out, cb(item, idx))
	}
	return out
}

func GroupBy[T any, K comparable](data []T, cb func(item T, idx int) K) map[K][]T {
	var out map[K][]T = make(map[K][]T)
	for idx, item := range data {
		var key = cb(item, idx)
		_, ok := out[key]
		if !ok {
			out[key] = []T{}
		}
		out[key] = append(out[key], item)
	}
	return out
}
