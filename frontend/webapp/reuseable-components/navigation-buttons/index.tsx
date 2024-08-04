import React from 'react';
import Image from 'next/image';
import { Text } from '../text';
import { Button } from '../button';
import theme from '@/styles/theme';
import styled from 'styled-components';

interface NavigationButtonProps {
  label: string;
  iconSrc?: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

interface NavigationButtonsProps {
  buttons: NavigationButtonProps[];
}

const ButtonsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const StyledButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ButtonText = styled(Text)`
  text-decoration: underline;
`;

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  buttons,
}) => {
  function renderBackButton({
    button,
    index,
  }: {
    button: NavigationButtonProps;
    index: number;
  }) {
    return (
      buttons.length > 0 &&
      buttons[0].label === 'BACK' &&
      button.iconSrc &&
      index === 0
    );
  }
  return (
    <ButtonsContainer>
      {buttons.map((button, index) => (
        <StyledButton
          key={index}
          variant={button.variant || 'secondary'}
          onClick={button.onClick}
          disabled={button.disabled}
        >
          {renderBackButton({ button, index }) && (
            <Image
              src={button?.iconSrc || ''}
              alt={button.label}
              width={8}
              height={12}
            />
          )}
          <ButtonText
            color={
              button.variant === 'primary'
                ? theme.colors.dark_grey
                : theme.colors.secondary
            }
            size={14}
            family="secondary"
          >
            {button.label}
          </ButtonText>
          {button.iconSrc && !renderBackButton({ button, index }) && (
            <Image
              src={button.iconSrc}
              alt={button.label}
              width={8}
              height={12}
            />
          )}
        </StyledButton>
      ))}
    </ButtonsContainer>
  );
};