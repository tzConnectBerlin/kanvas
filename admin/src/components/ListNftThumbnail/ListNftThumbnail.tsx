import { Grid } from "@mui/material"
import { makeStyles } from '@material-ui/core/styles';
import NftThumbnail from "../NftThumbnail";
import { Nft } from "../../type";
import { FC, useState } from "react";

const useStyles = makeStyles({
    gridContainer: {
        padding: '1em'
    }
})

interface ListNftThumbnailPropd {
    nfts: Nft[];
}


export const ListNftThumbnail: FC<ListNftThumbnailPropd> = ({ ...props }) => {
    const classes = useStyles()
    const [loading, setLoading] = useState(false)

    return (
        <Grid container spacing={3} className={classes.gridContainer}>
            {
                loading ?
                    [...Array(12)].map((nft: any, index: number) =>
                        <Grid item xs={4}>
                            <NftThumbnail name={`Nft - ${index}`} image={'nft.image'} description={''} price={0} state='published' />
                        </Grid>
                    )
                    :
                    props.nfts.map((nft: any, index: number) =>
                        <Grid item xs={4}>
                            <NftThumbnail name={nft.name} image={nft.displayUri} description={''} price={nft.price} state='published' />
                        </Grid>
                    )
            }
        </Grid>
    )
}