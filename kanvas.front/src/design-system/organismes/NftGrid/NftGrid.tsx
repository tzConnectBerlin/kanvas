import styled from "@emotion/styled";
import FlexSpacer from "../../atoms/FlexSpacer";
import Typography from "../../atoms/Typography";

import { FC, useState } from "react";
import { Stack, Grid } from "@mui/material";
import { Layouts, Responsive, WidthProvider } from "react-grid-layout";

import { NftCard } from "../../molecules/NftCard";
import { INft } from "../../../interfaces/artwork";

export interface NftGridProps {
  editable?: boolean;
  layouts?: Layouts;
  setLayouts?: Function;
  assets?: any[];
  emptyMessage?: string;
  emptyLink?: string;
  loading?: boolean;
  open?: boolean;
  nfts?: INft[];
}

const StyledGrid = styled(Grid)`
    transition: all 0.2s;
    width: 100%;
    max-width: none !important;
    flex-basis: 100% !important;
    margin: 0;
    padding: -1.5rem;
`

const StyledGridItem = styled(Grid)`
    padding: 1.5rem;
`

const cards = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export const NftGrid: FC<NftGridProps> = ({ ...props }) => {

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(true);

    return (
        <>
            {props.nfts && props.nfts.length > 0 ? (
                <StyledGrid
                    container
                    lg={props.open ? 12 : 9}
                    md={props.open ? 9 : 6}

                >
                    {props.nfts.map((nft) => (
                         <StyledGridItem item
                            lg={props.open ? 4 : 3}
                            md={props.open ? 6 : 4}
                            xs={12}
                            >
                            <NftCard
                                name={nft.name}
                                ipfsHash={nft.ipfsHash}
                                price={nft.price}
                                loading={!loading}
                            />
                        </StyledGridItem>
                    ))}
                </StyledGrid>
            ) : (
                <StyledGrid>
                    <FlexSpacer minHeight={5} />
                    <Typography
                        size="h3"
                        weight="Light"
                        align="center"
                        sx={{ display: 'flex', justifyContent: 'center'}}
                        gutterBottom
                    >
                        No Data
                    </Typography>
                </StyledGrid>
            )}
        </>
    );
};
