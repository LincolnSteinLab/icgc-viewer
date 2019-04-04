# ICGC JBrowse Plugin - Faceted Search and New Store Classes
A plugin for [JBrowse](https://jbrowse.org/) for viewing ICGC data. For any bugs, issues, or feature recommendations please create an issue through GitHub.

# Installation and Setup
## 1. Install JBrowse
Quick setup of JBrowse - https://github.com/GMOD/jbrowse/#install-jbrowse-from-github-for-developers

## 2. Install Plugin
See [JBrowse - Installing Plugins](https://jbrowse.org/docs/plugins.html) for a general approach to installing plugins.

For installing icgc-viewer plugin:
1) Copy the icgc-viewer folder into the JBrowse `plugins` directory.
2) Add 'icgc-viewer' to the array of plugins in the `jbrowse_conf.json`.

## 3. Install Reference Sequence Data
Now setup the reference sequence used. ICGC requires the GRCh37 Human reference files, which can be found at http://ftp.ensembl.org/pub/release-75/fasta/homo_sapiens/dna/. You'll want to download the files of the form `Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz`.

Then you can use the `bin/prepare-refeqs.pl` command to generate the RefSeq information.

Below is an example of these two steps for Chr1.

Ex. Chromosome 1
1. Download Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz from the above site.
```
wget http://ftp.ensembl.org/pub/release-75/fasta/homo_sapiens/dna/Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz
```
2. Setup refeq with the following command
```
bin/prepare-refseqs.pl --fasta Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz
```
Note that you can specify multiple fast in one command by doing `--fasta fasta1.fa.gz --fasta fasta2.fa.gz ...`

## 4. Adding new tracks
We have some basic example tracks in `data/tracks.conf`. You can also add new tracks by using the ICGC Dialog accessible within JBrowse.These are present in the menu under `ICGC`.

### A. Explore ICGC
This dialog is similar to the Exploration section of the ICGC data portal. As you apply facets on the left-hand side, updated results will be shown on the right side. You can create donor specific SSM and Gene tracks, along with ICGC-wide SSM and Gene tracks.

### B. View ICGC Projects
This dialog shows the projects present on the ICGC Data Portal. You can add SSM and Gene tracks for each project.

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

# Available Store SeqFeature
## Genes
A simple view of all genes returned by the ICGC portal for a given range of the chromosome you are looking at.

If you specify a donor ID (donor field) in the track config file, only genes related to that donor will appear.
```
donor: DO229446
```

You can also use the filters field to pass filters to be applied to the track. The expected input is a filter object like the following:

```
{
    "gene" : {
        "type": {
            "is": [
                "protein_coding"
            ]
        }
    }
}
```

To put it in the track config file you may want to minimize it as such:
```
filters={"gene":{"type":{"is":["protein_coding"]}}}
```

Example Track:
```
[tracks.ICGC_Genes]
storeClass=icgc-viewer/Store/SeqFeature/Genes
type=JBrowse/View/Track/CanvasVariants
key=ICGC_Genes
unsafePopup=true
```

### Extra notes
You can also set the 'size' attribute (defaults to 1000). This is the theoretical maximum number of genes displayed at a time in JBrowse. The smaller the value, the faster JBrowse will be.

## SimpleSomaticMutations
A simple view of all the simple somatic mutations across all donors in the ICGC portal. 

If you specify a donor ID (donor field) in the track config file, only mutations related to the given donor will be shown (if the donor exists).
```
donor: DO229446
```

You can also use the filters field to pass filters to be applied to the track. The expected input is a filter object like the following:

```
{
    "mutation" : {
        "functionalImpact": {
            "is": [
                "High"
            ]
        }
    }
}
```

To put it in the track config file you may want to minimize it as such:
```
filters={"mutation":{"functionalImpact":{"is":["High"]}}}
```

Example Track:
```
[tracks.ICGC_Mutations]
storeClass=icgc-viewer/Store/SeqFeature/SimpleSomaticMutations
type=JBrowse/View/Track/CanvasVariants
key=ICGC_Mutations
unsafePopup=true
fmtDetailValue_projects=function(value) { return "<div id='projects-icgc-" + value +  "'>Loading...</div>";}
```

### Extra notes
You can also set the 'size' attribute (defaults to 500). This is the theoretical maximum number of mutations displayed at a time in JBrowse. The smaller the value, the faster JBrowse will be.

# Menu option for searching ICGC
In the tools menu there is an option to search ICGC. This will bring up a dialog similar to the [advanced search page](https://dcc.icgc.org/search) on the ICGC portal. Here you can apply facets related to donor, gene and mutation. This will create a filtered list of matching donors, genes and mutations.

Donors Tab:
* View donors that match the selected facets
* For each donor
    * Add track for affected genes
    * Add track for SSMs

Genes Tab:
* View genes that match the selected facets
* Create a track of all matching genes

Mutations Tab:
* View mutations that match the selected facets
* Create a track of all matching SSMs

There is also an options to search ICGC by projects. This allows you to see all of the associated SSMs and Genes per project in one track.

# Miscellaneous
## Advanced Usage of Tracks
You do not need to add tracks directly from the ICGC Dialog. You can also define them in the `tracks.conf` file.

See `data/advanced-tracks.conf` for some more complex usages, including filters.