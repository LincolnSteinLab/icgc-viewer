---
layout: default
title: Installation
nav_order: 2
---

# Installation and Setup
The installation assumes you are working on an Ubuntu or MacOS machine.

## 0. Install dependencies
* [Yarn](https://classic.yarnpkg.com/en/docs/install/)

* [Node](https://nodejs.org/en/download/)

Note: You may find it easier to use a node versioning tool to install Node. Two popular tools are [n](https://github.com/tj/n) and [nvm](https://github.com/nvm-sh/nvm).

## 1. Install JBrowse
Clone the JBrowse repostitory. Don't switch into the directory just yet.
```bash
git clone https://github.com/GMOD/jbrowse
```

We will use the placeholder `<jbrowse-location>` to refer to where JBrowse is installed on your computer. An example would be `/Users/aduncan/Downloads/jbrowse`.

## 2. Install ICGC Plugin
Clone the ICGC plugin and then copy the icgc-viewer subfolder into the JBrowse plugins directory.
```bash
git clone https://github.com/LincolnSteinLab/icgc-viewer.git
cp -R icgc-viewer/icgc-viewer <jbrowse-location>/plugins/icgc-viewer
```

Now add the 'icgc-viewer' plugin to the array of plugins in the `<jbrowse-location>/jbrowse.conf`.
```ini
[ plugins.icgc-viewer ]
location = <jbrowse-location>/plugins/icgc-viewer
```

In the same file, add the following to use the faceted track selector.
```ini
[trackSelector]
type = Faceted
displayColumns =
  + label
  + key
  + datatype
  + donor
  + project
```

Note that this will only show preloaded tracks as well as tracks you have added using the various dialogs. It does not dynamically create tracks based on what is available from the ICGC.

## 3. Install Reference Sequence Data
Now setup the reference sequence used. ICGC requires the GRCh37 Human reference files.

Create the `data` directory in `<jbrowse-location>/data`.

```bash
cd <jbrowse-location>
mkdir data
cd data
```

Download the GRCh37 `.fa` and `.fa.fai` files online
One possible location is
* <http://bioinfo.hpc.cam.ac.uk/downloads/datasets/fasta/grch37/>

Then put the following in `<jbrowse-location>/data/tracks.conf` (note files may be named something else).

```
refSeqs=GRCh37.genome.fa.fai
  
[tracks.refseqs]
urlTemplate=GRCh37.genome.fa
```

## 4. Adding new tracks (optional)
We have some basic example tracks in the [data/tracks.conf](https://github.com/LincolnSteinLab/icgc-viewer/blob/develop/data/tracks.conf) file of the icgc-viewer repository.

You can also add new tracks by using the ICGC dialog accessible within JBrowse. [See the tracks page]({{ site.url }}{% link tracks.md %}).

## 5. Build JBrowse
Run the following commands to build JBrowse and the ICGC plugin.

**Note that ./setup.sh may print some errors about volvox, but they can be ignored. It may also take a few minutes.**
```bash
cd <jbrowse-location>
./setup.sh
yarn
```

## 5. Run JBrowse
Then run the following commands:

```bash
yarn watch
# open a new terminal tab/window
yarn start
```

JBrowse should now be running with the ICGC Plugin working! See the `yarn start` command to determine the port that the plugin is using.