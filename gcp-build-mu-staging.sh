#!/bin/bash

# # store-backend
# docker build -f store-api-server/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-backend .
# docker push europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-backend

# # store-frontend
# docker build -f store-frontend/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-frontend .
# docker push europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-frontend

# # admin-backend
# docker build -f admin-api-server/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-admin-backend .
# docker push europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-admin-backend

# admin-frontend
docker build -f admin-front/Dockerfile --platform linux/amd64 \
             -t europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-admin-frontend \
             --build-arg REACT_APP_STORE_API_URL=https://mu-staging.tzconnect.berlin/api \
             --build-arg REACT_APP_API_SERVER_BASE_URL=https://mu-staging-admin.tzconnect.berlin/api \
             --build-arg REACT_APP_STORE_BASE_URL=https://mu-staging.tzconnect.berlin .
docker push europe-west1-docker.pkg.dev/tz-mu-staging/mu-staging/mu-staging-admin-frontend
