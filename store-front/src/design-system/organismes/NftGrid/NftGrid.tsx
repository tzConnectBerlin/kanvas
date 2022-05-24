import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';

import { FC, useEffect, useState } from 'react';
import { Grid, Stack } from '@mui/material';

import { NftCard } from '../../molecules/NftCard';
import { INft } from '../../../interfaces/artwork';

export interface NftGridProps {
    editable?: boolean;
    assets?: any[];
    emptyMessage?: string;
    emptyLink?: string;
    loading?: boolean;
    open?: boolean;
    nfts?: INft[];
    openFilters?: boolean;
    collapsed?: boolean;
    sx?: any;
    nftCardMode?: 'user';
}

const StyledGrid = styled(Grid)`
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    max-width: none !important;
    flex-basis: 102% !important;
`;

const StyledDiv = styled.div`
    width: 100%;
`;

export const NftGrid: FC<NftGridProps> = ({ ...props }) => {
    const [gridNfts, setGridNfts] = useState<INft[]>();
    const [comfortLoading, setComfortLoading] = useState<boolean>(false);

    useEffect(() => {
        if (props.nfts) {
            setGridNfts(props.nfts);
        }
    }, [props.nfts]);

    useEffect(() => {
        if (props.loading) {
            setComfortLoading(true);
            setTimeout(() => {
                setComfortLoading(false);
            }, 400);
        }
    }, [props.loading]);

    return (
        <StyledDiv>
            {gridNfts && gridNfts.length > 0 ? (
                <StyledGrid
                    container
                    rowSpacing={4}
                    spacing={24}
                    columnSpacing={{ sm: 4 }}
                >
                    {gridNfts.map((nft, index) => (
                        <Grid
                            item
                            lg={props.open ? 4 : 3}
                            md={props.open ? 6 : 4}
                            sm={6}
                            xs={12}
                            key={`users-${index}`}
                        >
                            <NftCard
                                id={nft.id.toString()}
                                name={nft.name}
                                ipfsHash={nft.ipfsHash}
                                displayUri={nft.displayUri}
                                thumbnailUri={nft.thumbnailUri}
                                price={nft.price}
                                loading={props.loading}
                                editionsAvailable={Number(
                                    nft.editionsAvailable,
                                )}
                                nftCardMode={props.nftCardMode}
                                launchAt={nft.launchAt * 1000}
                                ownerStatus={
                                    nft.ownerStatuses
                                        ? nft.ownerStatuses[0]
                                        : undefined
                                }
                            />
                        </Grid>
                    ))}
                </StyledGrid>
            ) : props.loading || comfortLoading ? (
                <StyledGrid
                    container
                    rowSpacing={5}
                    columnSpacing={{ xs: 1, sm: 2, md: 5 }}
                >
                    {[...new Array(8)].map((nft, index) => (
                        <Grid
                            item
                            lg={props.open ? 4 : 3}
                            md={props.open ? 6 : 4}
                            sm={6}
                            xs={12}
                            key={`nft-loader-${index}`}
                        >
                            <NftCard
                                name={''}
                                ipfsHash={''}
                                price={0}
                                openFilters={props.openFilters}
                                loading={true}
                            />
                        </Grid>
                    ))}
                </StyledGrid>
            ) : (
                <StyledGrid>
                    <Stack
                        direction="column"
                        sx={{ minHeight: '20vh', justifyContent: 'center' }}
                    >
                        <Typography
                            size="h2"
                            weight="Light"
                            align="center"
                            color="#C4C4C4"
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {props.emptyMessage
                                ? props.emptyMessage
                                : 'No Data'}
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
                    </Stack>
                </StyledGrid>
            )}
        </StyledDiv>
    );
};
