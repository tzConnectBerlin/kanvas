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
        width: 200,
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

const StyledDiv = styled(FormControl)<{ theme?: Theme }>`
    max-width: 8rem;
`;

export const LanguageSwitcher: FC<LanguageSwitcherProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);
    const [language, setLanguage] = useState('');
    const classes = useStyles();

    const handleTextfield = (event: any) => {
        setLanguage(event.target.value);
        i18next.changeLanguage(event.target.value as string);
    };

    return (
        <StyledDiv>
            <TextField
                className={classes.root}
                id="simple-select"
                value={language}
                label={t('common.language')}
                variant="outlined"
                onChange={handleTextfield}
                select
            >
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="ab">Arabic</MenuItem>
            </TextField>
        </StyledDiv>
    );
};
