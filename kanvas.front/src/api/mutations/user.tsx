import { gql } from '@apollo/client'

export const EDIT_USER_GALLERY_LAYOUTS = gql`
  mutation EditUserGalleryLayouts(
    $userName: String!
    $galleryLayouts: String!
  ) {
    editUserGalleryLayouts(
      userName: $userName
      galleryLayouts: $galleryLayouts
    ) {
      id
      galleryLayouts
    }
  }
`

export const EDIT_USER_CREATION_LAYOUTS = gql`
  mutation EditUserCreationLayouts(
    $userName: String!
    $creationLayouts: String!
  ) {
    editUserCreationLayouts(
      userName: $userName
      creationLayouts: $creationLayouts
    ) {
      id
      creationLayouts
    }
  }
`

export const UPDATE_USER = gql`
  mutation UpdateUser(
    $firstName: String!
    $lastName: String!
    $bio: String!
    $profilePicture: Upload!
    $instagramLink: String!
    $twitterLink: String!
    $linkedinLink: String!
    $websiteLink: String!
    $discordLink: String!
    $facebookLink: String!
  ) {
    updateUser(
      data: {
        profilePicture: $profilePicture
        firstName: $firstName
        lastName: $lastName
        bio: $bio
        instagramLink: $instagramLink
        twitterLink: $twitterLink
        linkedinLink: $linkedinLink
        websiteLink: $websiteLink
        discordLink: $discordLink
        facebookLink: $facebookLink
      }
    ) {
      id
      userName
    }
  }
`
