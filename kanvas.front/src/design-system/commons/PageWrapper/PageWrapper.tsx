import styled from '@emotion/styled';
import { Theme } from '@mui/material';

export const PageWrapper = styled.div<{ theme?: Theme }>`
    min-height: 50vh;

    @media (min-height: 820px) {
        min-height: 82vh;
    }

    @media (min-height: 900px) {
        min-height: 85vh;
    }

    @media (min-height: 1100px) {
        min-height: 88vh;
    }

    @media (min-height: 1439px) {
        min-height: 89vh;
    }

    @media (min-height: 1500px) {
        min-height: 90vh;
    }

    display: flex;
    align-items: flex-start;
    justify-content: center;
    background-color: ${props => props.theme.palette.background.default};

    padding-left: 6rem;
    padding-right: 6rem;

    transition: all 0.2s;

    @media (max-width: 1100px) {
        padding-left: 6rem;
        padding-right: 6em;
    }

    @media (max-width: 650px) {
        padding-left: 4rem;
        padding-right: 4rem;
    }
`
