import styled from '@emotion/styled';

import React, { FC, useState } from 'react';
import { Typography } from '../Typography';
import { Button as MButton, ButtonProps as MButtonProps, Theme } from '@mui/material';
import CustomCircularProgress from '../CircularProgress';
import { ClearRounded } from '@mui/icons-material';

export interface CustomButtonProps extends MButtonProps {
  /**
   * Is this the principal call to action on the page?
   */
  primary?: boolean;
  /**
   * What background color to use
   */
  backgroundColor?: string;
  /**
   * How large should the button be?
   */
  size?: 'small' | 'medium' | 'large';
  /**
   * Button contents
   */
  label: string;
  /**
   * Optional click handler
   */
  textSize?: 'Light' | 'Medium' | 'SemiBold'
  onClick?: () => void;

  loading?: boolean;

  icon?: any;

  verified?: boolean
}

interface StyledButtonProps {
  verified?: boolean
  bordercolor: string;
  theme?: Theme;
  primary: boolean
}

const StyledClearContent = styled(ClearRounded)<{theme?: Theme}>`
    color: ${props => props.theme.palette.background.default};
    padding-right: 0.5rem;
    transition: all 0.2s;
`

const StyledButton = styled(MButton)<StyledButtonProps>`
  border-radius: 0;

  height: ${({ size }) => size === 'large' ? '44px' : size === 'medium' ? '40px' : '38px'};

  padding: 0.2em 1.5em 0.4em;

  font-size: ${({ size }) => size === 'large' ? '1.125rem' : size === 'medium' ? '0.975' : '0.8'};


  box-shadow: none;

  background-color: ${props => props.verified ? props.theme.palette.text.primary : !props.primary ? 'transparent' : props.theme.button.background } ;

  outline: ${props => `solid 1px ${props.theme.palette.text.primary}`};
  margin: 1px;
  text-transform: none;
  transition: outline 0.6s linear;

  &:hover {
    outline: ${props => `solid 2px ${props.theme.palette.text.primary}`};
    border: ${({ bordercolor }) => bordercolor !== '' ? "solid 1px #0088a7" : ''};
    box-shadow: none;
    background-color: ${props => props.verified ? props.theme.palette.text.primary : !props.primary ? 'transparent' : props.theme.button.background } ;
  }

  &:active {
      outline: ${({ bordercolor }) => bordercolor !== '' ? '' : 'drop-shadow(0px 0px 6px #98989833)'};
      border: ${({ bordercolor }) => bordercolor !== '' ? "solid 1px #ffb494" : `solid 1px black`};
      box-shadow: none;
      background-color: ${props => props.verified ? props.theme.palette.text.primary : !props.primary ? 'transparent' : props.theme.button.background } ;
  }

  &:disabled {
    border-color: transparent;
  }

  @media (max-width: 1100px) {
    height: ${({ size }) => size === 'large' ? '40px' : size === 'medium' ? '38px' : '38px'};
    font-size: ${({ size }) => size === 'large' ? '0.975rem' : size === 'medium' ? '0.8' : '0.8'};
  }

  @media (max-width: 650px) {
    height: 38px;
    font-size: 0.8rem;
  }

  p {
    color: ${props => props.verified ? props.theme.palette.background.default : props.theme.palette.text.primary } !important;
  }

  transition: all 0.1s linear;
`;

const StyledContainer = styled.div`
  display: flex;
  align-items: center;

`

export const CustomButton : FC<CustomButtonProps> = ({
  primary = true,
  size = 'medium',
  backgroundColor,
  label,
  textSize = 'Medium',
  variant = 'contained',
  loading = false,
  ...props
}) => {

  const [isHover, setIsHover] = useState(false)

  return (
    <StyledButton
      variant={variant}
      bordercolor={primary ? '' : '#e1e1e1'}
      size={size}
      verified={props.verified}
      {...props}
      primary={primary}
      disableRipple
    >
        {
            loading ?
                <CustomCircularProgress height={1} />
            :
                (
                    <StyledContainer onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
                        {
                            props.verified && isHover ?
                              <StyledClearContent />
                            :
                              props.icon
                        }
                        <Typography size="inherit" weight={textSize}> {label} </Typography>
                    </StyledContainer>
                )
        }
    </StyledButton>
  );
};
