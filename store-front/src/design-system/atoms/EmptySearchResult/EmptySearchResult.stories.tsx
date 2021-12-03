import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { EmptySearchResult } from './EmptySearchResult';

export default {
    title: 'Atoms/EmptySearchResult',
    component: EmptySearchResult,
} as ComponentMeta<typeof EmptySearchResult>;

const Template: ComponentStory<typeof EmptySearchResult> = (args) => (
    <EmptySearchResult {...args} />
);

export const EmptySearch = Template.bind({});
EmptySearch.args = {
    searchString: 'yololo',
};
