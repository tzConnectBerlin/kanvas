import { UsersCard } from './UsersCard';
import { Story, Meta } from '@storybook/react';

export default {
    title: 'Organismes/UsersCard',
    component: UsersCard,
} as Meta;

const Template: Story<any> = (args: any) => <UsersCard {...args} />;
export const Editable = Template.bind({});
Editable.args = {
    notifications: 4,
};

export const NonEditable = Template.bind({});
NonEditable.args = {
    notifications: 4,
};