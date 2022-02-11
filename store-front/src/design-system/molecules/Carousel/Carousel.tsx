import { FC, useEffect, useState, useRef } from 'react';
import {
    Box,
    CardMedia,
    Skeleton,
    useMediaQuery,
    useTheme,
    Grid,
    Stack,
} from '@mui/material';
import { Typography } from '../../atoms/Typography';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import styled from '@emotion/styled';
import { NftCard } from '../../molecules/NftCard';
import { INft } from '../../../interfaces/artwork';

import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

export interface CarouselProps {
    sx?: any;
    loading?: boolean;
    selectedTheme?: string;
    open?: boolean;
    nfts?: INft[];
    emptyMessage?: string;
    emptyLink?: string;
    nftCardMode?: 'user';
    div?: any;
}

const StyledGrid = styled(Grid)`
    flex-direction: row;
    flex-wrap: wrap;
    width: 100%;
    max-width: none !important;
    flex-basis: 102% !important;
`;

export const CarouselFeatured: FC<CarouselProps> = ({ ...props }) => {
    const carouselRef = useRef(null);
    const [gridNfts, setGridNfts] = useState<INft[]>();

    const { t } = useTranslation(['translation']);
    const [comfortLoading, setComfortLoading] = useState<boolean>(false);
    // const items = gridNfts;

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

    const theme = useTheme();
    const history = useHistory();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const navigateTo = (productId: number) => {
        history.push(`/product/${productId}`);
    };

    const responsive = {
        superLargeDesktop: {
            breakpoint: { max: 2500, min: 1536 },
            items: 5,
            slidesToSlide: 2,
            partialVisibilityGutter: 10,
        },
        desktop: {
            breakpoint: { max: 1536, min: 1024 },
            items: 3,
            slidesToSlide: 1,
            partialVisibilityGutter: 10,
        },
        tablet: {
            breakpoint: { max: 1024, min: 500 },
            items: 2,
            slidesToSlide: 1,
            partialVisibilityGutter: 10,
        },
        mobile: {
            breakpoint: { max: 500, min: 0 },
            items: 1,
            slidesToSlide: 1,
            partialVisibilityGutter: 10,
        },
    };

    return (
        <>
            {/* {!gridNfts ? ( */}
            {gridNfts?.length === 0 ? (
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
            ) : (
                <Carousel
                    responsive={responsive}
                    itemClass="carousel-custom-item"
                    ref={carouselRef}
                    centerMode={true}
                >
                    {gridNfts && gridNfts.length > 0
                        ? gridNfts.map((nft) => (
                              <div style={{ marginRight: '1rem' }} key={nft.id  + Math.random().toString()}
                              >
                                  <NftCard
                                      id={nft.id.toString()}
                                      name={nft.name}
                                      ipfsHash={nft.ipfsHash}
                                      displayUri={nft.displayUri}
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
                              </div>
                          ))
                        : [...new Array(8)].map((nft) => (
                              <div style={{ marginRight: '1rem' }}>
                                  <NftCard
                                      name={''}
                                      ipfsHash={''}
                                      price={0}
                                      loading={true}
                                  />
                              </div>
                          ))}
                </Carousel>
            )}
        </>
    );
};
