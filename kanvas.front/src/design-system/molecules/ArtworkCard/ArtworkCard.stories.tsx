import * as React from 'react'
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0'
import { ArtworkCard } from './ArtworkCard'
import { Box } from '@mui/material'

export default {
  title: 'Molecules/ArtworkCard',
  component: ArtworkCard,
  argTypes: {},
} as Meta

const Template: Story<any> = (args: any) => (
  <Box sx={{ height: '20rem', width: '20rem' }}>
    <ArtworkCard {...args} />
  </Box>
)

export const Drop = Template.bind({})
Drop.args = {
  url: 'https://dart-creator-image-storage.fra1.digitaloceanspaces.com/undefined_profile_picture',
  artistName: 'Jocelin Carmes',
  drop: {
    startDate: 1634924388200,
    price: 1200,
  },
  auction: {
    endDate: undefined,
    startingPrice: undefined,
  },
}

export const Auction = Template.bind({})
Auction.args = {
  url: 'https://dart-creator-image-storage.fra1.digitaloceanspaces.com/undefined_profile_picture',
  artistName: 'Jocelin Carmes',
  drop: {
    startDate: undefined,
    price: undefined,
  },
  auction: {
    endDate: 1634924388200,
    startingPrice: 1200,
  },
}
