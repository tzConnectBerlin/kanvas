import { Hero, HeroProps } from './Hero'
import { Story, Meta } from '@storybook/react'

export default {
  title: 'organismes/Hero',
  component: Hero,
} as Meta

const Template: Story<HeroProps> = (args: any) => <Hero {...args} />
export const Default = Template.bind({})
Default.args = {}
