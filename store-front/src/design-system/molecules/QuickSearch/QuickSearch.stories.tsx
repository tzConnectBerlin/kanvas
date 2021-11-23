import * as React from 'react'
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0'
import { QuickSearch } from './QuickSearch'

export default {
    title: 'Molecules/Typography',
    component: QuickSearch,
    argTypes: {},
} as Meta

const Template: Story = (args: any) => <QuickSearch {...args} />

export const Default = Template.bind({})
Default.args = {}

export const Truncated = Template.bind({})
Truncated.args = {}
