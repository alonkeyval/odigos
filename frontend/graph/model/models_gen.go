// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"fmt"
	"io"
	"strconv"
)

type ActualAction struct {
	ID      string       `json:"id"`
	Kind    string       `json:"kind"`
	Name    *string      `json:"name,omitempty"`
	Notes   *string      `json:"notes,omitempty"`
	Disable bool         `json:"disable"`
	Signals []SignalType `json:"signals"`
	Details string       `json:"details"`
}

type ActualDestination struct {
	ID              string                  `json:"id"`
	Name            string                  `json:"name"`
	Type            *DestinationType        `json:"type"`
	ExportedSignals []SignalType            `json:"exportedSignals"`
	Fields          []*DestinationSpecField `json:"fields"`
}

type ComputePlatform struct {
	ID                  string                `json:"id"`
	Name                *string               `json:"name,omitempty"`
	ComputePlatformType ComputePlatformType   `json:"computePlatformType"`
	K8sActualNamespace  *K8sActualNamespace   `json:"k8sActualNamespace,omitempty"`
	K8sActualNamespaces []*K8sActualNamespace `json:"k8sActualNamespaces"`
	K8sActualSources    []*K8sActualSource    `json:"k8sActualSources"`
	ActualDestinations  []*ActualDestination  `json:"actualDestinations"`
	ActualActions       []*ActualAction       `json:"actualActions"`
}

type DesiredActionInput struct {
	Kind    string       `json:"kind"`
	Name    *string      `json:"name,omitempty"`
	Notes   *string      `json:"notes,omitempty"`
	Disable bool         `json:"disable"`
	Signals []SignalType `json:"signals"`
	Details string       `json:"details"`
}

type DesiredDestination struct {
	ID               string                  `json:"id"`
	Name             string                  `json:"name"`
	Type             *DestinationType        `json:"type"`
	ExportSignals    []SignalType            `json:"exportSignals"`
	Fields           []*DestinationSpecField `json:"fields"`
	ComputePlatforms []*ComputePlatform      `json:"computePlatforms"`
}

type DesiredDestinationFieldInput struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DesiredDestinationInput struct {
	Name          string                          `json:"name"`
	ExportSignals []SignalType                    `json:"exportSignals"`
	Fields        []*DesiredDestinationFieldInput `json:"fields"`
}

type DestinationSpecField struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type DestinationType struct {
	Category         string                  `json:"category"`
	Name             string                  `json:"name"`
	DisplayName      string                  `json:"displayName"`
	Image            *string                 `json:"image,omitempty"`
	SupportedSignals []SignalType            `json:"supportedSignals"`
	Fields           []*DestinationTypeField `json:"fields"`
}

type DestinationTypeCategory struct {
	Name             string             `json:"name"`
	DestinationTypes []*DestinationType `json:"destinationTypes"`
}

type DestinationTypeField struct {
	Name           string  `json:"name"`
	DisplayName    string  `json:"displayName"`
	VideoURL       *string `json:"videoURL,omitempty"`
	ThumbnailURL   *string `json:"thumbnailURL,omitempty"`
	ComponentType  string  `json:"componentType"`
	ComponentProps string  `json:"componentProps"`
	Secret         bool    `json:"secret"`
	InitialValue   *string `json:"initialValue,omitempty"`
}

type K8sActualNamespace struct {
	Name             string             `json:"name"`
	AutoInstrumented *bool              `json:"autoInstrumented,omitempty"`
	K8sActualSources []*K8sActualSource `json:"k8sActualSources"`
}

type K8sActualSource struct {
	Namespace                  string          `json:"namespace"`
	Kind                       K8sResourceKind `json:"kind"`
	Name                       string          `json:"name"`
	ServiceName                *string         `json:"serviceName,omitempty"`
	AutoInstrumented           *bool           `json:"autoInstrumented,omitempty"`
	CreationTimestamp          *string         `json:"creationTimestamp,omitempty"`
	NumberOfInstances          *int            `json:"numberOfInstances,omitempty"`
	HasInstrumentedApplication bool            `json:"hasInstrumentedApplication"`
}

type K8sActualSourceRuntimeInfo struct {
	MainContainer *K8sActualSourceRuntimeInfoContainer `json:"mainContainer,omitempty"`
}

type K8sActualSourceRuntimeInfoContainer struct {
	ContainerName string              `json:"containerName"`
	Language      ProgrammingLanguage `json:"language"`
}

type K8sDesiredNamespaceInput struct {
	AutoInstrument *bool `json:"autoInstrument,omitempty"`
}

type K8sDesiredSourceInput struct {
	ServiceName    *string `json:"serviceName,omitempty"`
	AutoInstrument *bool   `json:"autoInstrument,omitempty"`
}

type K8sNamespaceID struct {
	Name string `json:"name"`
}

type K8sSourceID struct {
	Namespace string          `json:"namespace"`
	Kind      K8sResourceKind `json:"kind"`
	Name      string          `json:"name"`
}

type Mutation struct {
}

type Query struct {
}

type WorkloadInput struct {
	Kind      K8sResourceKind `json:"kind"`
	Name      string          `json:"name"`
	Namespace string          `json:"namespace"`
}

type ComputePlatformType string

const (
	ComputePlatformTypeK8s ComputePlatformType = "K8S"
	ComputePlatformTypeVM  ComputePlatformType = "VM"
)

var AllComputePlatformType = []ComputePlatformType{
	ComputePlatformTypeK8s,
	ComputePlatformTypeVM,
}

func (e ComputePlatformType) IsValid() bool {
	switch e {
	case ComputePlatformTypeK8s, ComputePlatformTypeVM:
		return true
	}
	return false
}

func (e ComputePlatformType) String() string {
	return string(e)
}

func (e *ComputePlatformType) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = ComputePlatformType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid ComputePlatformType", str)
	}
	return nil
}

func (e ComputePlatformType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type K8sResourceKind string

const (
	K8sResourceKindDeployment  K8sResourceKind = "Deployment"
	K8sResourceKindDaemonSet   K8sResourceKind = "DaemonSet"
	K8sResourceKindStatefulSet K8sResourceKind = "StatefulSet"
)

var AllK8sResourceKind = []K8sResourceKind{
	K8sResourceKindDeployment,
	K8sResourceKindDaemonSet,
	K8sResourceKindStatefulSet,
}

func (e K8sResourceKind) IsValid() bool {
	switch e {
	case K8sResourceKindDeployment, K8sResourceKindDaemonSet, K8sResourceKindStatefulSet:
		return true
	}
	return false
}

func (e K8sResourceKind) String() string {
	return string(e)
}

func (e *K8sResourceKind) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = K8sResourceKind(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid K8sResourceKind", str)
	}
	return nil
}

func (e K8sResourceKind) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type ProgrammingLanguage string

const (
	ProgrammingLanguageUnspecified ProgrammingLanguage = "Unspecified"
	ProgrammingLanguageJava        ProgrammingLanguage = "Java"
	ProgrammingLanguageGo          ProgrammingLanguage = "Go"
	ProgrammingLanguageJavaScript  ProgrammingLanguage = "JavaScript"
	ProgrammingLanguagePython      ProgrammingLanguage = "Python"
	ProgrammingLanguageDotNet      ProgrammingLanguage = "DotNet"
)

var AllProgrammingLanguage = []ProgrammingLanguage{
	ProgrammingLanguageUnspecified,
	ProgrammingLanguageJava,
	ProgrammingLanguageGo,
	ProgrammingLanguageJavaScript,
	ProgrammingLanguagePython,
	ProgrammingLanguageDotNet,
}

func (e ProgrammingLanguage) IsValid() bool {
	switch e {
	case ProgrammingLanguageUnspecified, ProgrammingLanguageJava, ProgrammingLanguageGo, ProgrammingLanguageJavaScript, ProgrammingLanguagePython, ProgrammingLanguageDotNet:
		return true
	}
	return false
}

func (e ProgrammingLanguage) String() string {
	return string(e)
}

func (e *ProgrammingLanguage) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = ProgrammingLanguage(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid ProgrammingLanguage", str)
	}
	return nil
}

func (e ProgrammingLanguage) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type SignalType string

const (
	SignalTypeTraces  SignalType = "TRACES"
	SignalTypeMetrics SignalType = "METRICS"
	SignalTypeLogs    SignalType = "LOGS"
)

var AllSignalType = []SignalType{
	SignalTypeTraces,
	SignalTypeMetrics,
	SignalTypeLogs,
}

func (e SignalType) IsValid() bool {
	switch e {
	case SignalTypeTraces, SignalTypeMetrics, SignalTypeLogs:
		return true
	}
	return false
}

func (e SignalType) String() string {
	return string(e)
}

func (e *SignalType) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = SignalType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid SignalType", str)
	}
	return nil
}

func (e SignalType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type SpanKind string

const (
	SpanKindInternal SpanKind = "Internal"
	SpanKindServer   SpanKind = "Server"
	SpanKindClient   SpanKind = "Client"
	SpanKindProducer SpanKind = "Producer"
	SpanKindConsumer SpanKind = "Consumer"
)

var AllSpanKind = []SpanKind{
	SpanKindInternal,
	SpanKindServer,
	SpanKindClient,
	SpanKindProducer,
	SpanKindConsumer,
}

func (e SpanKind) IsValid() bool {
	switch e {
	case SpanKindInternal, SpanKindServer, SpanKindClient, SpanKindProducer, SpanKindConsumer:
		return true
	}
	return false
}

func (e SpanKind) String() string {
	return string(e)
}

func (e *SpanKind) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = SpanKind(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid SpanKind", str)
	}
	return nil
}

func (e SpanKind) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}
