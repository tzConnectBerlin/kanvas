import { gql } from '@apollo/client'

export const GET_USER_GALLERY = gql`
    query GetUserGallery($userName: String!, $skip: Float!) {
        getUserGallery(userName: $userName, skip: $skip) {
            id
            url
            type
            creator {
                id
                firstName
                lastName
            }
            auctions {
                endDate
                startingPrice
            }
        }
    }
`

export const GET_USER_CREATIONS = gql`
    query GetUserCreations($userName: String!, $skip: Float!) {
        getUserCreations(userName: $userName, skip: $skip) {
            id
            url
            type
            creator {
                id
                firstName
                lastName
            }
            auctions {
                endDate
                startingPrice
            }
        }
    }
`
