import { GalleryGrid } from './GalleryGrid';
import { Story, Meta } from '@storybook/react';

export default {
  title: 'organismes/GalleryGrid',
  component: GalleryGrid,
} as Meta;

const Template: Story<any> = (args: any) => 
    <GalleryGrid {...args} />
  ;

export const Editable = Template.bind({});
Editable.args = {
  notifications: 4
};

export const NonEditable = Template.bind({});
NonEditable.args = {
  notifications: 4
};
