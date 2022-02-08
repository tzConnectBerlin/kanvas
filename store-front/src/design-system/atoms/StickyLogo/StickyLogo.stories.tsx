import { StickyLogo } from './StickyLogo';
import { Story, Meta } from '@storybook/react';

export default {
    title: 'Atoms/StickyLogo',
    component: StickyLogo,
} as Meta;

const Template: Story<typeof StickyLogo> = (args) => (
    <StickyLogo display={true} />
);
export const LoggedIn = Template.bind({});
LoggedIn.args = {};
