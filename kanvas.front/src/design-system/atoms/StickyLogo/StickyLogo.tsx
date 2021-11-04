import styled from '@emotion/styled';
import { Theme } from '@mui/material';

import { FC } from 'react';
import { Link } from 'react-router-dom';

interface StickyLogoProps {
    display: boolean;
}

const ImgStyled = styled.img<{theme?: Theme}>`
    filter: ${props => props.theme.logo.filter ?? 'invert(0%)'};
    height: 2.5rem;
    transition: height 0.2s;

    @media (max-width: 650px) {
        height: 2.8rem;
        transition: height 0.2s;
    }
`

const LinkStyled = styled(Link)<StickyLogoProps>`
    @media (max-width: 875px) {
        opacity: ${props => props.display ? '1' : '0'};
    }

    transition: 0.2s;
    position: absolute;

    align-items: center;
`

export const StickyLogo : FC<StickyLogoProps> = ({...props}) => {

    return (
        <LinkStyled to='/' display={props.display}>
            <ImgStyled alt='Sticky Logo' src={'/img/Logo.svg'} />
        </LinkStyled>
    );
  }
