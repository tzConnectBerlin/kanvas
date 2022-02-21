import * as React from 'react';
import styled from '@emotion/styled';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { FC } from 'react';
import { Theme } from '@mui/material';
import Select, {
    SelectProps as MuiSelectProps,
    SelectChangeEvent,
} from '@mui/material/Select';

interface selectOption {
    label: string;
    value: string;
}

interface SelectedProps extends MuiSelectProps {
    id: string;
    availableOptions: selectOption[];
    selectedOption: string;
    triggerFunction: (input: SelectChangeEvent) => void;
    customSize: 'small' | 'big';
}

const StyledFormControl = styled(FormControl)<{
    theme?: Theme;
    customSize: 'small' | 'big';
}>`
    margin: 0;

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl:after {
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl {
        border-radius: 2rem !important;

        transition: outline 0.2s;

        fieldset {
            display: none !important;
        }

        &.Mui-focused {
            color: ${(props) => props.theme.palette.text.primary} !important;
        }
    }

    .MuiSelect-select {
        border-radius: 2rem !important;
        min-height: 0 !important;
        font-family: ${(props) =>
            props.customSize === 'small'
                ? 'Poppins'
                : props.customSize === 'big'
                ? 'Poppins SemiBold'
                : 'Poppins'} !important ;
        font-size: ${(props) =>
            props.customSize === 'small'
                ? 0.8
                : props.customSize === 'big'
                ? 1.1
                : 0.8}rem !important ;
        padding-right: 3rem !important;

        padding-left: ${(props) =>
            props.customSize === 'small' ? 0 : 0.5}rem !important;
        @media (max-width: 874px) {
            width: 4.5rem;
        }
    }

    svg {
        color: ${(props) => props.theme.palette.text.primary};
    }
`;

const StyledMenuItem = styled(MenuItem)<{
    theme?: Theme;
    customSize: 'small' | 'big';
}>`
    font-family: 'Poppins' !important;
    font-size: ${(props) =>
        props.customSize === 'small'
            ? 0.8
            : props.customSize === 'big'
            ? 1.1
            : 0.8}rem !important ;
    border-radius: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;

    &.Mui-selected {
        background-color: ${(props) =>
            props.theme.palette.primary.contrastText} !important;
    }
`;

const StyledExpandMoreIcon = styled(ExpandMoreIcon)<{
    theme?: Theme;
    customSize: 'small' | 'big';
}>`
    width: ${(props) =>
        props.customSize === 'small'
            ? 1.4
            : props.customSize === 'big'
            ? 1.8
            : 1.4}rem !important ;
    margin-left: ${(props) => (props.customSize === 'small' ? 0 : 0.5)}rem;
    color: ${(props) => props.theme.palette.text.primary};

    font-size: 1.8rem;
    transition: transform 0.3s;
`;

export const CustomSelect: FC<SelectedProps> = ({ ...props }) => {
    return (
        <StyledFormControl
            variant="outlined"
            sx={{ m: 1, minWidth: 80, maxHeight: 40, justifyContent: 'center' }}
            customSize={props.customSize}
        >
            <Select
                id={props.id}
                labelId={`${props.id}-label"`}
                inputProps={{ 'aria-label': 'select' }}
                value={props.selectedOption}
                onChange={props.triggerFunction}
                IconComponent={StyledExpandMoreIcon}
                autoWidth
            >
                {props.availableOptions.map((item: selectOption) => (
                    <StyledMenuItem
                        disableRipple
                        value={item.value}
                        customSize={props.customSize}
                        key={item.value}
                        aria-label={`select-option-${item.label}`}
                    >
                        {item.label}
                    </StyledMenuItem>
                ))}
            </Select>
        </StyledFormControl>
    );
};
