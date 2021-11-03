import styled from '@emotion/styled';

import { FC } from 'react';
import { Badge, BadgeProps, Theme } from '@mui/material';

interface IBadge extends BadgeProps {
    profile?: boolean;
    theme?: Theme;
}

const StyledBadge = styled(Badge)<IBadge>`
    .MuiBadge-badge {
        transform: ${props => props.profile ? 'scale(1) translate(25%,-30%)' : props.badgeContent && props.badgeContent < 10 ? 'scale(1) translate(-65%,-35%)' : 'scale(1) translate(-20%,-45%)' };
        background-color: ${props => props.color === 'error' ? '#FB3E3E' : props.theme.palette.primary.dark };
        border: 2px solid ${props => props.theme.palette.background.default};
        display: ${props => props.badgeContent ? 'flex' : 'none'};
    }
`

export const CustomBadge : FC<IBadge> = ({profile=false, ...props}) => {
    return (
        <StyledBadge color={props.color} badgeContent={props.badgeContent} max={props.max} profile={profile}>
            { props.children }
        </StyledBadge>
    )
}