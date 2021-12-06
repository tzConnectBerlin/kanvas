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

    background: ${(props) => props.theme.button.background};
    transition: width 0.3s;

    width: 23rem;
    min-width: 23rem;
    height: 2.5rem !important;
    transition: width 0.3s;

    display: flex;
    align-items: center;

    border-radius: 0;

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
        max-height: 2.2rem;
        min-width: 3rem;
        padding-left: .2rem;
        display: flex;
        width: 2.3rem;
        min-width: 2.3rem;
        flex-direction: row-reverse;
        margin-right: 0.5rem;

        &:focus-within {
            min-width: calc(100vw - 5.7rem);
        }
    }
`;

const SearchIconWrapper = styled.div<{ theme?: Theme }>`
    position: absolute;
    height: 2.1rem;
    width: 2.3rem !important;
    pointer-events: none;
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

    background-color: ${(props) => props.theme.palette.background.default};

    outline: ${(props) => `solid 1px ${props.theme.palette.text.primary}`};

    :hover {
        outline: ${(props) => `solid 2px ${props.theme.palette.text.primary}`};
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
        min-width: 2.4rem;
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
