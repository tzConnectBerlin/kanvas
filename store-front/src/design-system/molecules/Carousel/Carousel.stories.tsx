import { CarouselFeatured } from './Carousel';
import { Story, Meta } from '@storybook/react';

export default {
    title: 'organismes/CarouselFeatured',
    component: CarouselFeatured,
} as Meta;

const Template: Story<any> = (args: any) => <CarouselFeatured {...args} />;
export const Editable = Template.bind({});
Editable.args = {
    notifications: 4,
};

export const NonEditable = Template.bind({});
NonEditable.args = {
    notifications: 4,
};
