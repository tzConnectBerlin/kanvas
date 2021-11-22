import styled from '@emotion/styled'
import Avatar from '../../atoms/Avatar'
import ClearIcon from '@mui/icons-material/Clear'
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined'

import { FC } from 'react';
import { Skeleton, Stack, Theme } from '@mui/material'
import { INft } from '../../../interfaces/artwork'
import Typography from '../../atoms/Typography';

interface ShoppingCartItemProps {
	loading: boolean
	nft?: INft
	removeNft: Function
}

const StyledDiv = styled.div<{ theme?: Theme }>`
  height: 1.5rem;
  width: 1.5rem;
  margin: 0 !important;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid ${(props) => props.theme.palette.text.primary};

  :hover {
    outline: 1px solid ${(props) => props.theme.palette.text.primary};
    transition: outline 0.1s;
  }

  :active {
    outline: 1px solid #c4c4c4;
    transition: outline 0.1s;
  }
`

const StyledClearIcon = styled(ClearIcon) <{ theme?: Theme }>`
  color: ${(props) => props.theme.palette.text.primary};
`

export const ShoppingCartItem: FC<ShoppingCartItemProps> = ({ nft, ...props }) => {
	return (
		props.loading ?
			<Stack
				direction="row"
				spacing={4}
				sx={{ width: 'auto', alignItems: 'center' }}
			>
				<Skeleton
					animation="pulse"
					width={65}
					height={65}
					sx={{
						borderRadius: 0,
						transform: 'none',
						transformOrigin: 'none',
					}}
				/>
				<Stack
					direction="column"
					spacing={1}
					sx={{ width: 'auto', minWidth: '60%' }}
				>
					<Skeleton
						animation="pulse"
						height={14}
						width="60%"
						sx={{ borderRadius: 0 }}
					/>
					<Skeleton
						animation="pulse"
						height={14}
						width="40%"
						sx={{ borderRadius: 0 }}
					/>
				</Stack>
			</Stack>
			:
			<Stack
				direction="row"
				spacing={4}
				sx={{ width: 'auto', alignItems: 'center' }}
			>
				<Avatar
					src={nft!.dataUri ? nft!.dataUri : undefined}
					height={62}
					width={62}
					borderRadius={0}
					responsive
				>
					<ImageNotSupportedOutlinedIcon />
				</Avatar>
				<Stack
					direction="column"
					spacing={1}
					sx={{ width: 'auto', minWidth: '60%' }}
				>
					<Typography
						size="h4"
						weight="Medium"
						display="initial !important"
						noWrap
						sx={{ cursor: 'pointer' }}
					>
						{' ' + nft!.name + ' '}
					</Typography>
					<Typography
						size="body2"
						weight="Light"
						display="initial !important"
						noWrap
						color="#C4C4C4"
						sx={{ cursor: 'pointer' }}
					>
						{' '}
						{nft!.ipfsHash}{' '}
					</Typography>
				</Stack>
				<StyledDiv onClick={() => props.removeNft(nft!.id)}>
					<StyledClearIcon />
				</StyledDiv>
			</Stack>
	)
}