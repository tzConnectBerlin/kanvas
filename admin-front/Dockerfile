FROM node:18-alpine as builder

WORKDIR /app

COPY admin-front/ .

RUN yarn install

ARG REACT_APP_STORE_BASE_URL
ARG REACT_APP_STORE_API_URL
ARG REACT_APP_API_SERVER_BASE_URL

ENV REACT_APP_STORE_BASE_URL=$REACT_APP_STORE_BASE_URL
ENV REACT_APP_API_SERVER_BASE_URL=$REACT_APP_API_SERVER_BASE_URL
ENV REACT_APP_STORE_API_URL=$REACT_APP_STORE_API_URL

# Build the project and copy the files
RUN yarn build

FROM nginx:alpine

## Remove default nginx index page
RUN rm -rf /usr/share/nginx/html/*

# Copy from the stage 1
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]