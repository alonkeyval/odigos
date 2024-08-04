import React, { useEffect, useState } from 'react';
import {
  Button,
  Modal,
  NavigationButtons,
  SectionTitle,
  Text,
} from '@/reuseable-components';
import styled from 'styled-components';
import Image from 'next/image';
import theme from '@/styles/theme';
import { useQuery } from '@apollo/client';
import { GET_DESTINATION_TYPE } from '@/graphql';

const AddDestinationButtonWrapper = styled.div`
  width: 100%;
  margin-top: 24px;
`;

const AddDestinationButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
`;

export function ChooseDestinationContainer() {
  const { data, loading, error } = useQuery(GET_DESTINATION_TYPE);
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);
  const handleSubmit = () => {
    console.log('Action submitted');
    setModalOpen(false);
  };

  useEffect(() => {
    if (error) {
      console.error('Error fetching destination types', error);
    }
    console.log({ data });
  }, [data, error]);

  return (
    <>
      <SectionTitle
        title="Configure destinations"
        description="Add backend destinations where collected data will be sent and configure their settings."
      />
      <AddDestinationButtonWrapper>
        <AddDestinationButton
          variant="secondary"
          onClick={() => handleOpenModal()}
        >
          <Image
            src="/icons/common/plus.svg"
            alt="back"
            width={16}
            height={16}
          />
          <Text
            color={theme.colors.secondary}
            size={14}
            decoration={'underline'}
            family="secondary"
          >
            ADD DESTINATION
          </Text>
        </AddDestinationButton>
        <Modal
          isOpen={isModalOpen}
          actionComponent={
            <NavigationButtons
              buttons={[
                // {
                //   label: 'BACK',
                //   iconSrc: '/icons/common/arrow-white.svg',
                //   onClick: () => {},
                //   variant: 'secondary',
                // },
                {
                  label: 'NEXT',
                  iconSrc: '/icons/common/arrow-black.svg',
                  onClick: () => {},
                  variant: 'primary',
                },
              ]}
            />
          }
          header={{
            title: 'Modal Title',
          }}
          onClose={handleCloseModal}
        >
          <p>This is the modal content.</p>
        </Modal>
      </AddDestinationButtonWrapper>
    </>
  );
}