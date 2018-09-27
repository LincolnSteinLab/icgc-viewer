# icgc-viewer
A plugin for JBrowse for viewing ICGC data

# Setup
See plugins/data/trackList.json and plugins/data/tracks.conf for the track files used to setup this plugin.

Remember to add the plugin to your configuration file.

ICGC requires the GRCH37 Human reference files, which can be found at http://ftp.ensembl.org/pub/release-75/fasta/homo_sapiens/dna/.

You'll need to download the files and then add them to the refseq.
Ex. Chromosome 1
1. Download Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz from the above site.
2. Setup refeq with bin/prepare-refseqs.pl --fasta Homo_sapiens.GRCh37.75.dna.chromosome.1.fa.gz

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