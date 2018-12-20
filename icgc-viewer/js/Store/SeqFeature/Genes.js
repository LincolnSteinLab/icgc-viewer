define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    array,
    request,
    SeqFeatureStore,
    SimpleFeature
) {
    return declare(SeqFeatureStore, {

        constructor: function(args) {
            // ID of the donor
            this.donor = args.donor;

            // Filters to apply to gene query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : {};

            // Maximum gene count to retrieve from ICGC
            this.maxGeneCount = args.maxGeneCount !== undefined ? parseInt(args.maxGeneCount) : 1000;
        },

        /**
         * Creates a link to a given ID
         * @param {string} link Base URL for link
         * @param {string} id ID to apped to base URL
         */
        createLinkWithId: function(link, id) {
            return id ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
        },

        /**
         * Given an array of IDs and a link, creates a comma-separated list of links to the ids
         * @param {string} link Base URL for link
         * @param {array} ids IDs to apped to base URL
         */
        createLinksWithId: function(link, ids) {
            var linkList = "";
            if (ids) {
                ids.forEach((id) => {
                    linkList += this.createLinkWithId(link, id);
                });
                return linkList;
            } else {
                return "n/a";
            }
        },

        /**
         * Returns the end value to be used for querying ICGC (GrCh37)
         * TODO: This is not ideal, and alternative options should be investigated
         * @param {string} chr Chromosome number (ex. 1)
         * @param {integer} end End location of JBrowse view
         */
        getChromosomeEnd: function getChromosomeEnd(chr, end) {
            var chromosomeSizes = {
                '1': 249250621,
                '2': 243199373,
                '3': 198022430,
                '4': 191154276,
                '5': 180915260,
                '6': 171115067,
                '7': 159138663,
                '8': 146364022,
                '9': 141213431,
                '10': 135534747,
                '11': 135006516,
                '12': 133851895,
                '13': 115169878,
                '14': 107349540,
                '15': 102531392,
                '16': 90354753,
                '17': 81195210,
                '18': 78077248,
                '19': 59128983,
                '20': 63025520,
                '21': 48129895,
                '22': 51304566,
                'x': 155270560,
                'y': 59373566
            };

            if (end > chromosomeSizes[chr]) {
                return chromosomeSizes[chr];
            } else {
                return end;
            }
        },

        /**
         * Creates the filter string based on the input to the track
         * @param {string} ref Chromosome number (ex. 1)
         * @param {integer} start Start location of JBrowse view
         * @param {integer} end End location of JBrowse view
         */
        getFilterQuery: function(ref, start, end) {
            var thisB = this;

            // If empty need to create skeleton
            if (Object.keys(thisB.filters).length === 0 || thisB.filters.gene == undefined) {
                thisB.filters.gene = {};
            }

            thisB.filters.gene.location = { "is": [ ref + ':' + start + '-' + end ]};
            return JSON.stringify(thisB.filters);
        },

        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Validate user provided attributes
            if (Number.isNaN(this.maxGeneCount) || !Number.isInteger(this.maxGeneCount) || (Number.isInteger(this.maxGeneCount) && this.maxGeneCount < 0)) {
                errorCallback('Invalid maxGeneCount provided. Must be a positive integer. User provided \"' + this.maxGeneCount + '\"');
            }

            // Collection of remote link base structures
            const ENSEMBL_LINK = "http://feb2014.archive.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=";
            const ICGC_LINK = "https://dcc.icgc.org/genes/";
            const ENTREZ_LINK = "http://www.ncbi.nlm.nih.gov/gene/";
            const HGNC_LINK = "http://www.genenames.org/data/hgnc_data.php?hgnc_id=";
            const OMIM_LINK = "http://omim.org/entry/";
            const UNIPROTKB_SWISSPROT_LINK = "http://www.uniprot.org/uniprot/";
            const COSMIC_LINK = "http://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=";

            // Setup query parameters
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            // Alter URL if looking at a donor
            var searchBaseUrl = 'https://dcc.icgc.org/api/v1';
            if (thisB.donor) {
                searchBaseUrl = searchBaseUrl + '/donors/' + thisB.donor;
            }

            // Retrieve all mutations in the given chromosome range (limit to 1000)
            var url = encodeURI(searchBaseUrl +  '/genes?filters=' + thisB.getFilterQuery(ref, start, end) + '&from=1&size=' + this.maxGeneCount + '&include=externalDbIds');
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(res) {
                array.forEach(res.hits, function(gene) {
                    featureCallback(new SimpleFeature({
                        id: gene.id,
                        data: {
                            'start': gene.start - 1,
                            'end': gene.end - 1,
                            'strand': gene.strand,
                            'Gene Name': gene.name,
                            'Symbol': gene.symbol,
                            'ICGC': thisB.createLinkWithId(ICGC_LINK, gene.id),
                            'Ensembl (release 75)': thisB.createLinkWithId(ENSEMBL_LINK, gene.id),
                            'Entrez Gene': thisB.createLinksWithId(ENTREZ_LINK, gene.externalDbIds.entrez_gene),
                            'HGNC Gene': thisB.createLinksWithId(HGNC_LINK, gene.externalDbIds.hgnc),
                            'OMIM': thisB.createLinksWithId(OMIM_LINK, gene.externalDbIds.omim_gene),
                            'UniProtKB/Swiss-Prot': thisB.createLinksWithId(UNIPROTKB_SWISSPROT_LINK, gene.externalDbIds.uniprotkb_swissprot),
                            'COSMIC': thisB.createLinkWithId(COSMIC_LINK, gene.symbol),
                            'Gene Description': gene.description,
                            'type': (gene.type).replace(/_/g, ' ')
                        }
                    }));
                });

                finishCallback();
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting ICGC Portal');
            });
        }
    });
});