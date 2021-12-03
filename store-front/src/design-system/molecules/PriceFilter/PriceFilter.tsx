import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';

import { FC, useState } from 'react';
import { Stack, Slider, Theme, TextField } from '@mui/material';

interface PriceFilterProps {
    minRange: number;
    maxRange: number;
    range?: [number, number];
    setRange: Function;
    triggerPriceFilter: () => void;
    setFilterSliding: (input: boolean) => void;
}

const StyledTextField = styled(TextField)<{ theme?: Theme }>`
    outline: none;
    border-bottom: 1px solid #c4c4c4;

    :hover {
        margin-bottom: -1px !important;
        border-bottom: 2px solid #c4c4c4;
    }

    :focus {
        margin-bottom: -1px !important;
        border-bottom: 2px solid ${(props) => props.theme.palette.text.primary};
    }

    .MuiOutlinedInput-notchedOutline {
        border: none !important;

        :hover {
            border: none !important;
        }
    }

    transition: all 0.2s;
`;

const StyledSlider = styled(Slider)`
    margin: 0.8rem 3.33% !important;
    width: 93.3%;

    @media (min-width: 900px) {
        width: 95%;
        margin: 0.8rem !important;
    }

    .MuiSlider-valueLabelCircle {
        display: none;
    }
`;

export const PriceFilter: FC<PriceFilterProps> = ({ ...props }) => {
    return (
        <Stack sx={{ width: '100%' }} spacing={3}>
            <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                <StyledTextField
                    type="number"
                    value={props.range ? props.range[0] : props.minRange}
                    onChange={(e) =>
                        props.setRange((bonds: [number, number]) => [
                            Number(e.target.value),
                            bonds[1],
                        ])
                    }
                />
                <Typography
                    size="Subtitle1"
                    weight="Medium"
                    display="initial !important"
                    align="center"
                    color="#C4C4C4"
                >
                    -
                </Typography>
                <StyledTextField
                    type="number"
                    value={props.range ? props.range[1] : props.maxRange}
                    onChange={(e) =>
                        props.setRange((bonds: [number, number]) => [
                            bonds[0],
                            Number(e.target.value),
                        ])
                    }
                />
            </Stack>

            <StyledSlider
                draggable
                getAriaLabel={() => 'Price range filter'}
                value={props.range ?? [props.minRange, props.maxRange]}
                min={props.minRange}
                max={props.maxRange}
                onChange={(_, newValues) => {
                    props.setRange(newValues as [number, number]);
                }}
                onChangeCommitted={() => {
                    props.triggerPriceFilter();
                    props.setFilterSliding(false);
                }}
                valueLabelDisplay="auto"
                getAriaValueText={() => 'valuetext'}
            />
        </Stack>
    );
};
