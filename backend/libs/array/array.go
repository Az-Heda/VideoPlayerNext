package array

func Filter[A ~[]B, B any](items A, callback func(item B, idx int) bool) A {
	var out A = A{}
	for idx, item := range items {
		if callback(item, idx) {
			out = append(out, item)
		}
	}
	return out
}

func Map[A ~[]C, B ~[]D, C, D any](items A, callback func(item C, idx int) D) B {
	var out B = B{}
	for idx, item := range items {
		out = append(out, callback(item, idx))
	}
	return out
}

func Reduce[A ~[]B, B, C any](items A, defaultValue C, callback func(prev C, curr B, idx int) C) C {
	var value = defaultValue
	for idx, item := range items {
		value = callback(value, item, idx)
	}
	return value
}

func All[A ~[]B, B any](items A, callback func(item B, idx int) bool) bool {
	for idx, item := range items {
		if !callback(item, idx) {
			return false
		}
	}
	return true
}

func Any[A ~[]B, B any](items A, callback func(item B, idx int) bool) bool {
	for idx, item := range items {
		if callback(item, idx) {
			return true
		}
	}
	return false
}
