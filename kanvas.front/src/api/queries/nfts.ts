import { gql } from '@apollo/client'

export const GET_NFTS = gql`
    query Nfts {
        nfts @rest(type: "nfts", pathBuilder: $pathBuilder) {
            address
            tokenId
            name
        }
    }
`
