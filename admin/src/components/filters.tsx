import * as React from 'react';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOnOutlined';
import MailIcon from '@material-ui/icons/MailOutline';
import LocalOfferIcon from '@material-ui/icons/LocalOfferOutlined';
import { FilterList, FilterListItem } from 'react-admin';
import {
    endOfYesterday,
    startOfWeek,
    subWeeks,
    startOfMonth,
    subMonths,
} from 'date-fns';


const segments = [
    { id: 'compulsive', name: 'Compulsive' },
    { id: 'collector', name: 'Collector' },
    { id: 'ordered_once', name: 'Ordered Once' },
    { id: 'regular', name: 'Regular' },
    { id: 'returns', name: 'Returns' },
    { id: 'reviewer', name: 'Reviewer' },
];

export const LastVisitedFilter = () => (
    <FilterList label="Last visited" icon={<AccessTimeIcon />}>
        <FilterListItem
            label="Today"
            value={{
                last_seen_gte: endOfYesterday().toISOString(),
                last_seen_lte: undefined,
            }}
        />
        <FilterListItem
            label="This week"
            value={{
                last_seen_gte: startOfWeek(new Date()).toISOString(),
                last_seen_lte: undefined,
            }}
        />
        <FilterListItem
            label="Last week"
            value={{
                last_seen_gte: subWeeks(startOfWeek(new Date()), 1).toISOString(),
                last_seen_lte: startOfWeek(new Date()).toISOString(),
            }}
        />
        <FilterListItem
            label="This month"
            value={{
                last_seen_gte: startOfMonth(new Date()).toISOString(),
                last_seen_lte: undefined,
            }}
        />
        <FilterListItem
            label="Last month"
            value={{
                last_seen_gte: subMonths(startOfMonth(new Date()),1).toISOString(),
                last_seen_lte: startOfMonth(new Date()).toISOString(),
            }}
        />
        <FilterListItem
            label="Earlier"
            value={{
                last_seen_gte: undefined,
                last_seen_lte: subMonths(startOfMonth(new Date()),1).toISOString(),
            }}
        />
    </FilterList>
);
export const HasOrderedFilter = () => (
    <FilterList
        label="Has ordered"
        icon={<MonetizationOnIcon />}
    >
        <FilterListItem
            label="True"
            value={{
                nb_commands_gte: 1,
                nb_commands_lte: undefined,
            }}
        />
        <FilterListItem
            label="False"
            value={{
                nb_commands_gte: undefined,
                nb_commands_lte: 0,
            }}
        />
    </FilterList>
);
export const HasNewsletterFilter = () => (
    <FilterList
        label="Has newsletter"
        icon={<MailIcon />}
    >
        <FilterListItem
            label="True"
            value={{ has_newsletter: true }}
        />
        <FilterListItem
            label="False"
            value={{ has_newsletter: false }}
        />
    </FilterList>
);
export const SegmentFilter = () => (
    <FilterList
        label="Segment"
        icon={<LocalOfferIcon />}
    >
        {segments.map(segment => (
            <FilterListItem
                label={segment.name}
                key={segment.id}
                value={{ groups: segment.id }}
            />
        ))}
    </FilterList>
);