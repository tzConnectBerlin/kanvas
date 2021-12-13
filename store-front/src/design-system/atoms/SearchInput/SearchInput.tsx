import styled from '@emotion/styled';
import SearchRounded from '@mui/icons-material/SearchRounded';

import { forwardRef } from 'react';
import {
    Theme,
    useMediaQuery,
    InputBase as MInputBase,
    InputBaseProps as MInputBaseProps,
} from '@mui/material';
import { ArrowBackIosNew } from '@mui/icons-material';

interface InputBaseProps extends MInputBaseProps {
    open: boolean;
    closeResult?: Function;
}

interface MInputBasePropsStyled {
    theme?: Theme;
}

const Search = styled.div<{ theme?: Theme }>`
    cursor: pointer;

    background: ${(props) => props.theme.palette.background.paper};
    transition: width 0.3s;

    width: 23rem;
    min-width: 23rem;
    height: 2.5rem !important;
    transition: width 0.3s;

    display: flex;
    align-items: center;

    border-radius: 2rem !important;

    &:active {
        transition: width 0.2s;
        filter: drop-shadow(0px 0px 6px #98989833);
    }

    &:focus-within {
        width: 35rem;
        transition: width 0.2s;

        @media (max-width: 874px) {
            width: 100%;
        }
    }

    @media (max-width: 874px) {
        display: flex;
        width: 2.5rem;
        min-width: 2.5rem;
        flex-direction: row-reverse;
        background-color: ${(props) => props.theme.palette.background.default};

        &:focus-within {
            min-width: calc(100vw - 5.7rem);
            background-color: ${(props) => props.theme.palette.background.paper};
        }
    }
`;

const SearchIconWrapper = styled.div<{ theme?: Theme }>`
    border-radius: 2rem;

    position: absolute;

    height: 2.1rem;
    width: 2.5rem !important;
    pointer-events: none;
    background-color: ${(props) => props.theme.palette.background.default};
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 30;

    @media (max-width: 874px) {
        background-color: ${(props) => props.theme.palette.background.paper};
    }
`;

const StyledSearchRounded = styled(SearchRounded)`
    color: #c4c4c4 !important;
`;

const StyledInputBase = styled(MInputBase)<MInputBasePropsStyled>`
    color: inherit;
    padding-left: 40px;
    height: 100%;
    width: 100%;
    cursor: pointer;
    padding-left: 2.5rem !important;
    transition: outline 0.2s;
    border-radius: 2rem;

    background-color: ${(props) => props.theme.palette.background.default};

    outline: solid 1px #C4C4C4;

    :hover {
        outline: solid 2px #C4C4C4;
    }

    &.MuiInputBase-root {
        font-family: 'Poppins Medium' !important;
    }

    &.MuiInputBase-input {
        padding: theme.spacing(1, 1, 1, 0);

        padding-left: 40px;
        transition: width 0.2s, opacity 0.2s;

        opacity: 0;
        width: '12ch';

        &:focus {
            width: 40rem;
            height: 100rem;
            opacity: 1;
        }
    }

    @media (max-width: 874px) {
        padding-left: 0;
        padding-left: 0.5rem !important;
        min-width: 2.1rem;
        outline: none;
        background-color: ${(props) => props.theme.palette.background.paper};
    }
`;

export const SearchInput = forwardRef<HTMLInputElement, InputBaseProps>(
    ({ ...props }, ref) => {
        return (
            <Search>
                <SearchIconWrapper>
                    <StyledSearchRounded fontSize="small" />
                </SearchIconWrapper>
                <StyledInputBase
                    inputRef={ref}
                    inputProps={{ 'aria-label': 'search' }}
                    onChange={props.onChange}
                    onFocus={props.onFocus}
                    onBlur={props.onBlur}
                />
            </Search>
        );
    },
);
