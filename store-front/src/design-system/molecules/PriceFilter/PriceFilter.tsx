import styled from '@emotion/styled'
import Typography from '../../atoms/Typography'

import { FC } from 'react'
import { Stack, Slider, Theme, TextField } from '@mui/material'

interface PriceFilterProps {
    minRange: number
    maxRange: number
    range: [number, number]
    setRange: Function
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
`

const StyledSlider = styled(Slider)`
    .MuiSlider-valueLabelCircle {
        display: none;
    }
`

export const PriceFilter: FC<PriceFilterProps> = ({ ...props }) => {
    return (
        <Stack sx={{ width: '100%' }} spacing={3}>
            <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
                <StyledTextField
                    type="number"
                    value={props.range[0]}
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
                    value={props.range[1]}
                    onChange={(e) =>
                        props.setRange((bonds: [number, number]) => [
                            bonds[0],
                            Number(e.target.value),
                        ])
                    }
                />
            </Stack>

            <StyledSlider
                getAriaLabel={() => 'Price range filter'}
                value={props.range}
                min={props.minRange}
                max={props.maxRange}
                onChange={(_, newValues) =>
                    props.setRange(newValues as [number, number])
                }
                valueLabelDisplay="auto"
                getAriaValueText={() => 'valuetext'}
            />
        </Stack>
    )
}
