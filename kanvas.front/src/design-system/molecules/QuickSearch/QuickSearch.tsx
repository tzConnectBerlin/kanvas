import { useLazyQuery } from '@apollo/client';
import styled from '@emotion/styled';

import { Stack } from '@mui/material';
import { FC, useEffect, useRef, useState } from 'react';

import { SearchInput } from '../../atoms/SearchInput';
import { QuickSearchResult } from '../../molecules/QuickSearchResult';
import { GET_ARTWORKS_SEARCH, GET_PROFILES_SEARCH, GET_TAGS_SEARCH, GET_TAGS_SUGGESTIONS } from '../../../api/search';

interface QuickSearchProps {
    setSearchOpen: Function;
}

const QuickSearchWrapper = styled(Stack)`
    display: block;
`

const StyledBackground = styled.div<{open: boolean}>`
    opacity: ${props => props.open ? '0.5': '0'};
    height: ${props => props.open ? '100vh': '0'} !important;

    transition: opacity 0.3s;
    
    height: 100vh;
    width: 100vw;
    top: 0;
    left: 0;
    background-color: #000000;
    position: absolute;
    margin: 0!important;
    
`

export const QuickSearch : FC<QuickSearchProps> = ({...props}) => {

    const inputRef = useRef<HTMLInputElement>(null)
    
    const [openSearchResult, setOpenSearchresult] = useState(false)

    const [getTagsSuggestions, tagsSuggestionResult] = useLazyQuery(GET_TAGS_SUGGESTIONS,  { fetchPolicy: 'cache-and-network' })
    
    const [inputValue, setInputValue] = useState('')
    
    const [getProfilesSearch, profilesSearchResult] = useLazyQuery(GET_PROFILES_SEARCH,  { fetchPolicy: 'cache-and-network' })
    const [getArtworksSearch, artworksSearchResult] = useLazyQuery(GET_ARTWORKS_SEARCH,  { fetchPolicy: 'cache-and-network' })
    const [getTagsSearch, tagsSearchResult] = useLazyQuery(GET_TAGS_SEARCH,  { fetchPolicy: 'cache-and-network' }) 

    useEffect(() => {
        if (inputValue.length >= 2) {
            
            const delaySearch = setTimeout(() => {  
                getTagsSearch({variables: { searchString: `#${inputValue}` }})
                getProfilesSearch({variables: { searchString: inputValue }})
                getArtworksSearch({variables: { searchString: inputValue }})
            }, 800)
            
            return () => { clearTimeout(delaySearch) }

        } else {
            profilesSearchResult.loading = false
            artworksSearchResult.loading = false
            tagsSearchResult.loading = false

            profilesSearchResult.data = undefined
            artworksSearchResult.data = undefined

            profilesSearchResult.called = false
            artworksSearchResult.called = false
        }
    }, [inputValue])

    const handleChange = () => {
        
        setInputValue(inputRef.current?.value as string)
         
        if (inputValue.length >= 1 ) {
             profilesSearchResult.loading = true
             artworksSearchResult.loading = true
             tagsSearchResult.loading = true    
         }
    }

    const handleCloseInput = () => {
        
        setOpenSearchresult(false)
        
        if (inputRef.current?.value) {
            inputRef.current.value = ''
        }
        inputRef?.current?.blur()
        
        setTimeout(() => {
            props.setSearchOpen(false)
        }, 300)
        setInputValue('')
    }

    return (
        <>
            <StyledBackground open={openSearchResult} onClick={() => handleCloseInput()}></StyledBackground>
            <QuickSearchWrapper direction='column' onClick={() => {console.log('click');getTagsSuggestions(); props.setSearchOpen(true);  }} >
                <SearchInput open={openSearchResult} ref={inputRef} onChange={handleChange} onFocus={() => {inputRef?.current?.focus(); setTimeout(() => setOpenSearchresult(true), 200); props.setSearchOpen(true); }} />
                <QuickSearchResult open={openSearchResult} closeResult={handleCloseInput} profilesSearchResult={inputValue.length < 2 ? () => { profilesSearchResult.called = false; return profilesSearchResult } : profilesSearchResult} artworksSearchResult={inputValue.length < 2 ? () => { artworksSearchResult.called = false; return artworksSearchResult } : artworksSearchResult} tagsSearchResult={inputValue === '' || inputValue.length < 2 ? tagsSuggestionResult : tagsSearchResult } searchString={inputRef.current?.value} />
            </QuickSearchWrapper>
        </>
    )
}