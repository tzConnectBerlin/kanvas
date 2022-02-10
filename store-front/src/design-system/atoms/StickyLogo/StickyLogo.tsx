import styled from '@emotion/styled';
import { Theme } from '@mui/material';

import { FC } from 'react';
import { Link } from 'react-router-dom';

interface StickyLogoProps {
    isdisplay?: any;
}

const ImgStyled = styled.img<{ theme?: Theme }>`
    filter: ${(props) => props.theme.logo.filter ?? 'invert(0%)'};
    height: 0.8rem;
    z-index: 90;
    transition: height 0.2s;

    @media (max-width: 600px) {
        height: 0.6rem;
        transition: height 0.2s;
    }
`;

const LinkStyled = styled(Link)<StickyLogoProps>`
    @media (max-width: 875px) {
        opacity: ${(props) => (props.isdisplay ? '1' : '0')};
    }

    transition: 0.2s;
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const StickyLogo: FC<StickyLogoProps> = ({ ...props }) => {
    return (
        <LinkStyled to="/" isdisplay={props.isdisplay}>
            <ImgStyled alt="Sticky Logo" src={'/img/Logo.svg'} />
        </LinkStyled>
    );
};
