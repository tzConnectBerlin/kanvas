#!/bin/bash

# store-backend
docker build -f store-api-server/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-backend .
docker push europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-backend

# # store-frontend
# docker build -f store-frontend/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-frontend .
# docker push europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-frontend

# admin-backend
docker build -f admin-api-server/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-admin-backend .
docker push europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-admin-backend

# # admin-frontend
# docker build -f admin-front/Dockerfile --platform linux/amd64 \
#              -t europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-admin-frontend \
#              --build-arg REACT_APP_API_SERVER_BASE_URL=https://sowvital-admin-staging.tzconnect.berlin/api \
#              --build-arg REACT_APP_STORE_BASE_URL=https://sowvital-staging.tzconnect.berlin .
# docker push europe-west1-docker.pkg.dev/tz-sowvital-staging/sowvital-staging/sowvital-staging-admin-frontend
