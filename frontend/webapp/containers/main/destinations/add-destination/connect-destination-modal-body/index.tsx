import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { SideMenu } from '@/components';
import { useQuery } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { addConfiguredDestination } from '@/store';
import { TestConnection } from '../test-connection';
import { GET_DESTINATION_TYPE_DETAILS } from '@/graphql';
import { Body, Container, SideMenuWrapper } from '../styled';
import { useConnectDestinationForm, useConnectEnv } from '@/hooks';
import { DynamicConnectDestinationFormFields } from '../dynamic-form-fields';
import {
  StepProps,
  DynamicField,
  ExportedSignals,
  DestinationInput,
  DestinationTypeItem,
  DestinationDetailsResponse,
  ConfiguredDestination,
} from '@/types';
import {
  CheckboxList,
  Divider,
  Input,
  NotificationNote,
  SectionTitle,
} from '@/reuseable-components';

const SIDE_MENU_DATA: StepProps[] = [
  {
    title: 'DESTINATIONS',
    state: 'finish',
    stepNumber: 1,
  },
  {
    title: 'CONNECTION',
    state: 'active',
    stepNumber: 2,
  },
];

const FormContainer = styled.div`
  display: flex;
  width: 100%;
  max-width: 500px;
  flex-direction: column;
  gap: 24px;
  height: 443px;
  overflow-y: auto;
  padding-right: 16px;
  box-sizing: border-box;
  overflow: overlay;
  max-height: calc(100vh - 410px);

  @media (height < 768px) {
    max-height: calc(100vh - 350px);
  }
`;

const NotificationNoteWrapper = styled.div`
  margin-top: 24px;
`;

interface ConnectDestinationModalBodyProps {
  destination: DestinationTypeItem | undefined;
  onSubmitRef: React.MutableRefObject<(() => void) | null>;
  onFormValidChange: (isValid: boolean) => void;
}

export function ConnectDestinationModalBody({
  destination,
  onSubmitRef,
  onFormValidChange,
}: ConnectDestinationModalBodyProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [destinationName, setDestinationName] = useState<string>('');
  const [showConnectionError, setShowConnectionError] = useState(false);
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);
  const [exportedSignals, setExportedSignals] = useState<ExportedSignals>({
    logs: false,
    metrics: false,
    traces: false,
  });

  const dispatch = useDispatch();
  const { connectEnv } = useConnectEnv();
  const { buildFormDynamicFields } = useConnectDestinationForm();

  const { data } = useQuery<DestinationDetailsResponse>(
    GET_DESTINATION_TYPE_DETAILS,
    {
      variables: { type: destination?.type },
      skip: !destination,
    }
  );

  const monitors = useMemo(() => {
    if (!destination) return [];

    const { logs, metrics, traces } = destination.supportedSignals;

    setExportedSignals({
      logs: logs.supported,
      metrics: metrics.supported,
      traces: traces.supported,
    });

    return [
      logs.supported && { id: 'logs', title: 'Logs' },
      metrics.supported && { id: 'metrics', title: 'Metrics' },
      traces.supported && { id: 'traces', title: 'Traces' },
    ].filter(Boolean);
  }, [destination]);

  useEffect(() => {
    if (data && destination) {
      const df = buildFormDynamicFields(data.destinationTypeDetails.fields);

      const newDynamicFields = df.map((field) => {
        if (destination.fields && field?.name in destination.fields) {
          return {
            ...field,
            value: destination.fields[field.name],
            // initialValue: destination.fields[field.name],
          };
        }
        return field;
      });

      setDynamicFields(newDynamicFields);
    }
  }, [data, destination]);

  useEffect(() => {
    // Assign handleSubmit to the onSubmitRef so it can be triggered externally
    onSubmitRef.current = handleSubmit;
  }, [formData, destinationName, exportedSignals]);

  useEffect(() => {
    const isFormValid =
      dynamicFields.every(
        (field) =>
          formData[field.name] !== undefined && formData[field.name] !== ''
      ) && Object.keys(formData).length > 0;

    onFormValidChange(isFormValid);
  }, [formData]);

  function handleDynamicFieldChange(name: string, value: any) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setDynamicFields((prev) => {
      return prev.map((field) => {
        if (field.name === name) {
          return { ...field, value };
        }
        return field;
      });
    });
  }

  function handleSignalChange(signal: string, value: boolean) {
    setExportedSignals((prev) => ({ ...prev, [signal]: value }));
  }

  async function handleSubmit() {
    // Helper function to process field values
    function processFieldValue(field) {
      return field.componentType === 'dropdown'
        ? field.value.value
        : field.value;
    }

    // Prepare fields for the request body
    const fields = dynamicFields.map((field) => ({
      key: field.name,
      value: processFieldValue(field),
    }));

    // Function to store configured destination
    function storeConfiguredDestination() {
      const destinationTypeDetails = dynamicFields.map((field) => ({
        title: field.title,
        value: processFieldValue(field),
      }));

      // Add 'Destination name' as the first item
      destinationTypeDetails.unshift({
        title: 'Destination name',
        value: destinationName,
      });

      // Construct the configured destination object
      const storedDestination: ConfiguredDestination = {
        exportedSignals,
        destinationTypeDetails,
        type: destination?.type || '',
        imageUrl: destination?.imageUrl || '',
        category: '', // Could be handled in a more dynamic way if needed
        displayName: destination?.displayName || '',
      };

      // Dispatch action to store the destination
      dispatch(addConfiguredDestination(storedDestination));
    }

    // Prepare the request body
    const body: DestinationInput = {
      name: destinationName,
      type: destination?.type || '',
      exportedSignals,
      fields,
    };

    try {
      // Await connection and store the configured destination if successful
      await connectEnv(body, storeConfiguredDestination);
    } catch (error) {
      console.error('Failed to submit destination configuration:', error);
      // Handle error (e.g., show notification or alert)
    }
  }

  if (!destination) return null;

  return (
    <Container>
      <SideMenuWrapper>
        <SideMenu data={SIDE_MENU_DATA} currentStep={2} />
      </SideMenuWrapper>

      <Body>
        <SectionTitle
          title="Create connection"
          description="Connect selected destination with Odigos."
          actionButton={
            destination.testConnectionSupported ? (
              <TestConnection // TODO: refactor this after add form validation
                onError={() => setShowConnectionError(true)}
                destination={{
                  name: destinationName,
                  type: destination?.type || '',
                  exportedSignals,
                  fields: Object.entries(formData).map(([name, value]) => ({
                    key: name,
                    value,
                  })),
                }}
              />
            ) : (
              <></>
            )
          }
        />
        {showConnectionError && (
          <NotificationNoteWrapper>
            <NotificationNote
              type="error"
              text={
                'Connection failed. Please check your input and try once again.'
              }
            />
          </NotificationNoteWrapper>
        )}
        {destination.fields && !showConnectionError && (
          <NotificationNoteWrapper>
            <NotificationNote
              type="info"
              text={`Odigos autocompleted ${destination.displayName} connection details.`}
            />
          </NotificationNoteWrapper>
        )}
        <Divider margin="24px 0" />
        <FormContainer>
          <CheckboxList
            monitors={monitors as []}
            title="This connection will monitor:"
            exportedSignals={exportedSignals}
            handleSignalChange={handleSignalChange}
          />
          <Input
            title="Destination name"
            placeholder="Enter destination name"
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
          />
          <DynamicConnectDestinationFormFields
            fields={dynamicFields}
            onChange={handleDynamicFieldChange}
          />
        </FormContainer>
      </Body>
    </Container>
  );
}
