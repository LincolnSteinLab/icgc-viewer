# icgc-viewer
A plugin for [JBrowse](https://jbrowse.org/) for viewing ICGC data. For any bugs, issues, or feature recommendations please create an issue through GitHub.

# Setup
## 1. Install JBrowse
Quick setup of JBrowse - https://github.com/GMOD/jbrowse/#install-jbrowse-from-github-for-developers

## 2. Install Plugin
See [JBrowse - Installing Plugins](https://jbrowse.org/docs/plugins.html) for a general approach to installing plugins.

For installing icgc-viewer plugin:
1) Copy the icgc-viewer folder into the JBrowse `plugins` directory.
2) Add 'icgc-viewer' to the array of plugins in the `jbrowse_conf.json`.

## 3. Install RefSeq Data
Now setup the Reference sequence used. ICGC requires the GRCh37 Human reference files, which can be found at http://ftp.ensembl.org/pub/release-75/fasta/homo_sapiens/dna/. You'll want to download the files of the form `Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz`.

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
We have some basic example tracks in `data/tracks.conf`. You can also add new tracks by using the ICGC Dialog accessible within JBrowse.

## 5. Run JBrowse
You'll have to run the following commands:

```
./setup.sh
utils/jb_run.js -p 3000
```

JBrowse should now be running with the ICGC Plugin working!

# Available Store SeqFeature
## icgcGenes
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
filters: {"gene":{"type":{"is":["protein_coding"]}}}
```

Example Track:
```
[tracks.ICGC_Genes]
storeClass=icgc-viewer/Store/SeqFeature/icgcGenes
type=JBrowse/View/Track/CanvasVariants
key=ICGC_Genes
```

### Extra notes
You can also set the 'maxGeneCount' attribute (defaults to 1000). This is the theoretical maximum number of genes displayed at a time in JBrowse. The smaller the value, the faster JBrowse will be.

## icgcSimpleSomaticMutations
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
filters: {"mutation":{"functionalImpact":{"is":["High"]}}}
```

Example Track:
```
[tracks.ICGC_Mutations]
storeClass=icgc-viewer/Store/SeqFeature/icgcSimpleSomaticMutations
type=JBrowse/View/Track/CanvasVariants
key=ICGC_Mutations
```

### Extra notes
You can also set the 'maxMutationCount' attribute (defaults to 500). This is the theoretical maximum number of mutations displayed at a time in JBrowse. The smaller the value, the faster JBrowse will be.

## icgcCNSM
A simple view of all of the CNSM for a given donor. A donor ID (donor field) must be specified in the track config file.

Example Track:
```
[tracks.CNSM_D0229446]
storeClass=icgc-viewer/Store/SeqFeature/icgcCNSM
type=JBrowse/View/Track/Wiggle/XYPlot
donor=DO229446
max_score=1
min_score=-1
bicolor_pivot=0
```

# Menu option for searching ICGC
In the tools menu there is an option to search ICGC. This will bring up a dialog similar to the [advanced search page](https://dcc.icgc.org/search) on the ICGC portal. Here you can apply facets related to donor, gene and mutation. This will create a filtered list of matching donors, genes and mutations.

Donors Tab:
* View donors that match the selected facets
* For each donor
    * Add track for affected genes
    * Add track for SSMs
    * Add track for CNSMs
    * More tracks to come...

Genes Tab:
* View genes that match the selected facets
* Create a track of all matching genes

Mutations Tab:
* View mutations that match the selected facets
* Create a track of all matching SSMs

# Miscellaneous
This is a catch all section.