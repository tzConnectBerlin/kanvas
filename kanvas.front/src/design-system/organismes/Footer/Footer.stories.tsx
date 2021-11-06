import { Footer, FooterProps } from './Footer';
import { Story, Meta } from '@storybook/react';

export default {
  title: 'organismes/Footer',
  component: Footer,
} as Meta;

const Template: Story<FooterProps> = (args: any) => 
    <Footer {...args} />
  ;

export const Default = Template.bind({});
  Default.args = {
};
