import styled from '@emotion/styled'
import Typography from '../../atoms/Typography'
import { FC } from 'react'
import { Grid, useMediaQuery, useTheme } from '@mui/material'
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
  openFilters?: boolean
  collapsed?: boolean
  sx?: any
}

const StyledGrid = styled(Grid)`
  transition: all 0.2s;
  width: 100%;
  max-width: none !important;
  flex-basis: 100% !important;
  margin: 0;
  padding: 0;
  max-height: 60%;
`

export const NftGrid: FC<NftGridProps> = ({ ...props }) => {
  const theme = useTheme()
 

  return (
    <>
      {props.nfts && props.nfts.length > 0 ? (
        <StyledGrid
          container
          md={props.open ? 9 : 6}
          lg={props.open ? 12 : 9}
          rowSpacing={5}
          columnSpacing={{ xs: 1, sm: 2, md: 5 }}
        >
          {props.nfts.map((nft) => (
            <Grid item lg={props.open ? 4 : 3} md={props.open ? 6 : 4} sm={6} xs={12}>
              <NftCard
                id={nft.id.toString()}
                name={nft.name}
                ipfsHash={nft.ipfsHash}
                dataUri={nft.dataUri}
                price={nft.price}
                loading={props.loading}
              />
            </Grid>
          ))}
        </StyledGrid>
      ) : props.loading ? (
        <Grid
          container
          md={props.open ? 9 : 6}
          lg={props.open ? 12 : 9}
          rowSpacing={5}
          columnSpacing={{ xs: 1, sm: 2, md: 5 }}
        >
          {[...new Array(9)].map((nft) => (
            <Grid item lg={props.open ? 4 : 3} md={props.open ? 6 : 4} sm={6} xs={12}>
              <NftCard name={''} ipfsHash={''} price={0} openFilters={props.openFilters} loading={true} />
            </Grid>
          ))}
        </Grid>
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
