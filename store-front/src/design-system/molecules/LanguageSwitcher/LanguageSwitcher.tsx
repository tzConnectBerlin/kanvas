import i18next, { t } from 'i18next';
import { FC, useState } from 'react';
import {
    Button,
    FormControl,
    InputLabel,
    Select,
    Theme,
    useTheme,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Box, styled } from '@mui/system';
import { useTranslation } from 'react-i18next';

import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';

interface LanguageSwitcherProps {
    theme?: Theme;
}

const StyledFormControl = styled(FormControl)<{ theme?: Theme }>`
    .MuiTextField-root {
        min-width: 7rem;
    }
`;

export const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);
    const [language, setLanguage] = useState('');

    const useStyles = makeStyles({
        root: {
            '& .MuiOutlinedInput-input': {
                color: `grey`,
            },
            '& .MuiInputLabel-root': {
                color: 'grey',
            },
            '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                borderColor: 'grey',
            },
            '&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                borderColor: 'grey',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-input': {
                color: 'rgb(151, 113, 255)',
            },
            '& .MuiInputLabel-root.Mui-focused': {
                color: 'rgb(151, 113, 255)',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                {
                    borderColor: 'rgb(151, 113, 255)',
                },
        },
    });

    const classes = useStyles();

    const handleTextfield = (event: any) => {
        setLanguage(event.target.value);
        i18next.changeLanguage(event.target.value as string);
    };

    return (
        <StyledFormControl>
            <TextField
                className={classes.root}
                id="simple-select"
                value={language}
                variant="outlined"
                label={t('footer.language.label')}
                onChange={handleTextfield}
                select
            >
                <MenuItem value="" style={{ pointerEvents: 'none' }}>
                    {t('footer.language.select')}
                </MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">Français</MenuItem>
                <MenuItem value="ab">عرب</MenuItem>
            </TextField>
        </StyledFormControl>
    );
};
