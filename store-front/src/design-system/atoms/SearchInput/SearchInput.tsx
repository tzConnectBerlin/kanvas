import styled from '@emotion/styled';
import SearchRounded from '@mui/icons-material/SearchRounded';

import { forwardRef } from 'react';
import {
    Theme,
    InputBase as MInputBase,
    InputBaseProps as MInputBaseProps,
} from '@mui/material';
import { ArrowBackIosNew } from '@mui/icons-material';

interface InputBaseProps extends MInputBaseProps {
    open: boolean;
    searchOpen: boolean;
    isMobile: boolean;
    closeResult?: Function;
}

interface MInputBasePropsStyled {
    theme?: Theme;
    searchOpen: boolean;
}

const Search = styled.div<{ theme?: Theme, searchOpen: boolean }>`
    cursor: pointer;
    z-index: 90;

    height: 2.5rem !important;

    display: flex;
    align-items: center;

    min-width: ${props => props.searchOpen ? '35rem' : '2.5rem'};

    flex-direction: row;

    @media (max-width: 874px) {
        flex-direction: row-reverse;
        width: ${props => props.searchOpen ? '100%' : 'auto'};
        min-width: ${props => props.searchOpen ? 'calc(100vw - 5.7rem)' : '2.5rem'};
        border-bottom: none !important;
    }

    border-bottom: ${props => props.searchOpen ? `1px solid ${props.theme.palette.text.primary}` : ''};

    transition: width 0.3s, min-width 0.3s !important;
`;

const SearchIconWrapper = styled.div<{ theme?: Theme }>`
    border-radius: 2rem;

    position: absolute;

    height: 2.1rem;
    width: 2.5rem !important;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    cursor: pointer;
`;

const StyledSearchRounded = styled(SearchRounded)<{theme?: Theme, isMobile: boolean}>`
    color: ${props => props.theme.palette.text.primary};
    cursor: pointer;
    height: ${props => props.isMobile ? '1.6rem' : '1.7rem'};
    width: ${props => props.isMobile ? '1.6rem' : '1.7rem'};
`;

const StyledInputBase = styled(MInputBase)<MInputBasePropsStyled>`
    color: inherit;
    padding-left: 40px;
    height: 100%;

    padding-left: 2.5rem !important;
    border-radius: 2rem;

    &.MuiInputBase-root {
        font-family: 'Poppins Medium' !important;
        width: ${props => props.searchOpen ? '100%' : '0'} !important ;

        @media (max-width: 874px) {
            width: ${props => props.searchOpen ? '100%' : '1rem'} ;
        }
    }

    &.MuiInputBase-input {
        padding: theme.spacing(1, 1, 1, 0);

        padding-left: 40px;
        transition: width 0.3s, opacity 0.1s;

        opacity: ${props => props.searchOpen ? 1 : 0};
        height: 100%;
    }

    @media (max-width: 874px) {
        padding-left: 0 !important;
        min-width: 0;
        outline: none;
        cursor: ${props => props.searchOpen ? 'text' : 'pointer'} ;
    }
`;

export const SearchInput = forwardRef<HTMLInputElement, InputBaseProps>(
    ({ ...props }, ref) => {
        return (
            <Search searchOpen={props.searchOpen} onClick={props.searchOpen ? () => {} : props.onClick}>
                <SearchIconWrapper onClick={props.searchOpen ? () => {} : props.onClick}>
                    <StyledSearchRounded fontSize="small" isMobile={props.isMobile}/>
                </SearchIconWrapper>
                <StyledInputBase
                    inputRef={ref}
                    searchOpen={props.searchOpen}
                    inputProps={{ 'aria-label': 'search' }}
                    onChange={props.onChange}
                    onClick={props.searchOpen ? () => {} : props.onClick}
                />
            </Search>
        );
    },
);
