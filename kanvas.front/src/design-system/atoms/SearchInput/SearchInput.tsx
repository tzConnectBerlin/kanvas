import styled from '@emotion/styled';
import SearchRounded from '@mui/icons-material/SearchRounded';

import { forwardRef } from 'react';
import { Theme } from '@mui/material';
import { InputBase as MInputBase, InputBaseProps as MInputBaseProps} from '@mui/material';

interface InputBaseProps extends MInputBaseProps {
    open: boolean
}

interface MInputBasePropsStyled {
    theme?: Theme;
}

const Search = styled.div<{ theme?: Theme}>`
    cursor: pointer;
    
    background: ${props => props.theme.button.background } ;
    transition: filter 0.2s, width 0.3s;
    

    width: 35rem;
    height: 40px !important;
    transition: width 0.3s;
    
    display: flex;
    align-items: center;

    border-radius: 0;
    

    &:active {
        transition: filter 0.2s, border 0.2s;
        filter: drop-shadow(0px 0px 6px #98989833);
    }

    &:focus-within {
        transition: width 0.3s;
        width: 35rem;

        @media (max-width: 730px) {
            width: 100%;
        }
    }
`

const SearchIconWrapper = styled.div<{theme?: Theme}>`
    position: absolute;
    height: 100%;
    width: 40px !important;
    pointer-events: none;

    display: flex;
    align-items: center;
    justify-content: center;
    
`

const StyledSearchRounded = styled(SearchRounded)`
    color: #C4C4C4 !important;
`

const StyledInputBase = styled(MInputBase)<MInputBasePropsStyled>`
    color: inherit;
    padding-left: 40px;
    height: 100%;
    width: 100%;
    cursor: pointer;
   
    outline: ${props => `solid 1px ${props.theme.palette.text.primary}`};

    :hover {
        outline: ${props => `solid 2px ${props.theme.palette.text.primary}`};
    }

    &.MuiInputBase-root {
        font-family: 'Roboto Medium' !important;
    }

    &.MuiInputBase-input {
        padding: theme.spacing(1, 1, 1, 0);
        
        padding-left: '40px';
        transition: width 0.2s, opacity 0.2s;
        
        opacity: 0;
        width: '12ch';
        
        &:focus {
            width: 40rem;
            height: 100rem;
            opacity: 1;
        }
    }
`

export const SearchInput = forwardRef<HTMLInputElement, InputBaseProps>(({...props}, ref) => {

    return (
        <Search>
            <SearchIconWrapper>
                <StyledSearchRounded fontSize='small'/>
            </SearchIconWrapper>
            <StyledInputBase
                inputRef={ref}    
                inputProps={{ 'aria-label': 'search' }}
                onChange={props.onChange}
                onFocus={props.onFocus}
                onBlur={props.onBlur}
            />
        </Search>
    )
})