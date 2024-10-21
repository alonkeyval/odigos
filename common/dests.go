package common

type DestinationType string

const (
	AWSS3DestinationType                  DestinationType = "s3"
	AxiomDestinationType                  DestinationType = "axiom"
	AzureBlobDestinationType              DestinationType = "azureblob"
	CauselyDestinationType                DestinationType = "causely"
	ChronosphereDestinationType           DestinationType = "chronosphere"
	ClickhouseDestinationType             DestinationType = "clickhouse"
	CoralogixDestinationType              DestinationType = "coralogix"
	DatadogDestinationType                DestinationType = "datadog"
	DebugDestinationType                  DestinationType = "debug"
	DynatraceDestinationType              DestinationType = "dynatrace"
	ElasticAPMDestinationType             DestinationType = "elasticapm"
	ElasticsearchDestinationType          DestinationType = "elasticsearch"
	GCSDestinationType                    DestinationType = "gcs"
	GenericOTLPDestinationType            DestinationType = "otlp"
	GoogleCloudDestinationType            DestinationType = "googlecloud"
	GrafanaCloudLokiDestinationType       DestinationType = "grafanacloudloki"
	GrafanaCloudPrometheusDestinationType DestinationType = "grafanacloudprometheus"
	GrafanaCloudTempoDestinationType      DestinationType = "grafanacloudtempo"
	HoneycombDestinationType              DestinationType = "honeycomb"
	JaegerDestinationType                 DestinationType = "jaeger"
	LightstepDestinationType              DestinationType = "lightstep"
	LogzioDestinationType                 DestinationType = "logzio"
	LokiDestinationType                   DestinationType = "loki"
	MiddlewareDestinationType             DestinationType = "middleware"
	NewRelicDestinationType               DestinationType = "newrelic"
	OpsVerseDestinationType               DestinationType = "opsverse"
	OtlpHttpDestinationType               DestinationType = "otlphttp"
	PrometheusDestinationType             DestinationType = "prometheus"
	QrynDestinationType                   DestinationType = "qryn"
	QrynOSSDestinationType                DestinationType = "qryn-oss"
	QuickwitDestinationType               DestinationType = "quickwit"
	SentryDestinationType                 DestinationType = "sentry"
	SignozDestinationType                 DestinationType = "signoz"
	SplunkDestinationType                 DestinationType = "splunk"
	SumoLogicDestinationType              DestinationType = "sumologic"
	TempoDestinationType                  DestinationType = "tempo"
	UptraceDestinationType                DestinationType = "uptrace"
)
