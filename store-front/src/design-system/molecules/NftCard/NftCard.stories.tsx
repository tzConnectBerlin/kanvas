import { NftCard } from '.';
import { Story, Meta } from '@storybook/react';

export default {
    title: 'Molecules/NftCard',
    component: NftCard,
} as Meta;

const Template: Story<any> = (args: any) => <NftCard {...args} />;
export const Editable = Template.bind({});
Editable.args = {
    notifications: 4,
};

export const NonEditable = Template.bind({});
NonEditable.args = {
    notifications: 4,
};
