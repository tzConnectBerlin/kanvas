import styled from '@emotion/styled';

import { FC } from 'react';
import { CircularProgress, Theme } from '@mui/material';

interface CircularProgressProps {
    height: number;
    theme?: Theme;
    sx?: any;
}

const StyledCircularProgress = styled(CircularProgress)<CircularProgressProps>`
    height: ${(props) => props.height}rem !important;
    width: ${(props) => props.height}rem !important;
    color: ${(props) => props.theme.palette.primary.dark} !important;
`;

export const CustomCircularProgress: FC<CircularProgressProps> = ({
    ...props
}) => {
    return <StyledCircularProgress height={props.height} sx={props.sx} />;
};
