#!/bin/bash

docker build -f store-api-server/Dockerfile --platform linux/amd64 -t europe-west1-docker.pkg.dev/sowvital/sowvital/sowvital-store-backend .
docker push europe-west1-docker.pkg.dev/sowvital/sowvital/sowvital-store-backend
