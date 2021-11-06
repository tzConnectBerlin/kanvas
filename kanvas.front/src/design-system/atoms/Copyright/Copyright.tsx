import styled from '@emotion/styled';
import { FC } from 'react';
import { Theme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Typography from '../Typography';


interface CopyrightProps {
    profile?: boolean;
    theme?: Theme;
}

const StyledLink = styled(Link)<{theme?: Theme}>`
color: ${props => props.theme.palette.text.primary};
text-decoration: none;

&.active {
    p {
        font-family: 'Poppins Medium' !important;
        color: ${props => props.theme.palette.text.primary} !important;
    }
}
`

export const  Copyright : FC<CopyrightProps> = ({profile=false, ...props}) => {
    const { t } = useTranslation(['translation']);
 
    return (    
        <Typography weight="Light" size="body" sx={{mt: '2.7rem', fontSize: '.7rem', marginRight: '1rem'}}>
            {'© '}
            <StyledLink to="/" target="_blank">
                TZconnect - 
            </StyledLink>
            {` ${new Date().getFullYear()}`}            
        </Typography>
    )
}