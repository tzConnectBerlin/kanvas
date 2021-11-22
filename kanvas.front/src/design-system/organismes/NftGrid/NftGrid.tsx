import styled from '@emotion/styled'
import FlexSpacer from '../../atoms/FlexSpacer'
import Typography from '../../atoms/Typography'

import { FC } from 'react'
import { Grid } from '@mui/material'
import { Layouts } from 'react-grid-layout'

import { NftCard } from '../../molecules/NftCard'
import { INft } from '../../../interfaces/artwork'

export interface NftGridProps {
  editable?: boolean
  layouts?: Layouts
  setLayouts?: Function
  assets?: any[]
  emptyMessage?: string
  emptyLink?: string
  loading?: boolean
  open?: boolean
  nfts?: INft[]
}

const StyledGrid = styled(Grid)`
  transition: all 0.2s;
  width: 100%;
  max-width: none !important;
  flex-basis: 100% !important;
  margin: 0;
  padding: -1.5rem;
  min-height: 60vh;
`

const StyledGridItem = styled(Grid)`
  padding: 1.5rem;

  @media (max-width: 650px) {
    padding-left: 0;
    padding-right: 0;
  }
`

export const NftGrid: FC<NftGridProps> = ({ ...props }) => {
  return (
    <>
      {props.nfts && props.nfts.length > 0 ? (
        <StyledGrid container lg={props.open ? 12 : 9} md={props.open ? 9 : 6}>
          {props.nfts.map((nft) => (
            <StyledGridItem
              item
              lg={props.open ? 4 : 3}
              md={props.open ? 6 : 4}
              xs={12}
            >
              <NftCard
                id={nft.id.toString()}
                name={nft.name}
                ipfsHash={nft.ipfsHash}
                dataUri={nft.dataUri}
                price={nft.price}
                loading={props.loading}
              />
            </StyledGridItem>
          ))}
        </StyledGrid>
      ) : props.loading ? (
        <StyledGrid container lg={props.open ? 12 : 9} md={props.open ? 9 : 6}>
          {[...new Array(9)].map((nft) => (
            <StyledGridItem
              item
              lg={props.open ? 4 : 3}
              md={props.open ? 6 : 4}
              xs={12}
            >
              <NftCard name={''} ipfsHash={''} price={0} loading={true} />
            </StyledGridItem>
          ))}
        </StyledGrid>
      ) : (
        <StyledGrid>
          <Typography
            size="h2"
            weight="Light"
            align="center"
            color="#C4C4C4"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            {props.emptyMessage ? props.emptyMessage : 'No Data'}
          </Typography>
          <Typography
            size="subtitle2"
            weight="Light"
            align="center"
            color="#0088a7"
            sx={{ display: 'flex', justifyContent: 'center' }}
          >
            {props.emptyLink ? props.emptyLink : undefined}
          </Typography>
        </StyledGrid>
      )}
    </>
  )
}
