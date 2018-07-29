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
            const CIVIC_LINK = "https://civic.genome.wustl.edu/links/variants/";
            const CLINVAR_LINK = "https://www.ncbi.nlm.nih.gov/clinvar/variation/";
            const ICGC_LINK = "https://dcc.icgc.org/mutations/";

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
             * Return string showing fraction of total donors affected by the mutation
             * @param {*} variant 
             */
            function getDonorFraction(variant) {
                if (variant.affectedDonorCountTotal !== null && variant.testedDonorCount !== null) {
                    return variant.affectedDonorCountTotal + "/" + variant.testedDonorCount;
                } else {
                    return "n/a";
                }
            }

            /**
             * Return a list of transcripts
             * @param {*} transcripts 
             */
            function getTranscripts(transcripts) {
                if (transcripts.length > 0) {
                    var listOfTranscripts = '<ul>';
                    for (transcript of transcripts) {
                        if (transcript.name && transcript.id) {
                            listOfTranscripts += '<li><a href="http://feb2014.archive.ensembl.org/Homo_sapiens/Transcript/Summary?db=core;t=' + transcript.id + '" target="_blank">' + transcript.name + '</a></li>';
                        }
                    }
                    listOfTranscripts += '</ul>';
                    if (transcript == '<ul></ul>') {
                        return '';
                    }
                    return listOfTranscripts;
                } else {
                    return '';
                }
            }

            /**
             * If a value is undefined, returns empty string, else return value
             * @param {*} value 
             */
            function prettyValue(value) {
                return value == undefined || null ? '' : value;
            }

            /**
             * Creates a table of consequences for a mutation
             * @param {*} consequences 
             */
            function createConsequencesTable(consequences) {
                var headerRow = `
                    <tr>
                        <th style="border: 1px solid #000">Gene</th>
                        <th style="border: 1px solid #000">AA Change</th>
                        <th style="border: 1px solid #000">Consequence</th>
                        <th style="border: 1px solid #000">CDS Change</th> 
                        <th style="border: 1px solid #000">Functional Impact</th>
                        <th style="border: 1px solid #000">Strand</th>
                        <th style="border: 1px solid #000">Transcripts</th>
                    </tr>
                `;

                var consequenceTable = '<table>' + headerRow;

                for (consequence of consequences) {
                    var consequenceRow = '<tr>' +
                        '<td style="border: 1px solid #000">' + prettyValue(consequence.geneAffectedSymbol) + '</td>' +
                        '<td style="border: 1px solid #000">' + prettyValue(consequence.aaMutation) + '</td>' +
                        '<td style="border: 1px solid #000">' + prettyValue(consequence.type) + '</td>' +
                        '<td style="border: 1px solid #000">' + prettyValue(consequence.cdsMutation) + '</td>' +
                        '<td style="border: 1px solid #000">' + prettyValue(consequence.functionalImpact) + '</td>' +
                        '<td style="border: 1px solid #000">' + prettyValue(consequence.geneStrand) + '</td>' +
                        '<td style="border: 1px solid #000">' + getTranscripts(consequence.transcriptsAffected) + '</td>' +
                        '</tr>';
                    
                    consequenceTable += consequenceRow;
                }

                consequenceTable += '/<table>';
                return consequenceTable;
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
             * Fetch the mutations from the ICGC within a given range
             */
            function fetch() {
                var start = query.start;
                var end = query.end;
                var ref = query.ref.replace(/chr/, '');
                end = getChromosomeEnd(ref, end);

                var url = encodeURI('https://dcc.icgc.org/api/v1/mutations?filters={"mutation":{"location":{"is":["' + ref + ':' + start + '-' + end + '"]}}}&from=1&include=consequences&size=1000');
                
                return request(url, {
                    method: 'get',
                    headers: { 'X-Requested-With': null },
                    handleAs: 'json'
                }).then(function(res) {
                    array.forEach(res.hits, function(variant) {
                        featureCallback(new SimpleFeature({
                            id: variant.id,
                            data: {
                                start: variant.start - 1,
                                end: variant.end - 1,
                                name: variant.id,
                                mutation: variant.mutation,
                                reference_allele: variant.referenceGenomeAllele,
                                assembly_version: variant.assemblyVersion,
                                civic: createLinkWithId(CIVIC_LINK, variant.external_db_ids.civic),
                                clinvar: createLinkWithId(CLINVAR_LINK, variant.external_db_ids.clinvar),
                                icgc: createLinkWithId(ICGC_LINK, variant.id),
                                affected_projects: variant.affectedProjectCount,
                                affected_donors: getDonorFraction(variant),
                                type: variant.type,
                                study: prettyValue(variant.study.join()),
                                description: variant.description,
                                consequences: createConsequencesTable(variant.consequences)
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