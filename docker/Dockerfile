FROM node:latest

LABEL maintainer="gregory.hogue@oicr.on.ca"

ARG plugin_version=develop

ENV JBROWSE_VERSION 1.16.11
ENV PLUGIN_VERSION=$plugin_version

# Install dependencies
RUN apt-get -qq update --fix-missing
RUN apt-get --no-install-recommends -y install git build-essential zlib1g-dev libxml2-dev libexpat-dev postgresql-client libpq-dev ca-certificates curl

# Download JBrowse
RUN mkdir -p /jbrowse/ && \
    git clone --recursive https://github.com/gmod/jbrowse /jbrowse/ && \
    cd /jbrowse/ && \
    git checkout ${JBROWSE_VERSION}-release

WORKDIR /jbrowse/

# Download ICGC Viewer
RUN git clone https://github.com/LincolnSteinLab/icgc-viewer /icgc-viewer/ && \
    cd /icgc-viewer/ && \
    git checkout ${PLUGIN_VERSION} && \
    cp -r icgc-viewer /jbrowse/plugins/icgc-viewer && \
    cat ./data/jbrowse.conf > /jbrowse/jbrowse.conf

# Setup JBrowse
RUN ./setup.sh

# Expose port 3000
EXPOSE 3000
