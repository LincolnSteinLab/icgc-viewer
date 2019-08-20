# Running JBrowse with ICGC Plugin in Docker
This will get JBrowse with the ICGC Viewer Plugin running with Express on port 3000.

Based on [enuggetry/docker-jbrowse](https://github.com/enuggetry/docker-jbrowse)

## Build and Run from Dockerfile
### Setup data
*Important*: Place your track data in `./data`. This maps to `/jbrowse/data` in the container, which is where JBrowse stores reference data and track information.

### Build the docker image
`docker build . -t jbrowse-with-icgc`

### Run the docker image
`docker run -p 3000:3000 -v {pwd}/data:/jbrowse/data jbrowse-with-icgc utils/jb_run.js -p 3000`

Note: You can run in the background using the detach mode (-d)

`docker run -d -p 3000:3000 -v {pwd}/data:/jbrowse/data jbrowse-with-icgc utils/jb_run.js -p 3000`

## Build and Run from Docker Compose
You can also use Docker Compose to build the image. Ensure you are working in the same directory as the `docker-compose.yml`.

### Build docker-compose
`docker-compose build`

### Run the docker-compose
`docker-compose up`

Note: You can run in the background using the detach mode (-d)

`docker-compose up -d`

## Load refseq and tracks
If you already have your tracks.conf and seq/, etc., you can simply put these files into your `./data` directory.

As an example, we will load Chr1 (GRCh37) as a reference sequence. Unfortunately you need JBrowse to prepare refseq, so you can either go into the docker container and run the following or clone JBrowse on your host system, run `./setup.sh` and then run the following on the host.

Note that GRCh37 is used for ICGC.

```
# Download a FASTA file
wget http://ftp.ensembl.org/pub/release-75/fasta/homo_sapiens/dna/Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz

# Prepare refseqs
jbrowse/bin/prepare-refseqs.pl --fasta ./data/Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz
```

Now go to `localhost:3000` and you should see JBrowse with your refdata and tracks!

### Enter the Docker Container

You can enter the container by doing the following:

```
# Get container ID
docker ps

# Enter container
docker exec -it <container-id> /bin/bash
```