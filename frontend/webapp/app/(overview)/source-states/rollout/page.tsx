'use client';

import React from 'react';
import { StatusCard, DataCard } from '@odigos/ui-kit/components/v2';
import { StatusType, OtherStatusType, OtherStatus } from '@odigos/ui-kit/types';

// ─── State definitions ────────────────────────────────────────────────────────

const ROLLOUT_STATES: { label: string; status: StatusType | OtherStatusType | OtherStatus; description: string }[] = [
  { label: 'Finished',           status: StatusType.Success,        description: 'Rollout completed successfully — all pods are running the new version.' },
  { label: 'Waiting for Rollout', status: OtherStatus.Loading,      description: 'Waiting for rollout to begin — pods are being scheduled.' },
  { label: 'Rollout In Progress', status: OtherStatus.Loading,      description: 'Rollout in progress — pods are being updated, some may be temporarily unavailable.' },
  { label: 'Rollout Finished',   status: StatusType.Success,        description: 'All pods have been updated and are healthy.' },
  { label: 'No Rollout Needed',  status: StatusType.Success,        description: 'No rollout is required — the current pod spec is already up to date.' },
  { label: 'Off',                status: OtherStatusType.Disabled,  description: 'Rollout management is disabled for this workload.' },
];

const ROLLBACK_STATES: { label: string; status: StatusType | OtherStatusType | OtherStatus; description: string; showAutoHeal?: boolean }[] = [
  { label: 'Waiting',            status: OtherStatus.Loading,      description: 'Waiting to determine rollback eligibility — checking pod health after instrumentation.' },
  { label: 'Rollback Occurred',  status: StatusType.Error,         description: 'Odigos detected a crash caused by instrumentation and rolled back automatically.', showAutoHeal: true },
  { label: 'Success',            status: StatusType.Success,       description: 'Workload is stable — no rollback was required after instrumentation.' },
  { label: 'Off',                status: OtherStatusType.Disabled, description: 'Rollback protection is disabled for this workload.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolloutStatesPage() {
  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', height: '100%', width: '100%' }}>

      <DataCard bgTint='1000' richTitle={{ title: 'Rollout Status' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLLOUT_STATES.map((state) => (
            <StatusCard key={state.label} status={state.status} title={state.label} description={state.description} />
          ))}
        </div>
      </DataCard>

      <DataCard bgTint='1000' richTitle={{ title: 'Rollback Status' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ROLLBACK_STATES.map((state) => (
            <div key={state.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <StatusCard status={state.status} title={state.label} description={state.description} />
              {state.showAutoHeal && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {}}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    Auto Heal
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </DataCard>

    </div>
  );
}
