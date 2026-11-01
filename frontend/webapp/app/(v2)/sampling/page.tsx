'use client';

import React from 'react';
import { SamplingRulesNext } from '@odigos/ui-kit/containers';

// Sampling rules + k8s health probes config + workload list now flow via
// `useOdigosApi()` inside the kit container.
export default function Page() {
  // PLAT-1605 spike: shadcn version of the sampling page (swap back to `SamplingRules` to compare).
  return <SamplingRulesNext />;
}
