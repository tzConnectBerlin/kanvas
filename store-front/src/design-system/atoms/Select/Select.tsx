import * as React from 'react';
import styled from '@emotion/styled';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .MuiOutlinedInput-root.MuiInputBase-root.MuiInputBase-colorPrimary.MuiInputBase-formControl {
        border-radius: 2rem !important;
        font-size: 0.9rem;
        font-weight: 900;
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
        padding-top: 0.6rem !important;
        padding-bottom: 0.7rem !important;
        padding-right: 3rem !important;
    }

    svg {
        color: ${(props) => props.theme.palette.text.primary};
    }
`;

const StyledMenuItem = styled(MenuItem)<{theme?: Theme}>`
    font-family: 'Poppins' !important;
    border-radius: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;

    &.Mui-selected {
        background-color: ${(props) => props.theme.palette.primary.contrastText} !important;
    }
`

const StyledExpandMoreIcon = styled(ExpandMoreIcon) <{theme?: Theme }>`
    width: 1.8rem;
    margin-left: 0.5rem;
    color: ${props => props.theme.palette.text.primary};

    transition: transform 0.3s;
`

export const CustomSelect: FC<SelectedProps> = ({
    callNFTsEndpoint,
    ...props
}) => {
    const handleChange = (event: SelectChangeEvent) => {
        const sort : SortProps = {
            orderBy: JSON.parse(event.target.value).orderBy,
            orderDirection: JSON.parse(event.target.value).orderDirection
        }
        callNFTsEndpoint({ handlePriceRange: true, orderBy: sort.orderBy, orderDirection: sort.orderDirection  });
        props.setSelectedOption(JSON.parse(event.target.value));
    };

    return (
        <StyledFormControl
            variant="outlined"
            sx={{ m: 1, minWidth: 80, maxHeight: 40 }}
            disabled={props.disabled ?? false}
        >
            <Select
                id={props.id}
                labelId={`${props.id}-label"`}
                value={
                    JSON.stringify(props.selectedOption) ??
                    JSON.stringify({
                        orderBy: 'createdAt',
                        orderDirection: 'desc',
                    })
                }
                onChange={handleChange}
                IconComponent={StyledExpandMoreIcon}
                autoWidth
            >
                <StyledMenuItem
                    disableRipple
                    value={JSON.stringify({
                        orderBy: 'name',
                        orderDirection: 'asc',
                    })}
                >
                    Name: A - Z
                </StyledMenuItem>
                <StyledMenuItem
                    disableRipple
                    value={JSON.stringify({
                        orderBy: 'name',
                        orderDirection: 'desc',
                    })}
                >
                    Name: Z - A
                </StyledMenuItem>
                <StyledMenuItem
                    disableRipple
                    value={JSON.stringify({
                        orderBy: 'price',
                        orderDirection: 'desc',
                    })}
                >
                    Price: High - Low
                </StyledMenuItem>
                <StyledMenuItem
                    disableRipple
                    value={JSON.stringify({
                        orderBy: 'price',
                        orderDirection: 'asc',
                    })}
                >
                    Price: Low - High
                </StyledMenuItem>
                <StyledMenuItem
                    disableRipple
                    value={JSON.stringify({
                        orderBy: 'createdAt',
                        orderDirection: 'desc',
                    })}
                >
                    Created: New - Old
                </StyledMenuItem>
                <StyledMenuItem
                    disableRipple
                    value={JSON.stringify({
                        orderBy: 'createdAt',
                        orderDirection: 'asc',
                    })}
                >
                    {' '}
                    Created: Old - New
                </StyledMenuItem>
            </Select>
        </StyledFormControl>
    );
};
