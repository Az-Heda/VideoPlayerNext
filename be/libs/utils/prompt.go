package utils

import (
	"fmt"
	"slices"
	"strings"

	"github.com/manifoldco/promptui"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
)

func AskUserPromptWithValidator(cmd *cobra.Command) func(flagName, label string, validator func(string) error) (string, error) {
	return func(flagName string, label string, validator func(string) error) (string, error) {
		flagValue, err := cmd.Flags().GetString(flagName)
		if err == nil && len(flagValue) > 0 {
			return flagValue, validator(flagValue)
		}

		prompt := promptui.Prompt{
			Label:    label,
			Validate: validator,
		}

		return prompt.Run()
	}
}

func AskUserPromptPassword(cmd *cobra.Command) func(flagName, label string, mask rune, validator func(string) error) (string, error) {
	return func(flagName, label string, mask rune, validator func(string) error) (string, error) {
		flagValue, err := cmd.Flags().GetString(flagName)
		if err == nil && len(flagValue) > 0 {
			return flagValue, validator(flagValue)
		}

		prompt := promptui.Prompt{
			Label:    label,
			Validate: validator,
			Mask:     mask,
		}

		return prompt.Run()
	}
}

func AskUserYN(cmd *cobra.Command) func(flagName, label string) bool {
	return func(flagName, label string) bool {
		if cmd.Flag(flagName).Changed {
			flagValue, err := cmd.Flags().GetBool(flagName)
			if err == nil {
				return flagValue
			}
		}

		prompt := promptui.Prompt{
			Label:     label,
			IsConfirm: true,
		}

		_, err := prompt.Run()
		return err == nil
	}
}

func AskUserForOptions(cmd *cobra.Command) func(flagName, label string, options []string) (int, error) {
	return func(flagName, label string, options []string) (int, error) {
		flagValue, err := cmd.Flags().GetString(flagName)
		log.Trace().Str("flagValue", flagValue).Send()
		if err == nil && len(flagValue) > 0 {
			if slices.Contains(options, flagValue) {
				return slices.Index(options, flagValue), nil
			}
			return 0, fmt.Errorf("unknown option `%s`, valid options are: (%s)", flagValue, strings.Join(options, ", "))
			// return flagValue, validator(flagValue)
		}

		prompt := promptui.Select{
			Label: label,
			Items: options,
		}

		i, _, err := prompt.Run()
		if err != nil {
			return -1, err
		}

		return i, nil
	}
}
