import styled from '@emotion/styled';
import {
    Avatar as MAvatar,
    AvatarProps as MAvatarProps,
    Skeleton,
    Theme,
} from '@mui/material';
import { FC } from 'react';

export interface AvatarProps extends MAvatarProps {
    icon?: boolean;
    height?: number;
    width?: number;
    borderRadius?: number;
    theme?: Theme;
    loading?: boolean;
    responsive?: any;
}

const StyledAvatar = styled(MAvatar)<AvatarProps>`
    height: ${(props) => props.height ?? 40}px;
    width: ${(props) => props.width ?? 40}px;
    cursor: pointer;

    filter: ${(props) => props.theme.dropShadow.avatar};

    transition: all 0.2s;

    @media (max-width: 1100px) {
        height: ${(props) =>
            props.responsive
                ? (props.height ?? 40) * 0.7
                : props.height ?? 40}px;
        width: ${(props) =>
            props.responsive ? (props.width ?? 40) * 0.7 : props.width ?? 40}px;
    }

    @media (max-width: 600px) {
        height: ${(props) =>
            props.responsive
                ? (props.height ?? 40) * 0.6
                : props.height ?? 40}px;
        width: ${(props) =>
            props.responsive ? (props.width ?? 40) * 0.6 : props.width ?? 40}px;
    }

    @media (max-width: 400px) {
        height: ${(props) =>
            props.responsive
                ? (props.height ?? 40) * 0.55
                : props.height ?? 40}px;
        width: ${(props) =>
            props.responsive
                ? (props.width ?? 40) * 0.55
                : props.width ?? 40}px;
    }
`;

const StyledSkeleton = styled(Skeleton)<AvatarProps>`
    height: ${(props) => props.height ?? 40}px !important;
    width: ${(props) => props.width ?? 40}px !important;

    @media (max-width: 1100px) {
        height: ${(props) =>
            props.responsive
                ? (props.height ?? 40) * 0.7
                : props.height ?? 40}px !important;
        width: ${(props) =>
            props.responsive
                ? (props.width ?? 40) * 0.7
                : props.width ?? 40}px !important;
    }

    @media (max-width: 600px) {
        height: ${(props) =>
            props.responsive
                ? (props.height ?? 40) * 0.6
                : props.height ?? 40}px !important;
        width: ${(props) =>
            props.responsive
                ? (props.width ?? 40) * 0.6
                : props.width ?? 40}px !important;
    }

    @media (max-width: 400px) {
        height: ${(props) =>
            props.responsive
                ? (props.height ?? 40) * 0.55
                : props.height ?? 40}px !important;
        width: ${(props) =>
            props.responsive
                ? (props.width ?? 40) * 0.55
                : props.width ?? 40}px !important;
    }
`;

export const Avatar: FC<AvatarProps> = ({
    loading = false,
    responsive = false,
    height,
    width,
    onClick,
    ...props
}) => {
    return loading ? (
        <StyledSkeleton
            animation="pulse"
            variant="circular"
            width={width}
            height={height}
            responsive={`${responsive}`}
        />
    ) : (
        <StyledAvatar
            height={height}
            width={width}
            responsive={`${responsive}`}
            src={props.src}
            sx={{ bgcolor: '#e1e1e1', borderRadius: props.borderRadius }}
            onClick={onClick}
            aria-label="Avatar image"
        >
            {props.children}
        </StyledAvatar>
    );
};
