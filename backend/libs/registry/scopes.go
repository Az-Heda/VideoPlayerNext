package registry

import (
	"fmt"
	"reflect"
	"strings"
	"vp/libs/models"

	"gorm.io/gorm"
)

var (
	numberOps  = []string{"==", "<>", "<", ">", "<=", ">=", "between"}
	stringOps  = []string{"==", "<>", "contains", "doesntContains", "startsWith", "endsWith"}
	booleanOps = []string{"==", "<>"}
)

func fieldKind[T any](jsonName string) (reflect.Kind, bool) {
	var t T
	rt := reflect.TypeOf(t)

	for i := 0; i < rt.NumField(); i++ {
		f := rt.Field(i)

		name := f.Name
		if tag, ok := f.Tag.Lookup("json"); ok {
			name = strings.Split(tag, ",")[0]
		}
		if strings.ToLower(strings.ReplaceAll(name, "_", "")) != strings.ToLower(strings.ReplaceAll(jsonName, "_", "")) {
			continue
		}

		k := f.Type.Kind()
		if k == reflect.Ptr {
			k = f.Type.Elem().Kind()
		}
		return k, true
	}
	return reflect.Invalid, false
}

func validateItem[T any](it *models.FilterItem[T]) error {
	kind, ok := fieldKind[T](it.Property)
	if !ok {
		return fmt.Errorf("unknown or non-filterable property %q", it.Property)
	}

	var allowed []string
	switch kind {
	case reflect.String:
		allowed = stringOps
	case reflect.Bool:
		allowed = booleanOps
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64,
		reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64,
		reflect.Float32, reflect.Float64:
		allowed = numberOps
	default:
		return fmt.Errorf("property %q is not filterable", it.Property)
	}

	for _, op := range allowed {
		if op == it.Op {
			if op == "between" && (it.Num1 == nil || it.Num2 == nil) {
				return fmt.Errorf("'between' requires num1 and num2")
			}
			return nil
		}
	}
	return fmt.Errorf("op %q not allowed for property %q", it.Op, it.Property)
}

func buildItemCondition[T any](it *models.FilterItem[T]) (string, []any, error) {
	if err := validateItem(it); err != nil {
		return "", nil, err
	}

	col := it.Property

	switch it.Op {
	case "==":
		return fmt.Sprintf("%s = ?", col), []any{it.Value}, nil
	case "<>":
		return fmt.Sprintf("%s <> ?", col), []any{it.Value}, nil
	case "<":
		return fmt.Sprintf("%s < ?", col), []any{it.Value}, nil
	case ">":
		return fmt.Sprintf("%s > ?", col), []any{it.Value}, nil
	case "<=":
		return fmt.Sprintf("%s <= ?", col), []any{it.Value}, nil
	case ">=":
		return fmt.Sprintf("%s >= ?", col), []any{it.Value}, nil
	case "between":
		return fmt.Sprintf("%s BETWEEN ? AND ?", col), []any{*it.Num1, *it.Num2}, nil

	case "contains":
		return likeCond(col, "%"+asString(it.Value)+"%", false, it.TreatCase), []any{likeArg("%"+asString(it.Value)+"%", it.TreatCase)}, nil
	case "doesntContains":
		return likeCond(col, "%"+asString(it.Value)+"%", true, it.TreatCase), []any{likeArg("%"+asString(it.Value)+"%", it.TreatCase)}, nil
	case "startsWith":
		return likeCond(col, asString(it.Value)+"%", false, it.TreatCase), []any{likeArg(asString(it.Value)+"%", it.TreatCase)}, nil
	case "endsWith":
		return likeCond(col, "%"+asString(it.Value), false, it.TreatCase), []any{likeArg("%"+asString(it.Value), it.TreatCase)}, nil
	}
	return "", nil, fmt.Errorf("unsupported op %q", it.Op)
}

func asString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return fmt.Sprint(v)
}

func likeCond(col, _ string, negate bool, treatCase *string) string {
	var expr string
	if treatCase != nil && *treatCase == "lower" {
		expr = fmt.Sprintf("LOWER(%s) LIKE LOWER(?)", col)
	} else if treatCase != nil && *treatCase == "upper" {
		expr = fmt.Sprintf("UPPER(%s) LIKE UPPER(?)", col)
	} else {
		expr = fmt.Sprintf("%s LIKE ?", col)
	}
	if negate {
		expr = fmt.Sprintf("NOT (%s)", expr)
	}
	return expr
}

func likeArg(v string, _ *string) string { return v }

func BuildScope[T any](expr models.FilterExpression[T]) (func(*gorm.DB) *gorm.DB, error) {
	if expr.Item != nil {
		cond, args, err := buildItemCondition(expr.Item)
		if err != nil {
			return nil, err
		}
		return func(db *gorm.DB) *gorm.DB {
			return db.Where(cond, args...)
		}, nil
	}

	if expr.Group != nil {
		if len(expr.Group.Filters) == 0 {
			return func(db *gorm.DB) *gorm.DB { return db }, nil
		}

		scopes := make([]func(*gorm.DB) *gorm.DB, 0, len(expr.Group.Filters))
		for i, child := range expr.Group.Filters {
			s, err := BuildScope(child)
			if err != nil {
				return nil, fmt.Errorf("filter[%d]: %w", i, err)
			}
			scopes = append(scopes, s)
		}

		switch expr.Group.Operator {
		case "and":
			return func(db *gorm.DB) *gorm.DB {
				for _, s := range scopes {
					db = s(db)
				}
				return db
			}, nil

		case "or":
			return func(db *gorm.DB) *gorm.DB {
				return db.Where(func(tx *gorm.DB) *gorm.DB {
					first := true
					for _, s := range scopes {
						sub := s(tx.Session(&gorm.Session{NewDB: true}))
						if first {
							tx = sub
							first = false
						} else {
							tx = tx.Or(sub)
						}
					}
					return tx
				})
			}, nil

		default:
			return nil, fmt.Errorf("invalid group operator %q", expr.Group.Operator)
		}
	}

	return nil, fmt.Errorf("empty filter expression")
}
