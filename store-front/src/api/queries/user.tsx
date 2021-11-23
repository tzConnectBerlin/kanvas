import { gql } from '@apollo/client'

export const SIGN_USER = gql`
  query SignUser($address: String!, $signedDartPayload: String!) {
    signIn(data: { signedDartPayload: $signedDartPayload, address: $address }) {
      address
      token
      maxAge
      id
      firstName
      lastName
      userName
      bio
      profilePicture
      instagramLink
      twitterLink
      websiteLink
      discordLink
      role
    }
  }
`

export const GET_LOGGED_USER = gql`
  query LoggedUser {
    loggedUser {
      address
      id
      userName
      firstName
      lastName
      bio
      profilePicture
      instagramLink
      twitterLink
      websiteLink
      discordLink
      facebookLink
      linkedinLink
      role
    }
  }
`

export const REGISTER_USER = gql`
  mutation RegisterUser(
    $firstName: String!
    $lastName: String!
    $userName: String!
    $signedDartPayload: String!
    $address: String!
    $bio: String!
    $profilePicture: String!
    $instagramLink: String!
    $twitterLink: String!
    $websiteLink: String!
    $discordLink: String!
    $facebookLink: String!
    $role: String!
  ) {
    registerUser(
      data: {
        firstName: $firstName
        lastName: $lastName
        userName: $userName
        signedDartPayload: $signedDartPayload
        address: $address
        bio: $bio
        profilePicture: $profilePicture
        instagramLink: $instagramLink
        twitterLink: $twitterLink
        websiteLink: $websiteLink
        discordLink: $discordLink
        facebookLink: $facebookLink
        role: $role
      }
    ) {
      id
      firstName
      lastName
      userName
      address
      bio
      profilePicture
      instagramLink
      twitterLink
      websiteLink
      facebookLink
      discordLink
      role
    }
  }
`

export const GET_USER = gql`
  query GetUser($userName: String!) {
    getUser(userName: $userName) {
      address
      id
      userName
      firstName
      lastName
      profilePicture
      bio
      instagramLink
      twitterLink
      websiteLink
      discordLink
      facebookLink
      role
      galleryLayouts
      creationLayouts
    }
  }
`

export const GET_USER_CREATION_LAYOUTS = gql`
  query GetUserCreationLayouts($userName: String!) {
    getUserCreationLayouts(userName: $userName) {
      creationLayouts
    }
  }
`

export const GET_USER_LAYOUTS = gql`
  query GetUserLayouts($userName: String!) {
    getUserLayouts(userName: $userName) {
      id
      galleryLayouts
      creationLayouts
    }
  }
`
