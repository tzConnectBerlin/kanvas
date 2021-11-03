import styled from "@emotion/styled";
import FlexSpacer from "../../atoms/FlexSpacer";
import Typography from "../../atoms/Typography";

import { Animated } from "react-animated-css";
import { FC, useEffect, useState } from "react";
import { Theme, Stack, Box, Container, Grid, Slide, IconButton, Button } from "@mui/material";
import { Layout, Layouts, Responsive, WidthProvider } from "react-grid-layout";
import IconExpansionTreeView from '../../molecules/TreeView/TreeView';
import { GalleryCard } from "../../molecules/GalleryCard";
import ListIcon from '@mui/icons-material/List';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export interface GalleryGridHomeProps {
  editable?: boolean;
  layouts?: Layouts;
  setLayouts?: Function;
  assets?: any[];
  emptyMessage?: string;
  emptyLink?: string;
  loading?: boolean;
}
 
const WrapperElement = styled.span`
  padding: 2rem;
  display: flex;
`;

const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const GalleryGridHome: FC<GalleryGridHomeProps> = ({ ...props }) => {
 
    const [menuOpen, setMenuOpen] = useState(true);

    const handleClick = () => {
        setMenuOpen(!menuOpen);
    };

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(true);
  return (
    <>    
        {/* Toggle options */}
        <Container
            sx={{ py: 0, display: 'flex' }}
            maxWidth="lg"
        >
            <IconButton
                onClick={handleClick}
                color="primary"
                aria-label="upload picture"
                component="span"
            >
                <ListIcon />
            </IconButton>

            <Button
                onClick={() => setLoading(!loading)}
                aria-label="loading"
                color="primary"
            >
                Toggle loading
            </Button>
            <Button
                onClick={() => setData(!data)}
                aria-label="data"
            >
                Toggle data
            </Button>
        </Container>
        
        {/* Gallery */}
        <Container
            sx={{ py: 8, overflow: 'hidden' }}
            maxWidth="lg"
        >
            {/* Grid Component - NFT GALLERY */}
            <Grid container spacing={2}>
                <Slide
                    direction="down"
                    in={menuOpen}
                    mountOnEnter
                    unmountOnExit
                >
                    <Grid item md={3}>
                        <IconExpansionTreeView />
                    </Grid>
                </Slide>
                {data ? (
                    <Grid
                        item
                        container
                        md={menuOpen ? 9 : 12}
                        spacing={3}
                    >
                        {cards.map((card) => (
                            <Grid
                                item
                                key={card}
                                xs={12}
                                sm={6}
                                md={menuOpen ? 4 : 3}
                            >
                                <GalleryCard
                                    loading={!loading}
                                />
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Container maxWidth="sm">
                        <Typography
                            // component="h1"
                            // variant="h2"
                            size="h2"
                            weight="Light"
                            align="center"
                            gutterBottom
                        >
                            No Data
                        </Typography>
                    </Container>
                )}
            </Grid>
        </Container>        
    </>
  );
};
