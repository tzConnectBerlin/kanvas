import styled from '@emotion/styled';
import { FC } from 'react';
import { Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Typography from '../Typography';

interface CopyrightProps {
    profile?: boolean;
    theme?: Theme;
    sx?: any;
}

const StyledLink = styled(Link)<{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.text.primary};
    text-decoration: none;

    &.active {
        p {
            font-family: 'Poppins Medium' !important;
            color: ${(props) => props.theme.palette.text.primary} !important;
        }
    }
`;

export const Copyright: FC<CopyrightProps> = ({
    profile = false,
    ...props
}) => {
    const { t } = useTranslation(['translation']);

    return (
        <Typography
            weight="Light"
            size="body"
            sx={{ lineHeight: '1', fontSize: '.7rem', marginRight: '1rem' }}
        >
            {'© '}
            <StyledLink to="/" target="_blank" style={{ margin: '0 .3rem' }}>
                TZconnect{' '}
            </StyledLink>
            {` ${new Date().getFullYear()}`}
        </Typography>
    );
};
