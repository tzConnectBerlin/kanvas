
import { UsersGrid } from './UsersGrid';
import { Story, Meta } from '@storybook/react';

export default {
    title: 'Organismes/UsersGrid',
    component: UsersGrid,
} as Meta;

const Template: Story<any> = (args: any) => <UsersGrid {...args} />;
export const Editable = Template.bind({});
Editable.args = {
    notifications: 4,
};

export const NonEditable = Template.bind({});
NonEditable.args = {
    notifications: 4,
};