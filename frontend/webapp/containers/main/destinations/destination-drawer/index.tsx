import React, { useEffect, useMemo, useState } from 'react';
import buildCard from './build-card';
import styled from 'styled-components';
import { useDrawerStore } from '@/store';
import { type ActualDestination } from '@/types';
import buildDrawerItem from './build-drawer-item';
import OverviewDrawer from '../../overview/overview-drawer';
import { ACTION, CONDITION_STATUS, DATA_CARDS } from '@/utils';
import { DestinationFormBody } from '../destination-form-body';
import { ENTITY_TYPES, NOTIFICATION_TYPE } from '@odigos/ui-utils';
import { useDestinationCRUD, useDestinationFormData, useDestinationTypes } from '@/hooks';
import { ConditionDetails, ConditionDetailsProps, DataCard } from '@odigos/ui-components';

interface Props {}

const FormContainer = styled.div`
  width: 100%;
  height: 100%;
  max-height: calc(100vh - 220px);
  overflow: overlay;
  overflow-y: auto;
`;

const DataContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const DestinationDrawer: React.FC<Props> = () => {
  const { selectedItem, setSelectedItem } = useDrawerStore();
  const { destinations: destinationTypes } = useDestinationTypes();

  const { formData, formErrors, handleFormChange, resetFormData, validateForm, loadFormWithDrawerItem, destinationTypeDetails, dynamicFields, setDynamicFields } = useDestinationFormData({
    destinationType: (selectedItem?.item as ActualDestination)?.destinationType?.type,
    preLoadedFields: (selectedItem?.item as ActualDestination)?.fields,
    // TODO: supportedSignals: thisDestination?.supportedSignals,
    // currently, the real "supportedSignals" is being used by "destination" passed as prop to "DestinationFormBody"
  });

  const { destinations, updateDestination, deleteDestination } = useDestinationCRUD({
    onSuccess: (type) => {
      setIsEditing(false);
      setIsFormDirty(false);

      if (type === ACTION.DELETE) setSelectedItem(null);
      else reSelectItem();
    },
  });

  const reSelectItem = (fetchedItems?: typeof destinations) => {
    const { item } = selectedItem as { item: ActualDestination };
    const { id } = item;

    if (!!fetchedItems?.length) {
      const found = fetchedItems.find((x) => x.id === id);
      if (!!found) {
        return setSelectedItem({ id, type: ENTITY_TYPES.DESTINATION, item: found });
      }
    }

    setSelectedItem({ id, type: ENTITY_TYPES.DESTINATION, item: buildDrawerItem(id, formData, item) });
  };

  // This should keep the drawer up-to-date with the latest data
  useEffect(() => reSelectItem(destinations), [destinations]);

  const [isEditing, setIsEditing] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  const cardData = useMemo(() => {
    if (!selectedItem) return [];

    const { item } = selectedItem as { item: ActualDestination };
    const arr = buildCard(item, destinationTypeDetails);

    return arr;
  }, [selectedItem, destinationTypeDetails]);

  const conditionsData: ConditionDetailsProps = useMemo(() => {
    if (!selectedItem) return { conditions: [] };

    const { item } = selectedItem as { item: ActualDestination };

    return {
      conditions:
        item?.conditions?.map(({ status, message, lastTransitionTime }) => ({
          status: status === CONDITION_STATUS.FALSE ? NOTIFICATION_TYPE.ERROR : status === CONDITION_STATUS.TRUE ? NOTIFICATION_TYPE.SUCCESS : NOTIFICATION_TYPE.WARNING,
          message,
          lastTransitionTime,
        })) || [],
    };
  }, [selectedItem]);

  const thisDestinationType = useMemo(() => {
    if (!destinationTypes.length || !selectedItem || !isEditing) {
      resetFormData();
      return undefined;
    }

    const { item } = selectedItem as { item: ActualDestination };
    const found = destinationTypes.map(({ items }) => items.filter(({ type }) => type === item.destinationType.type)).filter((arr) => !!arr.length)?.[0]?.[0];

    loadFormWithDrawerItem(selectedItem);

    return found;
  }, [destinationTypes, selectedItem, isEditing]);

  if (!selectedItem?.item) return null;
  const { id, item } = selectedItem as { id: string; item: ActualDestination };

  const handleEdit = (bool?: boolean) => {
    setIsEditing(typeof bool === 'boolean' ? bool : true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsFormDirty(false);
  };

  const handleDelete = async () => {
    await deleteDestination(id);
  };

  const handleSave = async (newTitle: string) => {
    if (validateForm({ withAlert: true, alertTitle: ACTION.UPDATE })) {
      const title = newTitle !== item.destinationType.displayName ? newTitle : '';
      handleFormChange('name', title);
      await updateDestination(id, { ...formData, name: title });
    }
  };

  return (
    <OverviewDrawer
      title={item.name || item.destinationType.displayName}
      iconSrc={item.destinationType.imageUrl}
      isEdit={isEditing}
      isFormDirty={isFormDirty}
      onEdit={handleEdit}
      onSave={handleSave}
      onDelete={handleDelete}
      onCancel={handleCancel}
    >
      {isEditing ? (
        <FormContainer>
          <DestinationFormBody
            isUpdate
            destination={thisDestinationType}
            formData={formData}
            formErrors={formErrors}
            validateForm={validateForm}
            handleFormChange={(...params) => {
              setIsFormDirty(true);
              handleFormChange(...params);
            }}
            dynamicFields={dynamicFields}
            setDynamicFields={(...params) => {
              setIsFormDirty(true);
              setDynamicFields(...params);
            }}
          />
        </FormContainer>
      ) : (
        <DataContainer>
          <ConditionDetails conditions={conditionsData.conditions} />
          <DataCard title={DATA_CARDS.DESTINATION_DETAILS} data={cardData} />
        </DataContainer>
      )}
    </OverviewDrawer>
  );
};
