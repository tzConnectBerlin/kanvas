import styled from '@emotion/styled';

import { FC } from 'react';
import { Theme, Typography as MTypography, TypographyProps as MTypographyProps } from '@mui/material';

export interface TypographyProps extends Omit<MTypographyProps, 'variant'> {
    weight: "Bold" | "Medium" | "Light";
    size?: | 'body1'
        | 'body2'
        | 'button'
        | 'caption'
        | 'h1'
        | 'h2'
        | 'h3'
        | 'h4'
        | 'h5'
        | 'h6'
        | 'inherit'
        | 'overline'
        | 'subtitle1'
        | 'subtitle2'
        | string;
    truncate?: boolean;
    margin?: string;
    lines?: number;
    color?: string;
    type?: 'link';
}

interface IStyledTypography {
    theme?: Theme;
    fontSize: string;
    margin?: string;
    lines?: number;
    color?: string;
    type?: string;
}

const StyledTypography = styled(MTypography)<IStyledTypography>`
    font-size: ${({ fontSize }) => fontSize};
    letter-spacing: 0;

    display: ${props => props.display ? 'block' : 'flex'};
    align-items: center;
    color: ${props => props.color? props.color : props.theme.palette.text.primary ?? 'black'} !important;

    &.truncate {
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: ${({ lines }) => lines};
    }

    :hover {
        cursor: pointer;
        text-decoration: ${props => props.type === 'link' ? 'underline' : 'none' };
    }
`

export const Typography : FC<TypographyProps> = ({size, weight, children, truncate, lines, ...props}, ref) => {
  
    const fontSize = size && (size.includes('em') || size.includes('px')) ? size : undefined;
    const variant = (size && !fontSize ? size : 'body1') as MTypographyProps['variant'];

    return (
        <StyledTypography
            className={truncate ? 'truncate ' + props.className : props.className}
            fontFamily={`Open Sans ${weight ? weight : 'Light'}`}
            fontSize={size === 'subtitle1' ? '1.1rem' : fontSize as any}
            lines={lines}
            variant={variant}
            color={props.color}
            align={props.align}
            sx={props.sx}
            display={props.display}
            {...props}
        >
            {children}
        </StyledTypography>
    )
}
