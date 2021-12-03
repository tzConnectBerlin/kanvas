import styled from '@emotion/styled';

import { FC, useState } from 'react';
import {
    Box,
    Tab,
    Tabs as MTabs,
    TabsProps as MTabsProps,
    Theme,
} from '@mui/material';

interface TabsProps extends MTabsProps {
    tabs: any[];
    handleValueChange: Function;
}

const StyledTabs = styled(MTabs)<{ theme?: Theme }>`
    .MuiTabs-indicator {
        background-color: ${(props) =>
            props.theme.palette.text.primary} !important;
    }
`;

const StyledTab = styled(Tab)<{ theme?: Theme }>`
    &.MuiButtonBase-root {
        font-family: 'Poppins Light';
        font-size: 1rem;
        text-align: center;
        text-transform: none;
        background-color: 'transparent' !important;
        color: '#C4C4C4';

        transition: color 0.2s;

        &[aria-selected='true'] {
            font-family: 'Poppins Medium';
            color: ${(props) => props.theme.palette.text.primary} !important;
        }
    }
`;

export const Tabs: FC<TabsProps> = ({ ...props }) => {
    const [value, setValue] = useState(props.tabs[0]?.value);

    const handleChange = (event: any, newValue: any) => {
        setValue(newValue);
        props.handleValueChange(newValue);
    };

    return (
        <Box sx={{ typography: 'h3', borderBottom: 1, borderColor: '#e0e0e0' }}>
            <StyledTabs
                value={value}
                onChange={handleChange}
                aria-label="Dynamic tabs"
            >
                {props.tabs.map((tab) => (
                    <StyledTab
                        label={tab.label}
                        value={tab.value}
                        wrapped={true}
                        disableRipple
                    />
                ))}
            </StyledTabs>
        </Box>
    );
};
