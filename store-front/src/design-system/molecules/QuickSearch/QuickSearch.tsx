import styled from '@emotion/styled';
import { Stack, Theme, useMediaQuery } from '@mui/material';
import useAxios from 'axios-hooks';
import { FC, useEffect, useRef, useState } from 'react';
import { SearchInput } from '../../atoms/SearchInput';
import { QuickSearchResult } from '../../molecules/QuickSearchResult';

interface QuickSearchProps {
    searchOpen?: boolean;
    setSearchOpen: Function;
}

const QuickSearchWrapper = styled(Stack)`
    display: block;
`;

const StyledBackground = styled.div<{ theme?: Theme; open: boolean }>`
    position: fixed;
    margin: 0 !important;
    display: ${(props) => (!props.open ? 'none' : '0')} !important;
    opacity: ${(props) => (props.open ? '1' : '0')};
    height: ${(props) => (props.open ? '100vh' : '0')} !important;

    transition: opacity 0.2s;

    height: 100vh;
    width: 100vw;
    top: 0;
    left: 0;
    opacity: 0.2;

    background-color: #000000;

    @media (max-width: 874px) {
        opacity: 1;
        background-color: ${(props) => props.theme.palette.background.paper};
    }
`;

export const QuickSearch: FC<QuickSearchProps> = ({ ...props }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isMobile = useMediaQuery('(max-width:874px)');

    const [openSearchResult, setOpenSearchresult] = useState(false);

    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const [searchResponse, getSearch] = useAxios(
        {
            url: process.env.REACT_APP_API_SERVER_BASE_URL + `/nfts/search`,
            method: 'GET',
            withCredentials: true,
        },
        { manual: true },
    );

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            setLoading(false);
            getSearch({
                params: {
                    searchString: inputValue,
                },
            });
        }, 800);

        return () => {
            clearTimeout(delaySearch);
        };
    }, [inputValue]);

    const handleChange = () => {
        setInputValue(inputRef.current?.value as string);

        if (inputValue.length >= 1) {
            setLoading(true);
        }
    };

    const handleCloseInput = () => {
        setOpenSearchresult(false);

        if (inputRef.current?.value) {
            inputRef.current.value = '';
        }
        inputRef?.current?.blur();

        props.setSearchOpen(false);
        setInputValue('');
    };

    return (
        <>
            <StyledBackground
                open={openSearchResult}
                onClick={() => handleCloseInput()}
            ></StyledBackground>
            <QuickSearchWrapper
                direction="column"
                onClick={() => {
                    props.setSearchOpen(true);
                }}
            >
                <SearchInput
                    open={openSearchResult}
                    ref={inputRef}
                    isMobile={isMobile}
                    searchOpen={props.searchOpen ?? false}
                    onChange={handleChange}
                    closeResult={handleCloseInput}
                    onClick={() => {
                        inputRef.current?.focus();
                        setOpenSearchresult(true);
                        props.setSearchOpen(true);
                    }}
                />
                <QuickSearchResult
                    loading={loading || searchResponse.loading}
                    open={openSearchResult}
                    closeResult={handleCloseInput}
                    profilesSearchResult={[]}
                    error={searchResponse.error ? true : false}
                    artworksSearchResult={searchResponse.data?.nfts ?? []}
                    categoriesSearchResult={
                        searchResponse.data?.categories ?? []
                    }
                    searchString={inputRef.current?.value}
                />
            </QuickSearchWrapper>
        </>
    );
};
