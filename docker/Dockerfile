FROM node:latest

LABEL maintainer="andrew.duncan@oicr.on.ca"

ENV JBROWSE_VERSION 1.16.6

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
RUN git clone https://github.com/agduncan94/icgc-viewer /icgc-viewer/ && \
    cd /icgc-viewer/ && \
    git checkout 0.1.6 && \
    cp -r icgc-viewer /jbrowse/plugins/icgc-viewer && \
    cat ./data/jbrowse.conf > /jbrowse/jbrowse.conf

# Setup JBrowse
RUN ./setup.sh && \
    ./bin/cpanm --force JSON Hash::Merge PerlIO::gzip Devel::Size \
    Heap::Simple Heap::Simple::XS List::MoreUtils Exception::Class Test::Warn Bio::Perl \
    Bio::DB::SeqFeature::Store File::Next Bio::DB::Das::Chado && \
    rm -rf /root/.cpan/


# Expose port 3000
EXPOSE 3000