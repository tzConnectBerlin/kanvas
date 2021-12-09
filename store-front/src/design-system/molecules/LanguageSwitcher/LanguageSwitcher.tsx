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

export const LanguageSwitcher = () => {
    const { t } = useTranslation(['translation']);

    const [language, setLanguage] = useState('');

    const handleChange = (event: SelectChangeEvent) => {
        setLanguage(event.target.value as string);
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
                    value={language}
                    label={t('common.language')}
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
