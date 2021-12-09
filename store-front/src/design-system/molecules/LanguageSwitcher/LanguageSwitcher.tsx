import i18next, { t } from 'i18next';
import { FC, useState } from 'react';
import {
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Box } from '@mui/system';
import { useTranslation } from 'react-i18next';

interface LanguageSwitcherProps {
    handleLanguageChange?: Function;
}

export const LanguageSwitcher = () => {
    const { t } = useTranslation(['translation']);

    const [age, setAge] = useState('');

    const handleChange = (event: SelectChangeEvent) => {
        setAge(event.target.value as string);
        i18next.changeLanguage(event.target.value as string);
    };

    return (
        <Box sx={{ maxWidth: 140 }}>
            <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                    {t('common.language')}
                </InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={age}
                    label="Age"
                    onChange={handleChange}
                    sx={{
                        borderRadius: 0,
                    }}
                >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="ab">Arabic</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
};
