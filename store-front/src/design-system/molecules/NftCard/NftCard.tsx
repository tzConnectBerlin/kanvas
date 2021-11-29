import { Skeleton, Stack, useMediaQuery, Theme, useTheme } from '@mui/material'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '../../atoms/Typography'
import { useHistory } from 'react-router-dom'
import styled from '@emotion/styled'
import { Box } from '@mui/system'
import TezosLogo from '../../atoms/TezosLogo/TezosLogo'

export interface NftCardProps {
    loading?: boolean
    id?: string
    name?: string
    price?: number
    height?: number
    ipfsHash?: string
    openFilters?: boolean
    dataUri?: string
    editionsAvailable?: number
}

const StyledBioWrapper = styled.div<{ theme?: Theme }>`
    align-self: flex-start;
`
const StyledImgWrapper = styled.div<{ theme?: Theme }>`
    position: relative;
    overflow: hidden;
    min-height: 90vw;

    @media (min-width: 600px) {
        min-height: 40vw;
    }

    @media (min-width: 650px) {
        min-height: 25vw;
    }

    @media (min-width: 900px) {
        min-height: 23.5vw;
    }

    @media (min-width: 1200px) {
        min-height: 17vw;
    }

    @media (min-width: 1440px) {
        min-height: 330px;
        max-height: 370px;
    }
`

const StyledSkeleton = styled(Skeleton)`
    min-height: 90vw;

    @media (min-width: 600px) {
        min-height: 40vw;
    }

    @media (min-width: 650px) {
        min-height: 25vw;
    }

    @media (min-width: 900px) {
        min-height: 23.5vw;
    }

    @media (min-width: 1200px) {
        min-height: 17vw;
    }

    @media (min-width: 1440px) {
        min-height: 330px;
        max-height: 370px;
    }
`

const StyledImg = styled.img<{ theme?: Theme }>`
    position: absolute;
    width: 100%;
    height: -webkit-fill-available;
    object-position: center center;
    object-fit: cover;
    height: 100%;
`

const AvailabilityWrapper = styled.div<{ inStock: boolean }>`
    position: absolute;
    top: 1rem;
    right: 1rem;

    background-color: ${(props) => (props.inStock ? '#00ca00' : 'red')};

    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;

    border-radius: 0.2rem;
`

export const NftCard: React.FC<NftCardProps> = ({ loading, ...props }) => {
    const history = useHistory()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    const handleRedirect = (path: string) => {
        history.push(path)
    }

    return !loading ? (
        <Card
            onClick={() => handleRedirect(`/product/${props.id}`)}
            sx={{
                borderRadius: 0,
                height: props.height,
                display: 'flex',
                position: 'relative',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100%',
                cursor: 'pointer',
            }}
        >
            <StyledImgWrapper>
                <StyledImg
                    data-object-fit="cover"
                    src={props.dataUri}
                    alt="random"
                />
            </StyledImgWrapper>

            <CardContent
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <AvailabilityWrapper
                    inStock={(props.editionsAvailable ?? 0) > 0}
                >
                    <Typography weight="SemiBold" size="body2" color="white">
                        {(props.editionsAvailable ?? 0) > 0
                            ? 'In stock'
                            : 'Sold out'}
                    </Typography>
                </AvailabilityWrapper>
                <StyledBioWrapper>
                    <Typography weight="SemiBold" size="h4">
                        {props.name}
                    </Typography>

                    <Box flexGrow="1" marginBottom=".5rem">
                        <Typography weight="Light" size="body">
                            Long Artist name here
                        </Typography>
                    </Box>
                </StyledBioWrapper>

                <Box
                    display="flex"
                    flexDirection="row"
                    alignSelf="self-start"
                    width="100%"
                >
                    <Typography weight="Light" size="body">
                        Remaining time
                    </Typography>

                    <Box display="flex" flexDirection="row" marginLeft="auto">
                        <Typography
                            weight="SemiBold"
                            size="h3"
                            marginLeft="auto"
                        >
                            {' '}
                            {props.price ? props.price : '- '}
                        </Typography>

                        <Typography
                            weight="Currency"
                            size="h3"
                            marginLeft="auto"
                        >
                            <TezosLogo width="18px" margin="0 0.2rem" />
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    ) : (
        <Card
            sx={{
                borderRadius: 0,
                height: props.height,
                display: 'flex',
                position: 'relative',
                flexDirection: 'column',
                width: '100%',
                minHeight: '100%',
            }}
        >
            <StyledSkeleton
                variant="rectangular"
                width={'100%'}
                height={'120%'}
            />

            <CardContent
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <StyledBioWrapper>
                    <Typography weight="SemiBold" size="h4">
                        <Skeleton width="7rem" />
                    </Typography>

                    <Box flexGrow="1" marginBottom=".5rem">
                        <Typography weight="Light" size="body">
                            <Skeleton width="5rem" />
                        </Typography>
                    </Box>
                </StyledBioWrapper>

                <Box
                    display="flex"
                    flexDirection="row"
                    alignSelf="self-start"
                    width="100%"
                >
                    <Typography weight="Light" size="body">
                        <Skeleton width="3rem" />
                    </Typography>

                    <Box display="flex" flexDirection="row" marginLeft="auto">
                        <Typography
                            weight="SemiBold"
                            size="h3"
                            marginLeft="auto"
                        >
                            <Skeleton width="3rem" />
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}
