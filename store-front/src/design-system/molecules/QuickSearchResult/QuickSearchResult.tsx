import styled from '@emotion/styled';
import Avatar from '../../atoms/Avatar';
import FlexSpacer from '../../atoms/FlexSpacer';

import { FC } from 'react';
import { useHistory } from 'react-router';
import { CustomButton } from '../../atoms/Button';
import { Typography } from '../../atoms/Typography';
import { EmptySearchResult } from '../../atoms/EmptySearchResult';
import {
    BoxProps as MBoxProps,
    Box,
    Paper,
    Grid,
    Skeleton,
    Stack,
    Theme,
    useMediaQuery,
} from '@mui/material'

interface QuickSearResultProps {
    error: boolean;
    profilesSearchResult: any;
    artworksSearchResult: any;
    categoriesSearchResult: any;
    searchString: string | unknown;
    open?: boolean;
    closeResult: Function;
    loading?: boolean;
}

interface BoxProps extends MBoxProps {
    open?: boolean;
}

const StyledBox = styled(Box)<BoxProps>`
    display: ${(props) => (props.open ? 'flex' : 'none')};
    max-width: 35rem;

    @media (max-width: 874px) {
        right: 5%;
        max-width: 100vw;
    }
`

const StyledPaper = styled(Paper)<{ theme?: Theme }>`
    box-shadow: none;
    border-radius: 2rem;

    /* outline: ${(props) => `solid 1px ${props.theme.palette.text.primary}`}; */

    :hover {
        outline: ${(props) => `solid 2px ${props.theme.palette.text.primary}`};
    }

    transition: height 0.3s;
    background-image: none;

    @media (max-width: 874px) {
        margin-left: initial;

        outline: none;
        top: 5rem;

        :hover {
            outline: none;
        }
    }
`

const StyledHeaderStack = styled(Stack)`
    padding: 1em 1.5em;
    margin-bottom: 0.5em;
`;

const StyledContentStack = styled(Stack)`
    padding-top: 0.5em;
    padding-left: 1em;
    padding-bottom: 0.5em;
`;

const ProfileResultWrapper = styled(Stack)<{ theme?: Theme }>`
    display: flex;
    align-items: center;
    padding-left: 0.875em;
    margin-right: 1em !important;
    height: 4.5em;
    cursor: pointer;

    border-left: 2px solid ${(props) => props.theme.palette.background.paper};

    .MuiSkeleton-root {
        transform: scale(1);
    }

    &:hover {
        border-left: 2px solid
            ${(props) => props.theme.palette.primary.contrastText};
    }
`;

const StyledGrid = styled(Grid)`
    padding-right: 1.5em;
`;

export const QuickSearchResult: FC<QuickSearResultProps> = ({ ...props }) => {
    const history = useHistory();

    const navigateTo = (path: string) => {
        props.closeResult();
        history.push(path);
    };

    return (
        <StyledBox
            open={props.open}
            sx={{
                flexWrap: 'wrap',
                position: 'absolute',
                '& > :not(style)': {
                    m: 1,
                    transition: 'height 0.3s',
                    width: '90vw',
                    height: 'auto',
                    marginTop: '1.2em',
                    margin: 0,
                    paddingBottom: '1.5em',
                    paddingTop: '0.2em',
                },
            }}
        >
            <StyledPaper>
                {/* Check if we only got errors and it is not loading from the api in which case we display the empty content */}
                {!props.loading &&
                (props.error ||
                    (props.artworksSearchResult.length === 0 &&
                        props.categoriesSearchResult.length === 0)) ? (
                    <EmptySearchResult searchString={props.searchString} />
                ) : undefined}
                {props.loading ? (
                    <>
                        <StyledHeaderStack direction="row">
                            <Typography size="h4" weight="SemiBold">
                                {' '}
                                Nfts{' '}
                            </Typography>
                        </StyledHeaderStack>
                        <StyledContentStack spacing={1}>
                            {[{}, {}, {}].map(() => (
                                <ProfileResultWrapper
                                    direction="row"
                                    spacing={4}
                                >
                                    <Skeleton
                                        animation="wave"
                                        width={65}
                                        height={65}
                                        sx={{ borderRadius: 2 }}
                                    />
                                    <Skeleton
                                        animation="wave"
                                        height={14}
                                        width="50%"
                                        sx={{ borderRadius: 2 }}
                                    />
                                </ProfileResultWrapper>
                            ))}
                        </StyledContentStack>
                    </>
                ) : (
                    props.artworksSearchResult.length > 0 && (
                        <>
                            <StyledHeaderStack direction="row">
                                <Typography size="h4" weight="SemiBold">
                                    Nfts
                                </Typography>
                            </StyledHeaderStack>
                            <StyledContentStack spacing={1}>
                                {props.artworksSearchResult.map((nft: any) => (
                                    <ProfileResultWrapper
                                        direction="row"
                                        spacing={5}
                                        onMouseDown={() =>
                                            navigateTo(`/product/${nft.id}`)
                                        }
                                    >
                                        <Avatar
                                            src={nft?.dataUri}
                                            height={65}
                                            width={65}
                                            borderRadius={2}
                                        />
                                        <Typography
                                            size="h4"
                                            weight="Medium"
                                            sx={{
                                                cursor: 'pointer',
                                                width: '80%',
                                            }}
                                            display="initial !important"
                                            noWrap
                                        >
                                            {nft?.name}
                                        </Typography>
                                    </ProfileResultWrapper>
                                ))}
                            </StyledContentStack>
                        </>
                    )
                )}
                {
                    // props.tagsSearchResult.loading ?
                    props.loading ? (
                        <>
                            <StyledHeaderStack direction="row">
                                <Typography size="h4" weight="SemiBold">
                                    Categories
                                </Typography>
                            </StyledHeaderStack>
                            <StyledContentStack sx={{ marginLeft: '1em' }}>
                                <StyledGrid container spacing={2}>
                                    {[{}, {}, {}].map(() => (
                                        <Grid item>
                                            <Skeleton
                                                animation="wave"
                                                height={40}
                                                width={140}
                                                sx={{
                                                    transform: 'scale(1)',
                                                    borderRadius: 5,
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </StyledGrid>
                            </StyledContentStack>
                        </>
                    ) : (
                        props.categoriesSearchResult.length > 0 && (
                            <>
                                <StyledHeaderStack direction="row">
                                    <Typography size="h4" weight="SemiBold">
                                        Categories
                                    </Typography>
                                    <FlexSpacer />
                                </StyledHeaderStack>
                                <StyledContentStack sx={{ marginLeft: '1em' }}>
                                    <StyledGrid container spacing={2}>
                                        {props.categoriesSearchResult.map(
                                            (category: any) => (
                                                <Grid item>
                                                    <CustomButton
                                                        size="medium"
                                                        textSize="Light"
                                                        primary={false}
                                                        label={category.name}
                                                        onMouseDown={() =>
                                                            navigateTo(
                                                                `/store?categories=${category.id}`,
                                                            )
                                                        }
                                                    />
                                                </Grid>
                                            ),
                                        )}
                                    </StyledGrid>
                                </StyledContentStack>
                            </>
                        )
                    )
                }
            </StyledPaper>
        </StyledBox>
    );
};
