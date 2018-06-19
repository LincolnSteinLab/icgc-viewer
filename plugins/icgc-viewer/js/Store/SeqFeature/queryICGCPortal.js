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

            function createLinkWithId(link, id) {
                if (id !== null) {
                    return "<a href='" + link + id + "' target='_blank'>" + id + "</a>";
                } else {
                    return "n/a";
                }
            }

            function getDonorFraction(variant) {
                if (variant.affectedDonorCountTotal !== null && variant.testedDonorCount !== null) {
                    return variant.affectedDonorCountTotal + "/" + variant.testedDonorCount;
                } else {
                    return "n/a";
                }
            }

            function getTranscripts(transcripts) {
                var listOfTranscripts = '<ul>';
                for (transcript of transcripts) {
                    listOfTranscripts += '<li>' + transcript.name + '</li>';
                }
                listOfTranscripts += '</ul>';
                return listOfTranscripts;
            }

            function prettyValue(value) {
                if (value == undefined) {
                    return '';
                } else {
                    return value;
                }
            }

            function createConsequencesTable(consequences) {
                var headerRow = `
                    <tr>
                        <th>Gene</th>
                        <th>AA Change</th>
                        <th>Consequence</th>
                        <th>CDS Change</th> 
                        <th>Functional Impact</th>
                        <th>Strand</th>
                        <th>Transcripts</th>
                    </tr>
                `;

                var consequenceTable = '<table>' + headerRow;

                for (consequence of consequences) {
                    var consequenceRow = '<tr>' +
                        '<td>' + prettyValue(consequence.geneAffectedSymbol) + '</td>' +
                        '<td>' + prettyValue(consequence.aaMutation) + '</td>' +
                        '<td>' + prettyValue(consequence.type) + '</td>' +
                        '<td>' + prettyValue(consequence.cdsMutation) + '</td>' +
                        '<td>' + prettyValue(consequence.functionalImpact) + '</td>' +
                        '<td>' + prettyValue(consequence.geneStrand) + '</td>' +
                        '<td>' + getTranscripts(consequence.transcriptsAffected) + '</td>' +
                        '</tr>';
                    
                    consequenceTable += consequenceRow;
                }

                consequenceTable += '/<table>';
                return consequenceTable;
            }

            function fetch() {
                var start = query.start;
                var end = query.end;
                var ref = query.ref.replace(/chr/, '');

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
                                start: variant.start,
                                end: +variant.end,
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
                                study: variant.study.join(),
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