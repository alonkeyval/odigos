import React from 'react';
import { Theme } from '@odigos/ui-theme';
import { type ActionInput } from '@/types';
import ActionCustomFields from './custom-fields';
import styled, { useTheme } from 'styled-components';
import { type ActionOption } from '@odigos/ui-utils';
import { CheckCircledIcon, CrossCircledIcon } from '@odigos/ui-icons';
import { DocsButton, Input, MonitorsCheckboxes, SectionTitle, Segment, Text, TextArea } from '@odigos/ui-components';

interface Props {
  isUpdate?: boolean;
  action: ActionOption;
  formData: ActionInput;
  formErrors: Record<string, string>;
  handleFormChange: (key: keyof ActionInput, val: any) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 4px;
`;

const FieldTitle = styled(Text)`
  margin-bottom: 12px;
`;

export const ActionFormBody: React.FC<Props> = ({ isUpdate, action, formData, formErrors, handleFormChange }) => {
  const theme = useTheme();

  return (
    <Container>
      {isUpdate && (
        <div>
          <FieldTitle>Status</FieldTitle>
          <Segment
            options={[
              { icon: CheckCircledIcon, label: 'active', value: false, selectedBgColor: theme.text.success + Theme.hexPercent['050'] },
              { icon: CrossCircledIcon, label: 'inactive', value: true, selectedBgColor: theme.text.error + Theme.hexPercent['050'] },
            ]}
            selected={formData.disable}
            setSelected={(bool) => handleFormChange('disable', bool)}
          />
        </div>
      )}

      {!isUpdate && <SectionTitle title='' description={action.docsDescription as string} actionButton={<DocsButton endpoint={action.docsEndpoint} />} />}

      <MonitorsCheckboxes
        title='Signals for Processing'
        required
        allowedSignals={action.allowedSignals}
        selectedSignals={formData['signals']}
        setSelectedSignals={(value) => handleFormChange('signals', value)}
        errorMessage={formErrors['signals']}
      />

      {!isUpdate && (
        <Input
          title='Action name'
          placeholder='Use a name that describes the action'
          value={formData['name']}
          onChange={({ target: { value } }) => handleFormChange('name', value)}
          errorMessage={formErrors['name']}
        />
      )}

      <ActionCustomFields actionType={action.type} value={formData['details']} setValue={(val) => handleFormChange('details', val)} errorMessage={formErrors['details']} />

      <TextArea title='Notes' value={formData['notes']} onChange={({ target: { value } }) => handleFormChange('notes', value)} errorMessage={formErrors['notes']} />
    </Container>
  );
};
