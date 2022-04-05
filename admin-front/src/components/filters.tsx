import * as React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTimeOutlined';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOnOutlined';
import AccountBoxIcon from '@mui/icons-material/AccountBoxOutlined';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolderOutlined';
import CachedIcon from '@mui/icons-material/CachedOutlined';
import QueryStatsIcon from '@mui/icons-material/QueryStatsOutlined';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SellIcon from '@mui/icons-material/Sell';
import MailIcon from '@mui/icons-material/MailOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOfferOutlined';
import { FilterList, FilterListItem } from 'react-admin';
import {
  endOfYesterday,
  startOfWeek,
  subWeeks,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { Typography } from '@mui/material';
import styled from '@emotion/styled';

const segments = [
  { id: 'compulsive', name: 'Compulsive' },
  { id: 'collector', name: 'Collector' },
  { id: 'ordered_once', name: 'Ordered Once' },
  { id: 'regular', name: 'Regular' },
  { id: 'returns', name: 'Returns' },
  { id: 'reviewer', name: 'Reviewer' },
];

const StyledTypography = styled(Typography) `
  padding-left: 2em;
`

export const DropDateFilter = () => (
  <FilterList label="Last visited" icon={<AccessTimeIcon />}>
    <FilterListItem
      label="Today"
      value={{
        last_seen_gte: endOfYesterday().toISOString(),
        last_seen_lte: undefined,
      }}
    />
    {/* <FilterListItem
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
    /> */}
  </FilterList>
);

export const Name = () => (
  <FilterList label="Name" icon={<AccountBoxIcon />}>
      <StyledTypography>Nft #1</StyledTypography>
  </FilterList>
);


export const Description = () => (
    <FilterList label="Description" icon={<DescriptionIcon />}>
        <StyledTypography>Full Description here</StyledTypography>
    </FilterList>
  );

export const Price = () => (
  <FilterList label="Price" icon={<SellIcon />}>
      <StyledTypography>1235,00</StyledTypography>
  </FilterList>
);

export const Creator = () => (
  <FilterList label="Creator" icon={<AccessibilityNewIcon />}>
    <StyledTypography>creator name</StyledTypography>
  </FilterList>
);

export const CreatedAt = () => (
  <FilterList label="Created at" icon={<CreateNewFolderIcon />}>
      <StyledTypography>01.01.2022</StyledTypography>
  </FilterList>
);
export const UpdatedAt = () => (
  <FilterList label="Updated at" icon={<CachedIcon />}>
      <StyledTypography>03.01.2022</StyledTypography>
  </FilterList>
);

export const State = () => (
  <FilterList label="State" icon={<QueryStatsIcon />}>
      <StyledTypography>minted</StyledTypography>
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

  </FilterList>
);
export const HasNewsletterFilter = () => (
  <FilterList label="Has newsletter" icon={<MailIcon />}>
    <FilterListItem label="True" value={{ has_newsletter: true }} />
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
