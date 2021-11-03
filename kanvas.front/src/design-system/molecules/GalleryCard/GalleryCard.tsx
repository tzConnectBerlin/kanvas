import {
  CardActionArea,
  CardActions,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import FavoriteIcon from "@mui/icons-material/Favorite";

export interface GalleryCardProps {
  loading?: boolean;
  title?: string;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ loading }) => {
  return (
    <>
      {loading ? (
        <Card
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <CardActionArea href="/product">
            <CardMedia
              component="img"
              image="https://source.unsplash.com/random"
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
                width: "90%",
                backgroundColor: " rgba( 255, 255, 255, 0.005)",
                backdropFilter:
                  "blur(10px) saturate(100%) contrast(45%) brightness(130%)",
              }}
            >
              <div style={{ display: "block" }}>
                <Typography gutterBottom variant="h5" component="h4">
                  NFTname
                </Typography>
                <Typography variant="h6">artist name</Typography>
              </div>
              <CardActions disableSpacing>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <IconButton aria-label="add to favorites">
                    <FavoriteIcon />
                  </IconButton>
                  <Typography component="span">28.300 tz</Typography>
                </div>
              </CardActions>
            </CardContent>
          </CardActionArea>
        </Card>
      ) : (
        <Stack spacing={1}>
          <Skeleton variant="rectangular" width={"100%"} height={118} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" />
        </Stack>
      )}
    </>
  );
};
