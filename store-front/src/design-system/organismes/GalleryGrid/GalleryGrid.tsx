import styled from '@emotion/styled';
import FlexSpacer from '../../atoms/FlexSpacer';
import Typography from '../../atoms/Typography';

import { Animated } from 'react-animated-css';
import { FC, useEffect, useState } from 'react';
import { Theme, Stack, Box } from '@mui/material';
import { Layout, Layouts, Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

interface GalleryGridProps {
    editable: boolean;
    layouts: Layouts;
    setLayouts: Function;
    assets: any[];
    emptyMessage: string;
    emptyLink: string;
    loading: boolean;
}

const StyledResponsiveReactGridLayout = styled(ResponsiveReactGridLayout)<{
    theme?: Theme;
    editable: boolean;
}>`
    .react-resizable-handle {
        position: absolute;
        width: 1.2rem;
        height: 1.2rem;
        transform: scale(1.5, 1.5);
        bottom: 4.8rem;
        right: 3.3rem;
        background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');

        opacity: ${(props) => (props.editable ? 1 : 0)};
        transition: opacity 0.3s;

        background-position: bottom right;
        padding: 0 0.4rem 0.4rem 0;

        background-repeat: no-repeat;
        background-origin: content-box;
        box-sizing: border-box;
        cursor: se-resize;
        background-color: ${(props) => props.theme.palette.background.default};
    }

    .react-grid-item {
        padding: 3rem;
    }
`;

const WrapperElement = styled.span`
    padding: 2rem;
    display: flex;
`;

export const GalleryGrid: FC<GalleryGridProps> = ({ ...props }) => {
    const onLayoutChange = (layout: any, layouts: any) => {
        props.setLayouts(layouts);
    };

    return (
        <>
            {props.loading ? (
                <Animated
                    animationIn="fadeIn"
                    animationOut="fadeOut"
                    isVisible={true}
                >
                    <Box
                        sx={{
                            justifyContent: 'center',
                            width: '100%',
                            marginTop: '5rem',
                        }}
                    >
                        <Stack direction="column" sx={{ alignItems: 'center' }}>
                            <Typography
                                size="h2"
                                weight="Light"
                                color="#C4C4C4"
                                sx={{ marginBottom: '0.5rem' }}
                            >
                                {' '}
                                Loading...{' '}
                            </Typography>
                            <Typography
                                size="body"
                                weight="Light"
                                color="#0088a7"
                            >
                                {' '}
                                Please wait a moment{' '}
                            </Typography>
                        </Stack>
                    </Box>
                </Animated>
            ) : props.assets && props.assets.length > 0 ? (
                <StyledResponsiveReactGridLayout
                    className="layout"
                    cols={{ lg: 3, md: 2, sm: 2, xs: 1, xxs: 1 }}
                    layouts={props.layouts}
                    rowHeight={500}
                    onLayoutChange={(layout, layouts) => {
                        onLayoutChange(layout, layouts);
                        console.log(layouts);
                    }}
                    editable={props.editable}
                >
                    {props.assets.map((asset: any, index: number) => (
                        <WrapperElement key={index}>{asset}</WrapperElement>
                    ))}
                </StyledResponsiveReactGridLayout>
            ) : (
                <Animated
                    animationIn="fadeIn"
                    animationOut="fadeOut"
                    isVisible={true}
                >
                    <Box
                        sx={{
                            justifyContent: 'center',
                            width: '100%',
                            marginTop: '5rem',
                        }}
                    >
                        <Stack direction="column" sx={{ alignItems: 'center' }}>
                            <Typography
                                size="h2"
                                weight="Light"
                                color="#C4C4C4"
                                sx={{ marginBottom: '0.5rem' }}
                            >
                                {' '}
                                {props.emptyMessage}{' '}
                            </Typography>
                            <Typography
                                size="body"
                                weight="Light"
                                color="#0088a7"
                                type="link"
                            >
                                {' '}
                                {props.emptyLink}{' '}
                            </Typography>
                        </Stack>
                    </Box>
                </Animated>
            )}
        </>
    );
};
