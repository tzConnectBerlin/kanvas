import { ComponentStory, ComponentMeta } from '@storybook/react'

import { HeaderProfile } from './HeaderProfile'

export default {
  title: 'Molecules/HeaderProfile',
  component: HeaderProfile,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof HeaderProfile>

const Template: ComponentStory<typeof HeaderProfile> = (args) => (
  <HeaderProfile {...args} />
)

export const Primary = Template.bind({})
Primary.args = {
  user: {
    profilePicture:
      'https://dart-creator-image-storage.fra1.digitaloceanspaces.com/undefined_profile_picture',
    userName: 'aurelia_durand',
    firstName: 'Aurélia',
    lastName: 'Durand',
    address: 'tz1KhMoukVbwDXRZ7EUuDm7K9K5EmJSGewxd',
    bio: 'This is a really nice description, hopefully you ll be able to read it all. It s supposed to be amazing ',
    instagramLink: 'string',
    twitterLink: 'string',
    websiteLink: 's',
    discordLink: '',
    facebookLink: 'string',
    linkedinLink: 'string',
    role: 'collector',
  },
}

export const Loading = Template.bind({})
Loading.args = {
  loading: true,
}
