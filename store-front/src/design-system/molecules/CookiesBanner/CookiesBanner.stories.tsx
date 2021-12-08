import { Story, Meta } from '@storybook/react/types-6-0';
import { CookiesBanner, CookiesBannerProps } from './CookiesBanner';

export default {
    title: 'Molecule/CookiesBanner',
    component: CookiesBanner,
} as Meta;

const Template: Story<CookiesBannerProps> = (args) => (
    <CookiesBanner {...args} />
);

export const WarningWithLinks = Template.bind({});
WarningWithLinks.args = {
    title: 'This website uses cookies',
    handleClose: () => alert('closed notification'),
};
