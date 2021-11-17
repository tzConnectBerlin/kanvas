import {
  CardActionArea,
  CardActions,
  Grid,
  IconButton,
  Skeleton,
  Stack,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "../../atoms/Typography";

import { useHistory } from "react-router-dom";

import styled from  "@emotion/styled";
import { Theme } from '@mui/material';


export interface NftCardProps {
  loading?: boolean;
  id?: string;
  name?: string;
  price?: number;
  height?: number;
  ipfsHash?: string;
  dataUri?: string;
}

const StyledBioWrapper = styled.div<{theme?: Theme}>`
  color: ${props => props.color? props.color : props.theme.palette.text.primary ?? 'black'} !important;
`

export const NftCard: React.FC<NftCardProps> = ({ loading, ...props }) => {

  const history = useHistory()

  const handleRedirect = (path: string) => {
    history.push(path)
  }

  return (
      !loading ? (
        <Card
          sx={{
            borderRadius: 0,
            height: props.height,
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <CardActionArea onClick={() => handleRedirect(`/product/${props.id}`)} sx={{width: 'auto'}}>
            <CardMedia
              component="img"
              image={props.dataUri}
              alt="random"
            />
            <CardContent
              sx={{
                flexGrow: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "absolute",
                bottom: "0",
                right: "0",
                left: "0",
                backgroundColor: "rgba( 0, 0, 0, 0.35)",
                backdropFilter:
                  "blur(10px) saturate(100%) contrast(45%) brightness(130%)",
              }}
            >
              <StyledBioWrapper style={{ display: "block" }}>
                <Typography weight="SemiBold" size="h4"
                color="#FFF"
                >
                  {props.name}
                </Typography>
                <Typography weight="Light" size="body" color="#FFF">
                  Artist name
                </Typography>
                <Typography weight="Light" size="body" color="#FFF">
                  Remaining time
                </Typography>
              </StyledBioWrapper>

              <CardActions disableSpacing>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <Typography weight="SemiBold" size="h3" color="#FFF" > {props.price ? props.price : '- ' }tz </Typography>
                </div>
              </CardActions>

            </CardContent>
          </CardActionArea>
        </Card>
      ) : (
        <Stack spacing={1}>
          <Skeleton variant="rectangular" width={"100%"} height={302} />
        </Stack>
      )
  );
};
