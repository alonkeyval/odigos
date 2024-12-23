/*
Copyright 2022.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// Code generated by applyconfiguration-gen. DO NOT EDIT.

package v1alpha1

import (
	v1alpha1 "github.com/odigos-io/odigos/api/odigos/v1alpha1"
)

// SourceFilterApplyConfiguration represents a declarative configuration of the SourceFilter type for use
// with apply.
type SourceFilterApplyConfiguration struct {
	Mode       *v1alpha1.SourceFilterMode `json:"mode,omitempty"`
	Namespaces []string                   `json:"namespaces,omitempty"`
	Groups     []string                   `json:"groups,omitempty"`
}

// SourceFilterApplyConfiguration constructs a declarative configuration of the SourceFilter type for use with
// apply.
func SourceFilter() *SourceFilterApplyConfiguration {
	return &SourceFilterApplyConfiguration{}
}

// WithMode sets the Mode field in the declarative configuration to the given value
// and returns the receiver, so that objects can be built by chaining "With" function invocations.
// If called multiple times, the Mode field is set to the value of the last call.
func (b *SourceFilterApplyConfiguration) WithMode(value v1alpha1.SourceFilterMode) *SourceFilterApplyConfiguration {
	b.Mode = &value
	return b
}

// WithNamespaces adds the given value to the Namespaces field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, values provided by each call will be appended to the Namespaces field.
func (b *SourceFilterApplyConfiguration) WithNamespaces(values ...string) *SourceFilterApplyConfiguration {
	for i := range values {
		b.Namespaces = append(b.Namespaces, values[i])
	}
	return b
}

// WithGroups adds the given value to the Groups field in the declarative configuration
// and returns the receiver, so that objects can be build by chaining "With" function invocations.
// If called multiple times, values provided by each call will be appended to the Groups field.
func (b *SourceFilterApplyConfiguration) WithGroups(values ...string) *SourceFilterApplyConfiguration {
	for i := range values {
		b.Groups = append(b.Groups, values[i])
	}
	return b
}
