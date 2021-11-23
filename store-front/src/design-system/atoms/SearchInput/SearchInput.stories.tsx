import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { SearchInput } from './SearchInput'

export default {
    title: 'Atoms/SearchInput',
    component: SearchInput,
} as ComponentMeta<typeof SearchInput>

const Template: ComponentStory<typeof SearchInput> = (args) => (
    <SearchInput {...args} />
)

export const Collapsed = Template.bind({})
Collapsed.args = {}

export const NotCollapsed = Template.bind({})
NotCollapsed.args = {}
