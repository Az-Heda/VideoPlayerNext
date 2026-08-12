package utility

func IfOneLine[T any](cond bool, ifTrue, ifFalse T) T {
	if cond {
		return ifTrue
	}
	return ifFalse
}

func IfOneLineCB[T any](cond bool, ifTrue, ifFalse func() T) T {
	return IfOneLine(cond, ifTrue, ifFalse)()
}
