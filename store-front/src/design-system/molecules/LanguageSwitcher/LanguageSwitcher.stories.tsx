import * as React from 'react';
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0';
import { LanguageSwitcher } from './LanguageSwitcher';

export default {
    title: 'Molecules/Typography',
    component: LanguageSwitcher,
    argTypes: {},
} as Meta;

const Template: Story = (args: any) => <LanguageSwitcher {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Truncated = Template.bind({});
Truncated.args = {};
