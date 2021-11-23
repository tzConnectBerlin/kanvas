import * as React from 'react'
import styled from '@emotion/styled'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'

import { FC } from 'react'
import { Theme } from '@mui/material'
import Select, {
    SelectProps as MuiSelectProps,
    SelectChangeEvent,
} from '@mui/material/Select'

interface SelectedProps extends MuiSelectProps {
    id: string
    selectedOption: string
    setSelectedOption: Function
}

const StyledFormControl = styled(FormControl)<{ theme?: Theme }>`
    margin: 0;

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl:after {
        border: none;
    }

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl {
        border-radius: 0 !important;
        border: 1px solid ${(props) => props.theme.palette.text.primary};
        font-size: 0.9rem;
        transition: outline 0.2s;

        fieldset {
            display: none !important;
        }

        :hover {
            outline: 1px solid ${(props) => props.theme.palette.text.primary};
        }

        &.Mui-focused {
            color: ${(props) => props.theme.palette.text.primary} !important;
            outline: 1px solid ${(props) => props.theme.palette.text.primary} !important;
        }
    }

    .MuiSelect-select {
        padding-top: 0.5rem !important;
        padding-bottom: 0.7rem !important;
    }

    svg {
        color: ${(props) => props.theme.palette.text.primary};
    }
`

const StyledInputLabel = styled(InputLabel)<{ theme?: Theme }>`
    height: 100%;
    align-items: center;
    display: flex;
    justify-content: center;
    width: 75%;
    transform: none;
    color: ${(props) => props.theme.palette.text.primary};

    font-size: 0.875rem;

    &.Mui-focused {
        color: ${(props) => props.theme.palette.text.primary} !important;
    }

    :focus {
        color: ${(props) => props.theme.palette.text.primary};
        outline: none;
    }
`

export const CustomSelect: FC<SelectedProps> = ({ ...props }) => {
    const handleChange = (event: SelectChangeEvent) => {
        props.setSelectedOption(event.target.value)
    }

    return (
        <StyledFormControl
            variant="outlined"
            sx={{ m: 1, minWidth: 80, maxHeight: 40 }}
            disabled={props.disabled ?? false}
        >
            <StyledInputLabel
                variant="filled"
                id={`${props.id}-label"`}
                shrink={false}
                disableAnimation
            >
                {props.selectedOption !== '' ? '' : 'Sort'}
            </StyledInputLabel>
            <Select
                labelId={`${props.id}-label"`}
                id={props.id}
                value={props.selectedOption}
                onChange={handleChange}
                autoWidth
            >
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                <MenuItem value={'asc-name'}>asc - Name</MenuItem>
                <MenuItem value={'desc-name'}>desc - Name</MenuItem>
                <MenuItem value={'asc-price'}>asc - Price</MenuItem>
                <MenuItem value={'desc-price'}>desc - Price</MenuItem>
                <MenuItem value={'asc-created'}>asc - Created</MenuItem>
                <MenuItem value={'desc-created'}>desc - Created</MenuItem>
            </Select>
        </StyledFormControl>
    )
}
