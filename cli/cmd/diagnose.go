package cmd

import (
	"archive/tar"
	"compress/gzip"
	"context"
	"fmt"

	"github.com/odigos-io/odigos/cli/cmd/diagnose_util"

	"io"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/odigos-io/odigos/api/k8sconsts"
	cmdcontext "github.com/odigos-io/odigos/cli/pkg/cmd_context"
	"github.com/odigos-io/odigos/cli/pkg/kube"
	"github.com/spf13/cobra"
)

var (
	diagnoseDirs = []string{k8sconsts.LogsDir, k8sconsts.CRDsDir, k8sconsts.ProfileDir, k8sconsts.MetricsDir}
)

var diagnoseCmd = &cobra.Command{
	Use:   "diagnose",
	Short: "Diagnose Client Cluster",
	Long: `Retrieves Logs of all Odigos components in the odigos-system namespace and CRDs of Actions, instrumentation resources and more. 
The results will be saved in a compressed file for further troubleshooting.
The file will be saved in this format: odigos_debug_ddmmyyyyhhmmss.tar.gz`,
	Run: func(cmd *cobra.Command, args []string) {
		ctx := cmd.Context()
		client := cmdcontext.KubeClientFromContextOrExit(ctx)

		err := startDiagnose(ctx, client)
		if err != nil {
			fmt.Printf("The diagnose script crashed on: %v\n", err)
		}
	},
}

func startDiagnose(ctx context.Context, client *kube.Client) error {
	mainTempDir, err := createAllDirs()
	if err != nil {
		return err
	}
	defer os.RemoveAll(mainTempDir)

	var wg sync.WaitGroup

	//// Fetch Odigos components logs
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := diagnose_util.FetchOdigosComponentsLogs(ctx, client, filepath.Join(mainTempDir, k8sconsts.LogsDir)); err != nil {
			fmt.Printf("Error fetching Odigos components logs: %v\n", err)
		}
	}()

	// Fetch Odigos CRDs
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err = diagnose_util.FetchOdigosCRs(ctx, client, filepath.Join(mainTempDir, k8sconsts.CRDsDir)); err != nil {
			fmt.Printf("Error fetching Odigos CRDs: %v\n", err)
		}
	}()

	// Fetch Odigos Profile
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err = diagnose_util.FetchOdigosProfiles(ctx, client, filepath.Join(mainTempDir, k8sconsts.ProfileDir)); err != nil {
			fmt.Printf("Error calculating Odigos Profile: %v\n", err)
		}
	}()

	// Fetch Odigos Collector Metrics
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err = diagnose_util.FetchOdigosCollectorMetrics(ctx, client, filepath.Join(mainTempDir, k8sconsts.MetricsDir)); err != nil {
			fmt.Printf("Error calculating Odigos Metrics: %v\n", err)
		}
	}()

	// Fetch Odigos Destinations
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err = diagnose_util.FetchDestinationsCRDs(ctx, client, filepath.Join(mainTempDir, k8sconsts.CRDsDir)); err != nil {
			fmt.Printf("Error fetching Odigos CRDs: %v\n", err)
		}
	}()

	wg.Wait()

	// Package the results into a tar.gz file
	if err = createTarGz(mainTempDir); err != nil {
		return err
	}

	return nil
}

func createAllDirs() (string, error) {
	mainTempDir, err := os.MkdirTemp("", "odigos-diagnose")
	if err != nil {
		return "", err
	}

	for _, dir := range diagnoseDirs {
		tempDir := filepath.Join(mainTempDir, dir)
		err = os.Mkdir(tempDir, os.ModePerm) // os.ModePerm gives full permissions (0777)
		if err != nil {
			return "", err
		}
	}

	return mainTempDir, nil
}

func createTarGz(sourceDir string) error {
	timestamp := time.Now().Format("02012006150405")
	tarGzFileName := fmt.Sprintf("odigos_debug_%s.tar.gz", timestamp)

	tarGzFile, err := os.Create(tarGzFileName)
	if err != nil {
		return err
	}
	defer tarGzFile.Close()

	gzipWriter := gzip.NewWriter(tarGzFile)
	defer gzipWriter.Close()

	tarWriter := tar.NewWriter(gzipWriter)
	defer tarWriter.Close()

	err = filepath.Walk(sourceDir, func(file string, fi os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		header, err := tar.FileInfoHeader(fi, fi.Name())
		if err != nil {
			return err
		}

		header.Name, err = filepath.Rel(sourceDir, file)
		if err != nil {
			return err
		}

		if err := tarWriter.WriteHeader(header); err != nil {
			return err
		}

		if !fi.Mode().IsRegular() {
			return nil
		}

		fileContent, err := os.Open(file)
		if err != nil {
			return err
		}
		defer fileContent.Close()

		if _, err := io.Copy(tarWriter, fileContent); err != nil {
			return err
		}

		return nil
	})

	return err
}

func init() {
	rootCmd.AddCommand(diagnoseCmd)
}
