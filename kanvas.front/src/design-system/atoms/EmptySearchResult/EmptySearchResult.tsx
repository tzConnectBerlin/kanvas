import styled from '@emotion/styled';
import SearchRounded from '@mui/icons-material/SearchRounded';

import { FC } from 'react';
import { Stack } from '@mui/material';
import { Typography } from '../../atoms/Typography';

interface EmptySearchResultProps {
    searchString?: string | unknown;
}

const StyledStack = styled(Stack)`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 4em;
    margin-bottom: 4em;
`

export const EmptySearchResult : FC<EmptySearchResultProps> = ({...props}) => {
    return (
        <StyledStack spacing={1}>
            <SearchRounded fontSize="large" height='1.5em' width='1.5em'/>
            <Typography size="h2" weight="Bold">No search results</Typography>
            <Typography size="inherit" weight="Light" color='#9b9b9b'>There are no results for '{props.searchString}' </Typography>
        </StyledStack>
    )
}