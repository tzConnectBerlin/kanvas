import { Header, HeaderProps } from './Header';
import { Story, Meta } from '@storybook/react';

export default {
  title: 'Organismes/Header',
  component: Header,
} as Meta;

const Template: Story<HeaderProps> = (args: any) => 
    <Header {...args} />
  ;

export const LoggedIn = Template.bind({});
LoggedIn.args = {
  notifications: 4
};

export const LoggedOut = Template.bind({});
LoggedOut.args = {
  notifications: 4
};
