import styled from '@emotion/styled'

import { Stack } from '@mui/material'
import { FC, useEffect, useRef, useState } from 'react'

import { SearchInput } from '../../atoms/SearchInput'
import { QuickSearchResult } from '../../molecules/QuickSearchResult'

interface QuickSearchProps {
	setSearchOpen: Function
}

const QuickSearchWrapper = styled(Stack)`
  display: block;
`

const StyledBackground = styled.div<{ open: boolean }>`
  opacity: ${(props) => (props.open ? '0.5' : '0')};
  height: ${(props) => (props.open ? '100vh' : '0')} !important;

  transition: opacity 0.3s;

  height: 100vh;
  width: 100vw;
  top: 0;
  left: 0;
  background-color: #000000;
  position: absolute;
  margin: 0 !important;
`

export const QuickSearch: FC<QuickSearchProps> = ({ ...props }) => {
	const inputRef = useRef<HTMLInputElement>(null)

	const [openSearchResult, setOpenSearchresult] = useState(false)

	// const [getTagsSuggestions, tagsSuggestionResult] = useLazyQuery(GET_TAGS_SUGGESTIONS,  { fetchPolicy: 'cache-and-network' })
	const [loading, setLoading] = useState(false)
	const [inputValue, setInputValue] = useState('')

	// const [getProfilesSearch, profilesSearchResult] = useLazyQuery(GET_PROFILES_SEARCH,  { fetchPolicy: 'cache-and-network' })
	// const [getArtworksSearch, artworksSearchResult] = useLazyQuery(GET_ARTWORKS_SEARCH,  { fetchPolicy: 'cache-and-network' })
	// const [getTagsSearch, tagsSearchResult] = useLazyQuery(GET_TAGS_SEARCH,  { fetchPolicy: 'cache-and-network' })

	useEffect(() => {
		if (inputValue.length >= 2) {
			const delaySearch = setTimeout(() => {
				setLoading(false)
				// getTagsSearch({variables: { searchString: `#${inputValue}` }})
				// getProfilesSearch({variables: { searchString: inputValue }})
				// getArtworksSearch({variables: { searchString: inputValue }})
			}, 800)

			return () => {
				clearTimeout(delaySearch)
			}
		} else {
			setLoading(false)
			// profilesSearchResult.loading = false
			// artworksSearchResult.loading = false
			// tagsSearchResult.loading = false

			// profilesSearchResult.data = undefined
			// artworksSearchResult.data = undefined

			// profilesSearchResult.called = false
			// artworksSearchResult.called = false
		}
	}, [inputValue])

	const handleChange = () => {
		setInputValue(inputRef.current?.value as string)

		if (inputValue.length >= 1) {
			setLoading(true)
			//  profilesSearchResult.loading = true
			//  artworksSearchResult.loading = true
			//  tagsSearchResult.loading = true
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
			<StyledBackground
				open={openSearchResult}
				onClick={() => handleCloseInput()}
			></StyledBackground>
			<QuickSearchWrapper
				direction="column"
				onClick={() => {
					console.log('click')
					props.setSearchOpen(true)
				}}
			>
				<SearchInput
					open={openSearchResult}
					ref={inputRef}
					onChange={handleChange}
					onBlur={() => handleCloseInput()}
					onFocus={() => {
						inputRef?.current?.focus()
						setOpenSearchresult(true)
						props.setSearchOpen(true)
					}}
				/>
				<QuickSearchResult
					loading={loading}
					open={openSearchResult}
					closeResult={handleCloseInput}
					profilesSearchResult={[]}
					artworksSearchResult={[]}
					tagsSearchResult={[]}
					searchString={inputRef.current?.value}
				/>
			</QuickSearchWrapper>
		</>
	)
}
