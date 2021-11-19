import { Cookies, CookiesProps } from './Cookies'
import { Story, Meta } from '@storybook/react'

export default {
  title: 'Organismes/Cookies',
  component: Cookies,
} as Meta

const Template: Story<CookiesProps> = (args: any) => <Cookies {...args} />
export const Default = Template.bind({})
Default.args = {}
