define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/request',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    array,
    lang,
    request,
    SeqFeatureStore,
    SimpleFeature
) {
    return declare(SeqFeatureStore, {
        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            const ENSEMBL_LINK = "http://feb2014.archive.ensembl.org/Homo_sapiens/Gene/Summary?db=core;g=";

            /**
             * If a value is undefined, returns empty string, else return value
             * @param {*} value 
             */
            function prettyValue(value) {
                return value == undefined || null ? '' : value;
            }

            /**
             * Creates a link to a given ID
             * @param {*} link
             * @param {*} id
             */
            function createLinkWithId(link, id) {
                if (id !== null) {
                    return "<a href='" + link + id + "' target='_blank'>" + id + "</a>";
                } else {
                    return "n/a";
                }
            }

            /**
             * Returns the end value to be used for querying ICGC
             * @param {*} chr 
             * @param {*} end 
             */
            function getChromosomeEnd(chr, end) {
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
            }

            /**
             * Fetch the genes from the ICGC within a given range
             */
            function fetch() {
                var start = query.start;
                var end = query.end;
                var ref = query.ref.replace(/chr/, '');
                end = getChromosomeEnd(ref, end);

                var url = encodeURI('https://dcc.icgc.org/api/v1/genes?filters={"gene":{"location":{"is":["' + ref + ':' + start + '-' + end + '"]}}}&from=1&size=1000');
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
                                id: createLinkWithId(ENSEMBL_LINK, gene.id), 
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
            fetch();
        }
    });
});