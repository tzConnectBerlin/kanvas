import styled from "@emotion/styled";
import FlexSpacer from "../../atoms/FlexSpacer";
import Typography from "../../atoms/Typography";
import { CustomButton } from '../../atoms/Button';
import { Animated } from "react-animated-css";
import { FC, useEffect, useState } from "react";
import { Theme, Stack, Box, Container, Grid, Slide, IconButton, Button } from "@mui/material";
import { Layout, Layouts, Responsive, WidthProvider } from "react-grid-layout";
import IconExpansionTreeView from '../../molecules/TreeView/TreeView';
import { NftCard } from "../../molecules/NftCard";
import ListIcon from '@mui/icons-material/List';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export interface NftGridProps {
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

export const NftGrid: FC<NftGridProps> = ({ ...props }) => {
 
    const [menuOpen, setMenuOpen] = useState(true);

    const handleClick = () => {
        setMenuOpen(!menuOpen);
    };

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(true);
  return (
    <>    
        <Stack direction="column" spacing={5}>
            {/* Toggle options */}
            <Stack direction="row">
                <IconButton
                    onClick={handleClick}
                    aria-label="upload picture"
                    component="span"
                >
                    <ListIcon />
                </IconButton>
                
                <CustomButton style={{margin: '0 20px'}} size="large" onClick={() => setLoading(!loading)} aria-label="loading" label={`Toggle ${loading ? 'loaded' : 'loading'}`}/>
                <CustomButton size="large" onClick={() => setData(!data)} aria-label="data" label={`Toggle ${!data ? 'data' : 'no data'}`} />
                
            </Stack>
            
            {/* Gallery */}
            <Stack direction="row">
                {/* Grid Component - NFT GALLERY */}
                <Grid container spacing={2} sx={{ overflow: 'hidden'}}>
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
                                    md={menuOpen ? 6 : 4}                                     
                                    lg={menuOpen ? 4 : 3}  
                                >
                                    <NftCard
                                        loading={!loading}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    ) : ( 
                        <Grid xs={12} md={12} spacing={5}  sx={{  display: 'flex', flexDirection: 'column', alignSelf: 'center'}}>
                             <FlexSpacer minHeight={5} />
                            <Typography
                                size="h1"
                                weight="Light"
                                align="center"
                                sx={{  display: 'flex', alignSelf: 'center'}}
                                gutterBottom
                            >
                                No Data
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </Stack>        
        </Stack>
    </>
  );
};
