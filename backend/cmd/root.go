package cmd

import (
	"os"
	"vp/libs/handler"

	"github.com/spf13/cobra"
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "vp",
	Short: "",
	Run:   handler.Root,
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	removeHelpFlag(rootCmd)

	rootCmd.Flags().StringP("host", "h", "127.0.0.1", "Host of the webserver")
	rootCmd.Flags().IntP("port", "p", 5008, "Port of the webserver")
}

func removeHelpFlag(cmd *cobra.Command) {
	cmd.SetHelpCommand(&cobra.Command{Hidden: true})
	cmd.Flags().Bool("help", false, "help for this command")
	_ = cmd.Flags().MarkHidden("help")
}
