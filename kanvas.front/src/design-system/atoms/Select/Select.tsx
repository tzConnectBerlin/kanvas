import * as React from 'react';
import styled from '@emotion/styled';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

import { FC } from 'react';
import { Theme } from '@mui/material';
import Select, { SelectChangeEvent } from '@mui/material/Select';

interface SelectedProps {

}

const StyledDiv = styled.div<{theme?: Theme}>`
    color: ${props => props.theme.palette.text.primary} !important;
`

const StyledFormControl = styled(FormControl)<{theme?: Theme}>`
    margin-top: 0;

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl:after {
        border: none;
    }

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl {

        border-radius: 0 !important;
        border: 1px solid ${props => props.theme.palette.text.primary};
        font-size: 0.9rem;
        transition: outline 0.2s;

        fieldset {
            display: none !important;
        }

        :hover {
            outline: 1px solid ${props => props.theme.palette.text.primary};
        }

        &.Mui-focused {
            color: ${props => props.theme.palette.text.primary} !important;
            outline: 1px solid ${props => props.theme.palette.text.primary} !important;
        }
    }

    .MuiSelect-select {
        padding-top: 0.5rem !important;
        padding-bottom: 0.7rem !important;
    }

    svg {
        color: ${props => props.theme.palette.text.primary};
    }
`

const StyledInputLabel = styled(InputLabel)<{theme?: Theme}>`
    height: 100%;
    align-items: center;
    display: flex;
    justify-content: center;
    width: 75%;
    transform: none;
    color: ${props => props.theme.palette.text.primary};

    font-size: 0.875rem;

    &.Mui-focused {
        color: ${props => props.theme.palette.text.primary} !important;
    }

    :focus {
        color: ${props => props.theme.palette.text.primary};
        outline: none;
    }
`

export const CustomSelect : FC<SelectedProps> = ({...props}) => {

    const [sort, setSort] = React.useState('');

    const handleChange = (event: SelectChangeEvent) => {
        setSort(event.target.value);
    };

  return (
    <StyledDiv>
        <StyledFormControl  variant="outlined" sx={{ m: 1, minWidth: 80, maxHeight: 40}}>
            <StyledInputLabel variant="filled" id="demo-simple-select-autowidth-label" shrink={false} disableAnimation>{sort !== '' ? '' : "Sort"}</StyledInputLabel>
                <Select
                    labelId="demo-simple-select-autowidth-label"
                    id="demo-simple-select-autowidth"
                    value={sort}
                    onChange={handleChange}
                    autoWidth
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    <MenuItem value={10}>Twenty</MenuItem>
                    <MenuItem value={21}>Twenty one</MenuItem>
                    <MenuItem value={22}>Twenty one and a half</MenuItem>
                </Select>
        </StyledFormControl>
    </StyledDiv>
  );
}