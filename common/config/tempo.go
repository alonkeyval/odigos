package config

import (
	"errors"
	"fmt"
	"strings"

	"github.com/odigos-io/odigos/common"
)

const (
	tempoUrlKey = "TEMPO_URL"
)

type Tempo struct{}

func (t *Tempo) DestType() common.DestinationType {
	return common.TempoDestinationType
}

func (t *Tempo) ModifyConfig(dest ExporterConfigurer, currentConfig *Config) error {

	url, exists := dest.GetConfig()[tempoUrlKey]
	if !exists {
		return errors.New("Tempo url not specified, gateway will not be configured for Tempo")
	}

	if strings.HasPrefix(url, "https://") {
		return errors.New("Tempo does not currently supports tls export, gateway will not be configured for Tempo")
	}

	if isTracingEnabled(dest) {
		url = strings.TrimPrefix(url, "http://")
		url = strings.TrimSuffix(url, ":4317")

		tempoExporterName := "otlp/tempo-" + dest.GetName()
		currentConfig.Exporters[tempoExporterName] = GenericMap{
			"endpoint": fmt.Sprintf("%s:4317", url),
			"tls": GenericMap{
				"insecure": true,
			},
		}

		tracesPipelineName := "traces/tempo-" + dest.GetName()
		currentConfig.Service.Pipelines[tracesPipelineName] = Pipeline{
			Exporters: []string{tempoExporterName},
		}
	}

	return nil
}
