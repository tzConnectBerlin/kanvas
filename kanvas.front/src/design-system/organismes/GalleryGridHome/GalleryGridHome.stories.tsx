import { GalleryGridHome } from './GalleryGridHome';
import { Story, Meta } from '@storybook/react';

export default {
  title: 'organismes/GalleryGrid',
  component: GalleryGridHome,
} as Meta;

const Template: Story<any> = (args: any) => 
    <GalleryGridHome {...args} />
  ;

export const Editable = Template.bind({});
Editable.args = {
  notifications: 4
};

export const NonEditable = Template.bind({});
NonEditable.args = {
  notifications: 4
};
