import * as React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0';
import { Typography, TypographyProps } from './Typography';

export default {
    title: 'Atoms/Typography',
    component: Typography,
    argTypes: {},
} as Meta;

const Template: Story<TypographyProps> = (args: any) => (
    <Typography {...args} />
);

export const Default = Template.bind({});
Default.args = {
    children: 'ABCDEF',
};

export const Truncated = Template.bind({});
Truncated.args = {
    truncate: true,
    children: 'Lorem ipsum dolor sit amet consectetur adipisicing elit.'.repeat(
        20,
    ),
};
