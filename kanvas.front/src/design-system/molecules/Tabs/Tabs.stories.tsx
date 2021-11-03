import { ComponentStory, ComponentMeta } from '@storybook/react';

import { Tabs } from './Tabs';

export default {
  title: 'molecules/Tabs',
  component: Tabs,
  argTypes: {
    backgroundColor: { control: 'color' },
  },
} as ComponentMeta<typeof Tabs>;

const Template: ComponentStory<typeof Tabs> = (args) => <Tabs {...args} />;

export const Tab = Template.bind({});
Tab.args = {
    tabs: [{
        label: 'Gallery',
        value: 1
    },{
        label: 'Creations',
        value: 2
    },{
        label: 'Artists',
        value: 3
    }
]
};

