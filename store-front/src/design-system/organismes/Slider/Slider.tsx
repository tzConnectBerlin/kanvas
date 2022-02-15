import { FC } from 'react';
import {
    Box,
    CardMedia,
    Skeleton,
    useMediaQuery,
    useTheme,
    Card,
} from '@mui/material';
import { Typography } from '../../../design-system/atoms/Typography';
import { CustomButton } from '../../../design-system/atoms/Button';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import Carousel from 'react-material-ui-carousel';
import { Animated } from 'react-animated-css';
import { styled } from '@mui/material/styles';
import { INft } from '../../../interfaces/artwork';

export interface SliderProps {
    sx?: any;
    loading?: boolean;
    selectedTheme?: string;
    sliderNfts: INft[];
}

const StyledBox = styled(Animated)`
    display: flex;
    flex-direction: column;
    position: absolute;
    width: -webkit-fill-available;
    min-height: 90px;
    padding: 2rem;
    place-content: space-between;
    align-items: start;
    bottom: 0;
    right: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(8px) saturate(100%) contrast(45%) brightness(80%);
`;

export const Slider: FC<SliderProps> = ({ ...props }) => {
    const { t } = useTranslation(['translation']);

    const theme = useTheme();
    const history = useHistory();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const navigateTo = (productId: number) => {
        history.push(`/product/${productId}`);
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: isMobile ? 'none' : 'block',
                borderRadius: 0,
                marginLeft: 'auto',
                width: '80%',
            }}
        >
            <Carousel
                swipe={true}
                cycleNavigation
                interval={4000}
                autoPlay={true}
                animation="slide"
                activeIndicatorIconButtonProps={{
                    style: {
                        backgroundColor: '#00000019',
                    },
                }}
            >
                {props.sliderNfts.map((nft: INft) => {
                    function addWithUnion(arg1: any, arg2: any) {
                        return arg1 + arg2;
                    }

                    return (
                        <Card
                            sx={{
                                display: 'flex',
                                borderRadius: '1rem',
                                height: '100%',
                            }}
                            key={addWithUnion(Date, nft.id)}
                        >
                            <StyledBox
                                animationInDelay={1200}
                                animationIn="fadeIn"
                                animationOut="fadeOut"
                                isVisible={true}
                            >
                                <Typography
                                    size="h2"
                                    weight="SemiBold"
                                    color="#fff"
                                >
                                    {nft.name}
                                </Typography>

                                <CustomButton
                                    size="medium"
                                    onClick={() => navigateTo(nft.id)}
                                    label={t('home.hero.button_3')}
                                />
                            </StyledBox>
                            <CardMedia
                                image={nft.displayUri}
                                component="img"
                                sx={{
                                    pointerEvents: 'none',
                                    height: '80vh',
                                    minHeight: 400,
                                    maxHeight: 600,
                                    maxWidth: '100%',
                                }}
                                alt="random"
                            ></CardMedia>
                        </Card>
                    );
                })}
            </Carousel>
        </Box>
    );
};
