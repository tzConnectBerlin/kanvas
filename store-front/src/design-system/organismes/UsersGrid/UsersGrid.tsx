import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';
import { FC, useEffect, useState } from 'react';
import { Grid, Stack, Theme } from '@mui/material';
import UsersCard from '../../molecules/UsersCard';

export interface UsersGridProps {
    emptyMessage?: string;
    emptyLink?: string;
    loading?: boolean;
    sx?: any;
    theme?: Theme;
    users: any[];
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

export const UsersGrid: FC<UsersGridProps> = ({ ...props }) => {
    const [comfortLoading, setComfortLoading] = useState<boolean>(false);

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
            {props.users && props.users.length > 0 ? (
                <StyledGrid container rowSpacing={5} spacing={2}>
                    {props.users.map((user, index) => (
                        <Grid
                            item
                            lg={3}
                            md={4}
                            sm={6}
                            xs={12}
                            key={`users-${
                                new Date().getTime() + Math.random()
                            }`}
                        >
                            <UsersCard
                                name={user.userName}
                                index={index + 1}
                                amountBought={user.totalPaid}
                                profilePicture={user.userPicture}
                                userAddress={user.userAddress}
                                // No verified profile yet in Db
                                verified={false}
                            />
                        </Grid>
                    ))}
                </StyledGrid>
            ) : props.loading || comfortLoading ? (
                <StyledGrid
                    container
                    md={12}
                    rowSpacing={5}
                    columnSpacing={{ xs: 1, sm: 2, md: 5 }}
                >
                    {[...Array(12)].map((user, index) => (
                        <Grid
                            item
                            lg={3}
                            md={4}
                            sm={6}
                            xs={12}
                            key={`users-loading-${
                                new Date().getTime() + Math.random()
                            }`}
                        >
                            <UsersCard index={index + 1} loading={true} />
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
                    </Stack>
                </StyledGrid>
            )}
        </StyledDiv>
    );
};
