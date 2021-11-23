import { gql } from '@apollo/client'

export const GET_TAGS_SUGGESTIONS = gql`
    query GetTagsSuggestions {
        getTagsSuggestions {
            name
        }
    }
`

export const GET_TAGS_SEARCH = gql`
    query GetTagsSearch($searchString: String!) {
        getTagsSearch(searchString: $searchString) {
            name
        }
    }
`

export const GET_PROFILES_SEARCH = gql`
    query GetProfilesSearch($searchString: String!) {
        getUsersSearch(searchString: $searchString) {
            firstName
            lastName
            userName
            profilePicture
        }
    }
`

export const GET_ARTWORKS_SEARCH = gql`
    query GetArtworksSearch($searchString: String!) {
        getArtworksSearch(searchString: $searchString) {
            title
            url
        }
    }
`

export const CHECK_IF_USERNAME_VALID = gql`
    query CheckIfUsernameValid($userName: String!) {
        checkIfUsernameValid(userName: $userName)
    }
`
