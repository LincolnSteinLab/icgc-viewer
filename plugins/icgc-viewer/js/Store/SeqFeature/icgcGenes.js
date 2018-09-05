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
            this.filters = args.filters !== undefined ? args.filters : {};
        },

        /**
         * Creates a link to a given ID
         * @param {*} link
         * @param {*} id
         */
        createLinkWithId: function(link, id) {
            if (id) {
                return "<a href='" + link + id + "' target='_blank'>" + id + "</a>";
            } else {
                return "n/a";
            }
        },

        /**
         * Given an array of ids and a link, creates a comma-separated list of links to the ids
         * @param {*} link 
         * @param {*} ids 
         */
        createLinksWithId: function(link, ids) {
            var linkList = "";
            if (ids) {
                ids.forEach((element) => {
                    linkList += this.createLinkWithId(link, element);
                });
                return linkList;
            } else {
                return "n/a";
            }
        },

        /**
         * Returns the end value to be used for querying ICGC
         * @param {*} chr 
         * @param {*} end 
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
         * @param {*} ref 
         * @param {*} start 
         * @param {*} end
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
            const ENSEMBL_LINK = "http://feb2014.archive.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=";
            const ICGC_LINK = "https://dcc.icgc.org/genes/";
            const ENTREZ_LINK = "http://www.ncbi.nlm.nih.gov/gene/";
            const HGNC_LINK = "http://www.genenames.org/data/hgnc_data.php?hgnc_id=";
            const OMIM_LINK = "http://omim.org/entry/";
            const UNIPROTKB_SWISSPROT_LINK = "http://www.uniprot.org/uniprot/";
            const COSMIC_LINK = "http://cancer.sanger.ac.uk/cosmic/gene/analysis?ln=";

            /**
             * Fetch the genes from the ICGC within a given range
             */
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            var url = encodeURI('https://dcc.icgc.org/api/v1/genes?filters=' + thisB.getFilterQuery(ref, start, end) + '&from=1&size=1000&include=externalDbIds');
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(res) {
                array.forEach(res.hits, function(gene) {
                    featureCallback(new SimpleFeature({
                        id: gene.id,
                        data: {
                            start: gene.start - 1,
                            end: gene.end - 1,
                            strand: gene.strand,
                            chromosome: gene.chromosome,
                            name: gene.name,
                            symbol: gene.symbol,
                            icgc: thisB.createLinkWithId(ICGC_LINK, gene.id),
                            ensembl: thisB.createLinkWithId(ENSEMBL_LINK, gene.id),
                            entrez: thisB.createLinksWithId(ENTREZ_LINK, gene.externalDbIds.entrez_gene),
                            hgnc: thisB.createLinksWithId(HGNC_LINK, gene.externalDbIds.hgnc),
                            entrez: thisB.createLinksWithId(OMIM_LINK, gene.externalDbIds.omim_gene),
                            uniprotkb_swissprot: thisB.createLinksWithId(UNIPROTKB_SWISSPROT_LINK, gene.externalDbIds.uniprotkb_swissprot),
                            cosmic: thisB.createLinkWithId(COSMIC_LINK, gene.symbol),
                            description: gene.description,
                            type: gene.type
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