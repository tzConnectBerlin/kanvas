import {
  CardActionArea,
  CardActions,
  IconButton,
  Skeleton,
  Stack,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "../../atoms/Typography";
import styled from  "@emotion/styled";
import { Theme } from '@mui/material';

export interface NftCardProps {
  loading?: boolean;
  title?: string;
  height?: string;
}
const StyledBioWrapper = styled.div<{theme?: Theme}>`
color: ${props => props.color? props.color : props.theme.palette.text.primary ?? 'black'} !important;
`
export const NftCard: React.FC<NftCardProps> = ({ loading, height }) => {
  return (
    <>
      {loading ? (
        <Card
          sx={{
            height: height,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <CardActionArea href="/product">
            <CardMedia
              component="img"
              image="https://uploads-ssl.webflow.com/60098420fcf354eb258f25c5/60098420fcf3542cf38f287b_Illustrations%202019-37.jpg"
              alt="random"
            />
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "absolute",
                bottom: "-7px",
                width: "-webkit-fill-available",
                backgroundColor: "rgba( 0, 0, 0, 0.35)",
                backdropFilter:
                  "blur(10px) saturate(100%) contrast(45%) brightness(130%)",
              }}
            >
              <StyledBioWrapper style={{ display: "block" }}>
                <Typography weight="SemiBold" size="h4"
                  color="#FFF"
                >
                  NFT name
                </Typography>
                <Typography weight="Light" size="body" color="#FFF">
                  Artist name</Typography>
                <Typography weight="Light" size="body" color="#FFF">
                  Remaining time
                </Typography>
              </StyledBioWrapper>
              <CardActions disableSpacing sx={{marginTop: 'auto', marginBottom: '-10px'}}>
                   <Typography weight="SemiBold" sx={{alignSelf: 'end',  pb: '0'}} size="h3" color="#FFF">
                    28.3tz
                  </Typography>
               </CardActions>
            </CardContent>
          </CardActionArea>
        </Card>
      ) : (
        <Stack spacing={1}>
          <Skeleton variant="rectangular" width={"100%"} height={302} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" />
        </Stack>
      )}
    </>
  );
};
