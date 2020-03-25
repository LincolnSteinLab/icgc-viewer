---
layout: default
title: Installation
nav_order: 2
---

# Installation and Setup
## 1. Install JBrowse
Follow JBrowse readme for [quick setup.](https://github.com/GMOD/jbrowse/#install-jbrowse-from-github-for-developers)

## 2. Install Plugin
See [JBrowse - Installing Plugins](https://jbrowse.org/docs/plugins.html) for a general approach to installing plugins.

For installing icgc-viewer plugin:
1. Copy the icgc-viewer folder into the JBrowse `plugins` directory.
2. Add 'icgc-viewer' to the array of plugins in the `jbrowse_conf.json`.

## 3. Install Reference Sequence Data
Now setup the reference sequence used. ICGC requires the GRCh37 Human reference files.

Download the GRCh37 `.fa` and `.fa.fai` files online (ex. http://bioinfo.hpc.cam.ac.uk/downloads/datasets/fasta/grch37/). Then put the following in `./data/tracks.conf` (note files may be named something else).

```
refSeqs=GRCh37.genome.fa.fai
  
[tracks.refseqs]
urlTemplate=GRCh37.genome.fa
```

## 4. Adding new tracks
We have some basic example tracks in `data/tracks.conf`. You can also add new tracks by using the ICGC Dialog accessible within JBrowse. These are present in the menu under `ICGC`. See [Dynamic Track Generation](#dynamic-track-generation) for more details.

## 5. Run JBrowse
You'll have to run the following commands:

```
./setup.sh
utils/jb_run.js -p 3000
```

JBrowse should now be running with the ICGC Plugin working!

# JBrowse configuration
## Faceted Track Selector
Add the following to your jbrowse.conf to use the faceted track selector.
```
[trackSelector]
type = Faceted
displayColumns =
  + label
  + key
  + datatype
  + donor
  + project
```