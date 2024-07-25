import Image from 'next/image';
import React from 'react';
import styled, { css } from 'styled-components';
import { Text } from '../text';
import { Tooltip } from '../tooltip';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  errorMessage?: string;
  title?: string;
  tooltip?: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
`;

const InputWrapper = styled.div<{
  isDisabled?: boolean;
  hasError?: boolean;
  isActive?: boolean;
}>`
  width: 100%;
  display: flex;
  align-items: center;
  height: 36px;
  gap: 12px;
  padding: 0 12px;
  transition: border-color 0.3s;
  border-radius: 32px;
  border: 1px solid rgba(249, 249, 249, 0.24);
  ${({ isDisabled }) =>
    isDisabled &&
    css`
      background-color: #555;
      cursor: not-allowed;
      opacity: 0.6;
    `}

  ${({ hasError }) =>
    hasError &&
    css`
      border-color: red;
    `}

  ${({ isActive }) =>
    isActive &&
    css`
      border-color: ${({ theme }) => theme.colors.secondary};
    `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.secondary};
  }
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.secondary};
  }
`;

const StyledInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: none;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.font_family.primary};
    opacity: 0.4;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 22px; /* 157.143% */
  }

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary};
  }

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const ErrorWrapper = styled.div`
  position: relative;
`;

const ErrorMessage = styled(Text)`
  color: red;
  font-size: 12px;
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
`;

const Title = styled(Text)`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Input: React.FC<InputProps> = ({
  icon,
  buttonLabel,
  onButtonClick,
  errorMessage,
  title,
  tooltip,
  ...props
}) => {
  return (
    <Container>
      <Tooltip text={tooltip || 'sddfsdf'}>
        <HeaderWrapper>
          <Title>{title}</Title>
          {tooltip && (
            <Image src="/icons/common/info.svg" alt="" width={16} height={16} />
          )}
        </HeaderWrapper>
      </Tooltip>

      <InputWrapper
        isDisabled={props.disabled}
        hasError={!!errorMessage}
        isActive={!!props.autoFocus}
      >
        {icon && (
          <IconWrapper>
            <Image src={icon} alt="" width={14} height={14} />
          </IconWrapper>
        )}
        <StyledInput {...props} />
        {buttonLabel && onButtonClick && (
          <Button onClick={onButtonClick} disabled={props.disabled}>
            {buttonLabel}
          </Button>
        )}
      </InputWrapper>
      {errorMessage && (
        <ErrorWrapper>
          <ErrorMessage>{errorMessage}</ErrorMessage>
        </ErrorWrapper>
      )}
    </Container>
  );
};

export { Input };
