package utils

import (
	"bufio"
	"errors"
	"fmt"
	"full/libs/models"
	"io"
	"maps"
	"os"
	"strconv"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"golang.org/x/term"
	"gorm.io/gorm"
)

func RequestUserInput(stdin io.Reader, msg string, out *string) error {
	fmt.Print(msg)
	reader := bufio.NewReader(stdin)
	outLocal, err := reader.ReadString('\n')
	if err != nil {
		return err
	}

	*out = strings.TrimSpace(outLocal)
	return nil
}

type FieldReader interface {
	io.Reader
	Fd() uintptr
}

var (
	passwordInputMaxLength = 512
	ErrInterrupted         = errors.New("interrupted")
	ErrMaxLengthExceeded   = fmt.Errorf("maximum byte limit (%v) exceeded", passwordInputMaxLength)
	chunk                  = func(r io.Reader) (byte, error) {
		buf := make([]byte, 1)
		if n, err := r.Read(buf); n == 0 || err != nil {
			if err != nil {
				return 0, err
			}
			return 0, io.EOF
		}
		return buf[0], nil
	}
)

// GetUsersPassword returns the input read from terminal.
// If prompt is not empty, it will be output as a prompt to the user
// If masked is true, typing will be matched by asterisks on the screen.
// Otherwise, typing will echo nothing.

func RequestUserPassword(msg string, masked bool, r FieldReader, out *string) error {
	var w io.Writer = os.Stdout
	var err error
	var p, bs, ms []byte
	if masked {
		bs = []byte("\b \b")
		ms = []byte("*")
	}
	if term.IsTerminal(int(r.Fd())) {
		if oldState, err := term.MakeRaw(int(r.Fd())); err != nil {
			*out = string(p)
			return err
		} else {
			defer func() {
				err := term.Restore(int(r.Fd()), oldState)
				if err != nil {
					return
				}
				_, err = fmt.Fprintln(w)
				if err != nil {
					return
				}
			}()
		}
	}

	if msg != "" {
		_, err = fmt.Fprint(w, msg)
		if err != nil {
			return err
		}
	}

	// Track total bytes read, not just bytes in the password.  This ensures any
	// errors that might flood the console with nil or -1 bytes infinitely are
	// capped.
	var count int
	for count = 0; count <= passwordInputMaxLength; count++ {

		if v, e := chunk(r); e != nil {
			err = e
			break
		} else if v == 127 || v == 8 {
			if l := len(p); l > 0 {
				p = p[:l-1]
				_, err := fmt.Fprint(w, string(bs))
				if err != nil {
					return err
				}
			}
		} else if v == 13 || v == 10 {
			break
		} else if v == 3 {
			err = ErrInterrupted
			break
		} else if v != 0 {
			p = append(p, v)
			_, err = fmt.Fprint(w, string(ms))
			if err != nil {
				return err
			}
		}
	}
	if count > passwordInputMaxLength {
		err = ErrMaxLengthExceeded
	}
	*out = string(p)
	return err
}

func GetUsersFromCliInput(cmd *cobra.Command, conn *gorm.DB) (choosenField string, inputValue string, users []models.User) {
	var fields = []string{"id", "username", "email"}

	for _, f := range fields {
		v, err := cmd.Flags().GetString(fmt.Sprintf("filter-%s", f))
		if err == nil && len(v) > 0 {
			choosenField = f
			inputValue = v
			break
		}
	}

	if len(choosenField) == 0 {
		log.Info().Str("ChoosenField", choosenField).Str("inputValue", inputValue).Send()

		log.Info().Msg("Valid search fields: ")
		for i, f := range fields {
			fmt.Printf("%d) %s\n", i+1, f)
		}
		if err := RequestUserInput(cmd.InOrStdin(), "Choose field: ", &choosenField); err != nil {
			log.Err(err).Send()
			return
		}
		choosenField = strings.TrimSpace(choosenField)
		numField, err := strconv.ParseInt(choosenField, 10, 8)
		if err == nil {
			if numField > 0 && int(numField) <= len(fields) {
				choosenField = fields[numField-1]
			} else {
				log.Error().Int64("idx", numField).Msgf("Number must be between %d and %d", 1, len(fields))
				return
			}
		}
	}

	var targetUser models.User

	switch choosenField {
	case "id":
		if len(inputValue) == 0 {
			if err := RequestUserInput(cmd.InOrStdin(), fmt.Sprintf("Value in field %s: ", choosenField), &inputValue); err != nil {
				log.Err(err).Send()
				return
			}
		}
		targetUser = models.User{Id: inputValue}
	case "email":
		if len(inputValue) == 0 {
			if err := RequestUserInput(cmd.InOrStdin(), fmt.Sprintf("Value in field %s: ", choosenField), &inputValue); err != nil {
				log.Err(err).Send()
				return
			}
		}
		targetUser = models.User{Email: inputValue}
	case "username":
		if len(inputValue) == 0 {
			if err := RequestUserInput(cmd.InOrStdin(), fmt.Sprintf("Value in field %s: ", choosenField), &inputValue); err != nil {
				log.Err(err).Send()
				return
			}
		}
		targetUser = models.User{Username: inputValue}
	default:
		log.Error().
			Str("field", choosenField).
			Strs("valid-options", fields).
			Msg("Field is not a valid option")
	}

	if tx := conn.Find(&users, targetUser); tx.Error != nil {
		log.Err(tx.Error).Send()
		return
	}
	return choosenField, inputValue, users
}

func GetFromCliInput[T any](cmd *cobra.Command, conn *gorm.DB, fields map[string]func(value string) T) (choosenField string, inputValue string, data []T) {
	for f := range fields {
		v, err := cmd.Flags().GetString(fmt.Sprintf("filter-%s", f))
		if err == nil && len(v) > 0 {
			choosenField = f
			inputValue = v
			break
		}
	}

	if len(choosenField) == 0 {
		log.Info().Str("ChoosenField", choosenField).Str("inputValue", inputValue).Send()

		log.Info().Msg("Valid search fields: ")

		var allFields []string
		for k := range maps.Keys(fields) {
			allFields = append(allFields, k)
		}

		for i, f := range allFields {
			fmt.Printf("%d) %s\n", i+1, f)
		}
		if err := RequestUserInput(cmd.InOrStdin(), "Choose field: ", &choosenField); err != nil {
			log.Err(err).Send()
			return
		}
		choosenField = strings.TrimSpace(choosenField)
		numField, err := strconv.ParseInt(choosenField, 10, 8)
		if err == nil {
			if numField > 0 && int(numField) <= len(fields) {
				choosenField = allFields[numField-1]
			} else {
				log.Error().Int64("idx", numField).Msgf("Number must be between %d and %d", 1, len(fields))
				return
			}
		}
	}

	// var targetUser models.User

	// switch choosenField {
	// case "id":
	// 	if len(inputValue) == 0 {
	// 		if err := RequestUserInput(cmd.InOrStdin(), fmt.Sprintf("Value in field %s: ", choosenField), &inputValue); err != nil {
	// 			log.Err(err).Send()
	// 			return
	// 		}
	// 	}
	// 	targetUser = models.User{Id: inputValue}
	// case "email":
	// 	if len(inputValue) == 0 {
	// 		if err := RequestUserInput(cmd.InOrStdin(), fmt.Sprintf("Value in field %s: ", choosenField), &inputValue); err != nil {
	// 			log.Err(err).Send()
	// 			return
	// 		}
	// 	}
	// 	targetUser = models.User{Email: inputValue}
	// case "username":
	// 	if len(inputValue) == 0 {
	// 		if err := RequestUserInput(cmd.InOrStdin(), fmt.Sprintf("Value in field %s: ", choosenField), &inputValue); err != nil {
	// 			log.Err(err).Send()
	// 			return
	// 		}
	// 	}
	// 	targetUser = models.User{Username: inputValue}
	// default:
	// 	log.Error().
	// 		Str("field", choosenField).
	// 		Strs("valid-options", fields).
	// 		Msg("Field is not a valid option")
	// }

	// if tx := conn.Find(&users, targetUser); tx.Error != nil {
	// 	log.Err(tx.Error).Send()
	// 	return
	// }
	return choosenField, inputValue, data
}
