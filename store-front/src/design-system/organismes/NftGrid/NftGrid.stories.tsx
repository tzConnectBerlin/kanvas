import { NftGrid } from './NftGrid'
import { Story, Meta } from '@storybook/react'

export default {
    title: 'Organismes/NftGrid',
    component: NftGrid,
} as Meta

const Template: Story<any> = (args: any) => <NftGrid {...args} />
export const Editable = Template.bind({})
Editable.args = {
    notifications: 4,
}

export const NonEditable = Template.bind({})
NonEditable.args = {
    notifications: 4,
}
