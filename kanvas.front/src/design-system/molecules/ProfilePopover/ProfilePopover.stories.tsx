import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ProfilePopover } from './ProfilePopover'

export default {
  title: 'Molecules/ProfilePopover',
  component: ProfilePopover,
} as ComponentMeta<typeof ProfilePopover>

const Template: ComponentStory<typeof ProfilePopover> = (args) => (
  <ProfilePopover {...args} />
)

export const Open = Template.bind({})
Open.args = {
  open: true,
  logOut: () => console.log('logging out'),
}

export const Notification = Template.bind({})
Notification.args = {
  notifications: 20,
  open: true,
  logOut: () => {
    console.log('logging out')
  },
}

export const Close = Template.bind({})
Close.args = {
  open: false,
}
