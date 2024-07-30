// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"fmt"
	"io"
	"strconv"
)

type ComputePlatform struct {
	Name                *string               `json:"name,omitempty"`
	ComputePlatformType ComputePlatformType   `json:"computePlatformType"`
	K8sActualNamespace  *K8sActualNamespace   `json:"k8sActualNamespace,omitempty"`
	K8sActualNamespaces []*K8sActualNamespace `json:"k8sActualNamespaces"`
	K8sActualSource     *K8sActualSource      `json:"k8sActualSource,omitempty"`
	K8sActualSources    []*K8sActualSource    `json:"k8sActualSources"`
}

type Condition struct {
	Type               string          `json:"type"`
	Status             ConditionStatus `json:"status"`
	LastTransitionTime *string         `json:"lastTransitionTime,omitempty"`
	Reason             *string         `json:"reason,omitempty"`
	Message            *string         `json:"message,omitempty"`
}

type GetConfigResponse struct {
	Installation InstallationStatus `json:"installation"`
}

type InstrumentedApplicationDetails struct {
	Containers []*SourceContainerRuntimeDetails `json:"containers,omitempty"`
	Conditions []*Condition                     `json:"conditions,omitempty"`
}

type K8sActualNamespace struct {
	Name                        string             `json:"name"`
	InstrumentationLabelEnabled *bool              `json:"instrumentationLabelEnabled,omitempty"`
	K8sActualSources            []*K8sActualSource `json:"k8sActualSources"`
}

type K8sActualSource struct {
	Namespace                      string                          `json:"namespace"`
	Kind                           K8sResourceKind                 `json:"kind"`
	Name                           string                          `json:"name"`
	ServiceName                    *string                         `json:"serviceName,omitempty"`
	NumberOfInstances              *int                            `json:"numberOfInstances,omitempty"`
	AutoInstrumented               bool                            `json:"autoInstrumented"`
	AutoInstrumentedDecision       string                          `json:"autoInstrumentedDecision"`
	InstrumentedApplicationDetails *InstrumentedApplicationDetails `json:"instrumentedApplicationDetails,omitempty"`
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

type SourceContainerRuntimeDetails struct {
	ContainerName string `json:"containerName"`
	Language      string `json:"language"`
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

type ConditionStatus string

const (
	ConditionStatusTrue    ConditionStatus = "True"
	ConditionStatusFalse   ConditionStatus = "False"
	ConditionStatusUnknown ConditionStatus = "Unknown"
)

var AllConditionStatus = []ConditionStatus{
	ConditionStatusTrue,
	ConditionStatusFalse,
	ConditionStatusUnknown,
}

func (e ConditionStatus) IsValid() bool {
	switch e {
	case ConditionStatusTrue, ConditionStatusFalse, ConditionStatusUnknown:
		return true
	}
	return false
}

func (e ConditionStatus) String() string {
	return string(e)
}

func (e *ConditionStatus) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = ConditionStatus(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid ConditionStatus", str)
	}
	return nil
}

func (e ConditionStatus) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}

type InstallationStatus string

const (
	InstallationStatusNew          InstallationStatus = "NEW"
	InstallationStatusAppsSelected InstallationStatus = "APPS_SELECTED"
	InstallationStatusFinished     InstallationStatus = "FINISHED"
)

var AllInstallationStatus = []InstallationStatus{
	InstallationStatusNew,
	InstallationStatusAppsSelected,
	InstallationStatusFinished,
}

func (e InstallationStatus) IsValid() bool {
	switch e {
	case InstallationStatusNew, InstallationStatusAppsSelected, InstallationStatusFinished:
		return true
	}
	return false
}

func (e InstallationStatus) String() string {
	return string(e)
}

func (e *InstallationStatus) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = InstallationStatus(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid InstallationStatus", str)
	}
	return nil
}

func (e InstallationStatus) MarshalGQL(w io.Writer) {
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
