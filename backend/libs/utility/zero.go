package utility

import "reflect"

func IsZero(val any) bool {
	return reflect.ValueOf(val).IsZero()
}
