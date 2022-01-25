import styled from '@emotion/styled';
import CustomCircularProgress from '../CircularProgress';

import { FC } from 'react';
import { Typography } from '../Typography';
import {
    Button as MButton,
    ButtonProps as MButtonProps,
    Theme,
} from '@mui/material';

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
    textSize?: 'Light' | 'Medium' | 'SemiBold';
    onClick?: (e?: any) => void;

    loading?: boolean;

    icon?: any;

    verified?: boolean;
}

interface StyledButtonProps {
    verified?: boolean;
    bordercolor: string;
    theme?: Theme;
    primary: boolean;
}

const StyledButton = styled(MButton)<StyledButtonProps>`
    border-radius: 2rem;

    height: ${({ size }) =>
        size === 'large' ? '44px' : size === 'medium' ? '40px' : '38px'};

    padding: 0.3em 1.5em 0.4em;

    font-size: ${({ size }) =>
        size === 'large' ? '1.125rem' : size === 'medium' ? '0.975' : '0.8'};

    box-shadow: none;

    background-color: ${(props) =>
        props.verified
            ? ' #787878 '
            : ' #787878 '
            &&  'transparent'
           };

    border: solid 1px #787878;
    margin: 1px;
    text-transform: none;
    transition: outline 0.6s linear;

    &:hover {
        border: ${(props) => `solid 1px  #787878 `};
        box-shadow: none;
        background-color: ${(props) =>
            props.verified
                ? ' #787878 '
                : ' #787878 '
                && 'transparent'
    }

    &:active {
        border: 1px solid #787878;
        transition: outline 0.1s;

        box-shadow: none;
        background-color: ${(props) =>
            props.verified
            ? ' #787878 '
            : ' #787878 '
            && 'transparent'
    }

    &:disabled {
        border-color: transparent;
        outline: 1px solid #787878;

        svg {
            color: #9771ff !important;
        }

        p {
            color: #787878 !important;
        }
    }

    @media (max-width: 1100px) {
        height: ${({ size }) =>
            size === 'large' ? '40px' : size === 'medium' ? '38px' : '38px'};
        font-size: ${({ size }) =>
            size === 'large' ? '0.975rem' : size === 'medium' ? '0.8' : '0.8'};
    }

    @media (max-width: 600px) {
        height: 38px;
        font-size: 0.8rem;
    }

    p {
        color:  #787878  !important;
    }

    transition: all 0.1s linear;
`;

const StyledContainer = styled.div`
    display: flex;
    align-items: center;
`;

export const CustomButton: FC<CustomButtonProps> = ({
    primary = true,
    size = 'medium',
    backgroundColor,
    label,
    textSize = 'Medium',
    variant = 'contained',
    loading = false,
    ...props
}) => {
    return (
        <StyledButton
            variant={variant}
            bordercolor={'#e1e1e1'}
            size={size}
            verified={props.verified}
            {...props}
            primary={primary}
            disableRipple
            disabled={props.disabled}
        >
            {loading ? (
                <CustomCircularProgress height={1} />
            ) : (
                <StyledContainer>
                    {props.icon}
                    <Typography size="inherit" weight={textSize}>
                        {' '}
                        {label}{' '}
                    </Typography>
                </StyledContainer>
            )}
        </StyledButton>
    );
};
