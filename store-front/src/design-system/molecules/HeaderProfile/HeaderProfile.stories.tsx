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
        name: 'aurelia_durand',
        address: 'tz1KhMoukVbwDXRZ7EUuDm7K9K5EmJSGewxd',
    },
}

export const Loading = Template.bind({})
Loading.args = {
    loading: true,
}
