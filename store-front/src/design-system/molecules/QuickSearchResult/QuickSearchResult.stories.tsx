import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';

import { QuickSearchResult } from './QuickSearchResult';
import { ApolloError, LazyQueryResult } from '@apollo/client';

export default {
    title: 'Molecules/QuickSearchResult',
    component: QuickSearchResult,
} as ComponentMeta<typeof QuickSearchResult>;

const Template: ComponentStory<typeof QuickSearchResult> = (args) => (
    <QuickSearchResult {...args} />
);

export const SuggestionLoading = Template.bind({});
SuggestionLoading.args = {
    open: undefined,
    profilesSearchResult: {
        error: undefined,
        loading: false,
        data: [],
    },
    artworksSearchResult: {
        error: undefined,
        loading: false,
        data: [],
    },
    categoriesSearchResult: {
        error: undefined,
        loading: true,
        data: [],
    },
};

export const Suggestion = Template.bind({});
Suggestion.args = {
    open: true,
    profilesSearchResult: {
        error: ApolloError,
    },
    artworksSearchResult: {
        error: ApolloError,
    },
    categoriesSearchResult: {
        error: undefined,
        loading: false,
        data: [
            {
                name: '#3D',
            },
            {
                name: '#digitalArt',
            },
            {
                name: '#fashion',
            },
            {
                name: '#illustration',
            },
            {
                name: '#dArtPick',
            },
            {
                name: '#landscape',
            },
        ],
    },
};

export const LoadingResult = Template.bind({});
LoadingResult.args = {
    open: true,
    profilesSearchResult: {
        error: undefined,
        loading: true,
    },
    artworksSearchResult: {
        error: undefined,
        loading: true,
    },
    categoriesSearchResult: {
        error: undefined,
        loading: true,
        data: [],
    },
};

export const Result = Template.bind({});
Result.args = {
    open: true,
    profilesSearchResult: {
        error: undefined,
        loading: false,
        data: [
            {
                picture: '/img/Avatar/avatar_1.jpg',
                name: 'Jocelin Carmes',
            },
            {
                picture: '/img/Avatar/avatar_2.jpg',
                name: 'Aurélia Durand',
            },
            {
                picture: '/img/Avatar/avatar_3.jpg',
                name: 'Thierry Akiapo',
            },
        ],
    },
    artworksSearchResult: {
        error: undefined,
        loading: false,
        data: [
            {
                picture: '/img/Artwork/artwork_1.jpg',
                name: 'Fruits & Spyder',
            },
            {
                picture: '/img/Artwork/artwork_2.jpg',
                name: 'Fries & Burger',
            },
            {
                picture: '/img/Artwork/artwork_3.png',
                name: 'Drôle de heads',
            },
        ],
    },
    categoriesSearchResult: {
        error: undefined,
        loading: false,
        data: [
            {
                name: '#3D',
            },
            {
                name: '#digitalArt',
            },
        ],
    },
};

export const NoResult = Template.bind({});
NoResult.args = {
    open: true,
    profilesSearchResult: {
        error: undefined,
        loading: false,
        data: [],
    },
    artworksSearchResult: {
        error: undefined,
        loading: false,
        data: [],
    },
    categoriesSearchResult: {
        error: undefined,
        loading: false,
        data: [],
    },
    searchString: 'yololo',
};
