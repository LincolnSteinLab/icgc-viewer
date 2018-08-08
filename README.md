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

## icgcSimpleSomaticMutations
A simple view of all the simple somatic mutations across all donors in the ICGC portal. If you specify a donor ID in the track config file, only mutations related to the given donor will be shown (if the donor exists).

# Menu option for searching ICGC
In the tools menu there is an option to search ICGC for a donor. This will open a popup where the user can search for a donor in the ICGC portal by donor ID (for now). If the donor exists, then for each type of data available that can be viewed in JBrowse, a button will appear. Clicking one of these buttons will add the corresponding track for that donor. Currently only SSM are functional.