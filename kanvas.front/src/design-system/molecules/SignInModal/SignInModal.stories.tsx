import { ComponentStory, ComponentMeta } from '@storybook/react';

import { SignInModal } from './SignInModal';

export default {
  title: 'molecules/SignInModal',
  component: SignInModal,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof SignInModal>;

const Template: ComponentStory<typeof SignInModal> = (args) => <SignInModal {...args} />;

export const Default = Template.bind({});
Default.args = {
};

export const Truncated = Template.bind({});
Truncated.args = {
};