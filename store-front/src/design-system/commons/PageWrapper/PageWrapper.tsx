import styled from '@emotion/styled'
import { Theme } from '@mui/material'

export const PageWrapper = styled.div<{ theme?: Theme }>`
    min-height: 102vh;

    display: flex;
    align-items: flex-start;
    justify-content: center;
    background-color: ${(props) => props.theme.palette.background.default};

    padding-left: 6rem;
    padding-right: 6rem;

    transition: all 0.2s;

    @media (max-width: 1100px) {
        padding-left: 4rem;
        padding-right: 4em;
    }

    @media (max-width: 650px) {
        padding-left: 2rem;
        padding-right: 2rem;
    }

    @media (max-width: 650px) {
        padding-left: 0;
        padding-right: 0;
    }
`
