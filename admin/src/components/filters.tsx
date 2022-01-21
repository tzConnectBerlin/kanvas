import * as React from 'react';
import AccessTimeIcon from '@material-ui/icons/AccessTimeOutlined';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOnOutlined';
import AccountBoxIcon from '@mui/icons-material/AccountBoxOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolderOutlined';
import CachedIcon from '@mui/icons-material/CachedOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SellIcon from '@mui/icons-material/Sell';
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
import { Typography } from '@mui/material';

const segments = [
  { id: 'compulsive', name: 'Compulsive' },
  { id: 'collector', name: 'Collector' },
  { id: 'ordered_once', name: 'Ordered Once' },
  { id: 'regular', name: 'Regular' },
  { id: 'returns', name: 'Returns' },
  { id: 'reviewer', name: 'Reviewer' },
];

export const DropDateFilter = () => (
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
        last_seen_gte: subMonths(startOfMonth(new Date()), 1).toISOString(),
        last_seen_lte: startOfMonth(new Date()).toISOString(),
      }}
    />
    <FilterListItem
      label="Earlier"
      value={{
        last_seen_gte: undefined,
        last_seen_lte: subMonths(startOfMonth(new Date()), 1).toISOString(),
      }}
    />
  </FilterList>
);

export const Name = () => (
  <FilterList label="Name" icon={<AccountBoxIcon />}>

      <Typography>Nft #1</Typography>
  </FilterList>
);


export const Description = () => (
    <FilterList label="Description" icon={<DescriptionIcon />}>
        <Typography>Full Description here</Typography>
    </FilterList>
  );

export const Price = () => (
  <FilterList label="Price" icon={<SellIcon />}>
      <Typography>1235,00</Typography>
  </FilterList>
);

export const Creator = () => (
  <FilterList label="Creator" icon={<AccessibilityNewIcon />}>
    <Typography>creator name</Typography>
  </FilterList>
);

export const CreatedAt = () => (
  <FilterList label="Created at" icon={<CreateNewFolderIcon />}>
      <Typography>01.01.2022</Typography>
  </FilterList>
);
export const UpdatedAt = () => (
  <FilterList label="Updated at" icon={<CachedIcon />}>
      <Typography>03.01.2022</Typography>
  </FilterList>
);

export const State = () => (
  <FilterList label="State" icon={<QueryStatsIcon />}>
      <Typography>minted</Typography>
  </FilterList>
);

export const HasOrderedFilter = () => (
  <FilterList label="Has ordered" icon={<MonetizationOnIcon />}>
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
  <FilterList label="Has newsletter" icon={<MailIcon />}>
    <FilterListItem label="True" value={{ has_newsletter: true }} />
    <FilterListItem label="False" value={{ has_newsletter: false }} />
  </FilterList>
);
export const SegmentFilter = () => (
  <FilterList label="Categories" icon={<LocalOfferIcon />}>
    {segments.map((segment) => (
      <FilterListItem
        label={segment.name}
        key={segment.id}
        value={{ groups: segment.id }}
      />
    ))}
  </FilterList>
);
