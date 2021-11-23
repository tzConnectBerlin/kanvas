import { gql } from '@apollo/client'

export const GET_INSTAGRAM_USER_INFO = gql`
  query GetInstagramUserInfo($code: String!) {
    getInstagramUserInfo(code: $code) {
      instagramLink
    }
  }
`

export const GET_TWITTER_ACCESS_TOKENS = gql`
  query GetTwitterOAuthToken {
    getTwitterOAuthToken {
      oauth_token_twitter
    }
  }
`

export const GET_TWITTER_USER_INFO = gql`
  query GetTwitterUserInfo($oauthToken: String!, $oauthVerifier: String!) {
    getTwitterUserInfo(oauthToken: $oauthToken, oauthVerifier: $oauthVerifier) {
      twitterLink
    }
  }
`
