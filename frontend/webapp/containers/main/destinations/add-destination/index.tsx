import React, { useState } from 'react';
import styled from 'styled-components';
import { AddDestinationButton, SetupHeader } from '@/components';
import { SectionTitle } from '@/reuseable-components';
import { AddDestinationModal } from './add-destination-modal';
import { useRouter } from 'next/navigation';

const AddDestinationButtonWrapper = styled.div`
  width: 100%;
  margin-top: 24px;
`;

const ContentWrapper = styled.div`
  width: 640px;
  padding-top: 64px;
`;

const HeaderWrapper = styled.div`
  width: 100vw;
`;

export function ChooseDestinationContainer() {
  const [isModalOpen, setModalOpen] = useState(false);

  const router = useRouter();
  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <>
      <HeaderWrapper>
        <SetupHeader
          navigationButtons={[
            {
              label: 'BACK',
              iconSrc: '/icons/common/arrow-white.svg',
              onClick: () => router.back(),
              variant: 'secondary',
            },
            {
              label: 'DONE',
              // iconSrc: '/icons/common/arrow-black.svg',
              onClick: () => console.log('Next button clicked'),
              variant: 'primary',
            },
          ]}
        />
      </HeaderWrapper>
      <ContentWrapper>
        <SectionTitle
          title="Configure destinations"
          description="Add backend destinations where collected data will be sent and configure their settings."
        />
        <AddDestinationButtonWrapper>
          <AddDestinationButton onClick={() => handleOpenModal()} />
        </AddDestinationButtonWrapper>
        <AddDestinationModal
          isModalOpen={isModalOpen}
          handleCloseModal={handleCloseModal}
        />
      </ContentWrapper>
    </>
  );
}
