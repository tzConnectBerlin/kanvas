import styled from '@emotion/styled';
import Typography from '../../atoms/Typography';
import FlexSpacer from '../../atoms/FlexSpacer';

import { FC, useEffect, useState } from 'react';
import { Theme, Stack, Box } from '@mui/material';

interface IAuction {
    endDate?: number;
    startingPrice?: number;
}

interface IDrop {
    startDate?: number;
    price?: number;
}

interface IFixedPrice {
    price?: number;
}

interface ArtworkCardProps {
    url: string;
    artistName: string;
    curatorName?: string;
    drop: IDrop;
    auction: IAuction;
    fixedPrice: IFixedPrice;
}

const StyledElement = styled.span<{ url?: string }>`
    background: ${(props) => (props.url ? `url(${props.url})` : '')} no-repeat
        center;
    background-size: cover;

    width: 100%;

    background-color: #c4c4c4;
    opacity: 1;
    transition: opacity 0.3s;

    :hover {
        opacity: 0.5;
    }
`;

export const ArtworkCard: FC<ArtworkCardProps> = ({ ...props }) => {
    const [saleType, setSaleType] = useState<
        'Drop' | 'FixedPrice' | 'Auction' | null
    >(null);
    const [price, setPrice] = useState<number | null>(null);

    const calculateTimeLeft = (dropOrAuctionDate: number | undefined) => {
        const endDate =
            dropOrAuctionDate ??
            new Date(new Date().getTime() + new Date().getTimezoneOffset());

        // Change Reference date to utc as datetime are stored in utc in the DB
        let difference =
            +new Date(endDate) -
            +new Date(new Date().getTime() + new Date().getTimezoneOffset());

        if (difference > 0) return new Date(difference - 3600000);

        return undefined;
    };

    const [timeLeft, setTimeLeft] = useState<Date | undefined>(
        calculateTimeLeft(
            props.drop.startDate
                ? props.drop.startDate
                : props.auction.endDate
                ? props.auction.endDate
                : undefined,
        ),
    );

    useEffect(() => {
        if (props.drop && props.drop.price) {
            setSaleType('Drop');
        } else if (props.auction && props.auction.startingPrice) {
            setSaleType('Auction');
        } else if (props.fixedPrice && props.fixedPrice.price) {
            setSaleType('FixedPrice');
        }
    }, []);

    useEffect(() => {
        if (props.drop.startDate) {
            setTimeLeft(calculateTimeLeft(props.drop.startDate));

            setTimeout(() => {
                setTimeLeft(timeLeft);
            }, 1000);
        } else if (props.auction.endDate) {
            setTimeLeft(calculateTimeLeft(props.auction.endDate));

            setTimeout(() => {
                setTimeLeft(timeLeft);
            }, 1000);
        }
    }, [timeLeft]);

    useEffect(() => {
        if (props.drop.startDate && props.drop.price) {
            setPrice(props.drop.price);
        } else if (
            props.auction.startingPrice &&
            props.auction.endDate &&
            props.auction.endDate > Date.now()
        ) {
            setPrice(props.auction.startingPrice);
        }
    }, [props.drop, props.auction]);

    return (
        <Stack direction="column" sx={{ width: '100%', height: '100%' }}>
            <StyledElement className="text" url={props.url} />
            <Stack direction="row">
                <Typography
                    size="body"
                    weight="Medium"
                    color="#C4C4C4"
                    sx={{ right: '0', marginTop: '0.5rem' }}
                >
                    {' '}
                    {timeLeft
                        ? `${saleType === 'Drop' ? saleType + ' - ' : ''}` +
                          `${
                              timeLeft.getHours().toString().length === 1
                                  ? '0' + timeLeft.getHours().toString()
                                  : timeLeft.getHours().toString()
                          } : ${
                              timeLeft.getUTCMinutes().toString().length === 1
                                  ? '0' + timeLeft.getUTCMinutes().toString()
                                  : timeLeft.getUTCMinutes().toString()
                          } : ${
                              timeLeft.getUTCSeconds().toString().length === 1
                                  ? '0' + timeLeft.getUTCSeconds().toString()
                                  : timeLeft.getUTCSeconds().toString()
                          }`
                        : ''}{' '}
                </Typography>
                <FlexSpacer />
                <>
                    <Typography
                        size="body"
                        weight="Medium"
                        sx={{ right: '0', marginTop: '0.5rem' }}
                        color={price ? '' : '#C4C4C4'}
                    >
                        {' '}
                        {price ? price + '  ' : ''}{' '}
                    </Typography>
                    <Stack direction="column">
                        <Typography
                            size="h3"
                            weight="Light"
                            sx={{
                                right: '0',
                                marginTop: '0.5rem',
                                marginLeft: '0.5rem',
                                marginRight: '0.5rem',
                            }}
                            color={'#0088a7'}
                        >
                            {' '}
                            {price ? ' - ' : ''}{' '}
                        </Typography>
                        <Typography
                            size="h3"
                            weight="Light"
                            sx={{
                                right: '0',
                                marginTop: '-2rem',
                                marginLeft: '0.5rem',
                                marginRight: '0.5rem',
                            }}
                            color={'#0088a7'}
                        >
                            {' '}
                            {price ? ' - ' : ''}{' '}
                        </Typography>
                        <Typography
                            size="h3"
                            weight="Light"
                            sx={{
                                right: '0',
                                marginTop: '-2rem',
                                marginLeft: '0.5rem',
                                marginRight: '0.5rem',
                            }}
                            color={'#0088a7'}
                        >
                            {' '}
                            {price ? ' - ' : ''}{' '}
                        </Typography>
                    </Stack>
                    <Typography
                        size="body"
                        weight="Medium"
                        sx={{ right: '0', marginTop: '0.5rem' }}
                        color={'#C4C4C4'}
                    >
                        {' '}
                        {price ? ' $ ' + price * 5.12 : 'Not for sale'}{' '}
                    </Typography>
                </>
            </Stack>
        </Stack>
    );
};
