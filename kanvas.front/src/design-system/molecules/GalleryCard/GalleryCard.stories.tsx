import { GalleryCard } from '.';
import { Story, Meta } from '@storybook/react';

export default {
  title: 'organismes/GalleryCard',
  component: GalleryCard,
} as Meta;

const Template: Story<any> = (args: any) => 
    <GalleryCard {...args} />
;

export const Editable = Template.bind({});
Editable.args = {
  notifications: 4
};

export const NonEditable = Template.bind({});
NonEditable.args = {
  notifications: 4
};
