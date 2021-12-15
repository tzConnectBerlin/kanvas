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

const useStyles = makeStyles({
    root: {
        '& .MuiOutlinedInput-input': {
            color: 'currentColor',
        },
        '& .MuiInputLabel-root': {
            color: 'currentColor',
        },
        '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
            borderColor: 'currentColor',
        },
        '&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
            borderColor: 'currentColor',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-input': {
            color: 'purple',
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: 'purple',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
            {
                borderColor: 'purple',
            },
    },
});

const StyledFormControl = styled(FormControl)<{ theme?: Theme }>`
    .MuiTextField-root {
        max-width: 7rem;
    }
`;

export const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);
    const [language, setLanguage] = useState('en');
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
                label={t('common.language')}
                onChange={handleTextfield}
                placeholder="English"
                select
            >
                <MenuItem value="en" selected>English</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="ab">Arabic</MenuItem>
            </TextField>
        </StyledFormControl>
    );
};
