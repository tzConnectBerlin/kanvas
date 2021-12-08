import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import ClearIcon from '@mui/icons-material/Clear';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';

import { FC } from 'react';
import { Skeleton, Stack, Theme } from '@mui/material';
import { INft } from '../../../interfaces/artwork';
import Typography from '../../atoms/Typography';
import CustomCircularProgress from '../../atoms/CircularProgress';
import { useHistory } from 'react-router-dom';

interface ShoppingCartItemProps {
    loading: boolean;
    nft?: INft;
    removeNft: Function;
    removeNftLoading?: boolean;
}

const StyledDiv = styled.div<{ theme?: Theme }>`
    height: 1.5rem;
    width: 1.5rem;
    margin: 0 !important;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    transition: scale 0.1s;

    :hover {
        scale: 1.15;
    }
`;

const StyledClearIcon = styled(ClearIcon) <{ theme?: Theme }>`
    color: ${(props) => props.theme.palette.text.primary};
`;

export const ShoppingCartItem: FC<ShoppingCartItemProps> = ({
    nft,
    ...props
}) => {
    const history = useHistory()

    const navigateTo = (pathname: string) => {
        history.push({ pathname: pathname })
    }

    return props.loading ? (
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
    ) : (
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
                sx={{ width: 'auto', minWidth: '60%' }}
            >
                <Typography
                    size="h4"
                    weight="Medium"
                    display="initial !important"
                    noWrap
                    type="link"
                    onClick={() => navigateTo(`/product/${nft!.id}`)}
                    sx={{ cursor: 'pointer', width: 'auto' }}
                >
                    {nft!.name}
                </Typography>
                <Typography
                    size="body2"
                    weight="Light"
                    display="initial !important"
                    noWrap
                    color="#C4C4C4"
                    sx={{ cursor: 'pointer', maxWidth: '70%' }}
                >
                    {nft!.ipfsHash}
                </Typography>
                <Typography
                    onClick={() =>
                        props.removeNftLoading ? {} : props.removeNft(nft!.id)
                    }
                    size="body2"
                    weight="Medium"
                    type='link'
                    color="#C4C4C4"
                    sx={{ cursor: 'pointer', width: 'auto', margin: '0 !important', marginTop: '0.4rem !important' }}
                >
                    Remove
                    {props.removeNftLoading &&
                        <CustomCircularProgress height={0.6} sx={{marginLeft: '0.7rem'}} />
                    }
                </Typography>
            </Stack>
            <Typography
                size="body1"
                weight="Light"
                noWrap
                sx={{ cursor: 'pointer', width: 'auto', margin: '0 !important' }}
            >
                {`${nft!.price} ꜩ`}
            </Typography>
        </Stack>
    );
};
