import * as React from 'react';
import styled from '@emotion/styled';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';

import { FC } from 'react';
import { Theme } from '@mui/material';
import Select, {
    SelectProps as MuiSelectProps,
    SelectChangeEvent,
} from '@mui/material/Select';
import { IParamsNFTs } from '../../../pages/StorePage';

interface SortProps {
    orderBy: 'price' | 'name' | 'createdAt';
    orderDirection: 'asc' | 'desc';
}

interface SelectedProps extends MuiSelectProps {
    id: string;
    selectedOption?: SortProps;
    setSelectedOption: (input: SortProps) => void;
    callNFTsEndpoint: (input: IParamsNFTs) => void;
}

const StyledFormControl = styled(FormControl)<{ theme?: Theme }>`
    margin: 0;

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl:after {
        border: none;
    }

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl {
        border-radius: 2rem !important;
        outline: solid 1.5px #C4C4C4;
        font-size: 0.9rem;
        transition: outline 0.2s;

        fieldset {
            display: none !important;
        }

        :hover {
            outline: 2px solid ${(props) => props.theme.palette.text.primary};
        }

        &.Mui-focused {
            color: ${(props) => props.theme.palette.text.primary} !important;
            outline: 1px solid ${(props) => props.theme.palette.text.primary} !important;
        }
    }

    .MuiSelect-select {
        border-radius: 2rem !important;
        background-color: ${props => props.theme.palette.background.paper};
        padding-top: 0.6rem !important;
        padding-bottom: 0.7rem !important;
    }

    svg {
        color: ${(props) => props.theme.palette.text.primary};
    }
`;

export const CustomSelect: FC<SelectedProps> = ({
    callNFTsEndpoint,
    ...props
}) => {
    const handleChange = (event: SelectChangeEvent) => {
        callNFTsEndpoint({ handlePriceRange: true });
        props.setSelectedOption(JSON.parse(event.target.value));
    };

    return (
        <StyledFormControl
            variant="outlined"
            sx={{ m: 1, minWidth: 80, maxHeight: 40 }}
            disabled={props.disabled ?? false}
        >
            <Select
                labelId={`${props.id}-label"`}
                id={props.id}
                value={
                    JSON.stringify(props.selectedOption) ??
                    JSON.stringify({
                        orderBy: 'createdAt',
                        orderDirection: 'desc',
                    })
                }
                onChange={handleChange}
                autoWidth
            >
                <MenuItem
                    value={JSON.stringify({
                        orderBy: 'name',
                        orderDirection: 'asc',
                    })}
                >
                    Name: A - Z
                </MenuItem>
                <MenuItem
                    value={JSON.stringify({
                        orderBy: 'name',
                        orderDirection: 'desc',
                    })}
                >
                    Name: Z - A
                </MenuItem>
                <MenuItem
                    value={JSON.stringify({
                        orderBy: 'price',
                        orderDirection: 'desc',
                    })}
                >
                    Price: High - Low
                </MenuItem>
                <MenuItem
                    value={JSON.stringify({
                        orderBy: 'price',
                        orderDirection: 'asc',
                    })}
                >
                    Price: Low - High
                </MenuItem>
                <MenuItem
                    value={JSON.stringify({
                        orderBy: 'createdAt',
                        orderDirection: 'desc',
                    })}
                >
                    Created: New - Old
                </MenuItem>
                <MenuItem
                    value={JSON.stringify({
                        orderBy: 'createdAt',
                        orderDirection: 'asc',
                    })}
                >
                    {' '}
                    Created: Old - New
                </MenuItem>
            </Select>
        </StyledFormControl>
    );
};
