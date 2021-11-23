import { Slider } from './Slider'
import { Story, Meta } from '@storybook/react'

export default {
    title: 'organismes/Slider',
    component: Slider,
} as Meta

const Template: Story<any> = (args: any) => <Slider {...args} />
export const Editable = Template.bind({})
Editable.args = {
    notifications: 4,
}

export const NonEditable = Template.bind({})
NonEditable.args = {
    notifications: 4,
}
