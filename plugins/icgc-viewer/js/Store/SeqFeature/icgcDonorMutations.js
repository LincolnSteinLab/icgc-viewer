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

        constructor: function (args) {
            this.donor = args.donor;
        },

        /**
         * Creates a link to a given ID
         * @param {*} link
         * @param {*} id
         */
        createLinkWithId: function(link, id) {
            if (id !== null) {
                return "<a href='" + link + id + "' target='_blank'>" + id + "</a>";
            } else {
                return "n/a";
            }
        },

        /**
         * Return string showing fraction of total donors affected by the mutation
         * @param {*} variant 
         */
        getDonorFraction: function(variant) {
            if (variant.affectedDonorCountTotal && variant.testedDonorCount) {
                return variant.affectedDonorCountTotal + "/" + variant.testedDonorCount;
            } else {
                return "n/a";
            }
        },

        /**
         * Return a list of transcripts
         * @param {*} transcripts 
         */
        getTranscripts: function(transcripts) {
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
        },

        /**
         * If a value is undefined, returns empty string, else return value
         * @param {*} value 
         */
        prettyValue: function(value) {
            return !value ? '' : value;
        },

        /**
         * Creates a table of consequences for a mutation
         * @param {*} consequences 
         */
        createConsequencesTable: function(consequences) {
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
                    '<td style="border: 1px solid #000">' + this.prettyValue(consequence.geneAffectedSymbol) + '</td>' +
                    '<td style="border: 1px solid #000">' + this.prettyValue(consequence.aaMutation) + '</td>' +
                    '<td style="border: 1px solid #000">' + this.prettyValue(consequence.type) + '</td>' +
                    '<td style="border: 1px solid #000">' + this.prettyValue(consequence.cdsMutation) + '</td>' +
                    '<td style="border: 1px solid #000">' + this.prettyValue(consequence.functionalImpact) + '</td>' +
                    '<td style="border: 1px solid #000">' + this.prettyValue(consequence.geneStrand) + '</td>' +
                    '<td style="border: 1px solid #000">' + this.getTranscripts(consequence.transcriptsAffected) + '</td>' +
                    '</tr>';
                
                consequenceTable += consequenceRow;
            }

            consequenceTable += '/<table>';
            return consequenceTable;
        },

        /**
         * Returns the end value to be used for querying ICGC
         * @param {*} chr 
         * @param {*} end 
         */
        getChromosomeEnd: function(chr, end) {
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
        

        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;
            const CIVIC_LINK = "https://civic.genome.wustl.edu/links/variants/";
            const CLINVAR_LINK = "https://www.ncbi.nlm.nih.gov/clinvar/variation/";
            const ICGC_LINK = "https://dcc.icgc.org/mutations/";

            /**
             * Fetch the mutations from the ICGC within a given range
             */
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');
            end = thisB.getChromosomeEnd(ref, end);

            var url = encodeURI('https://dcc.icgc.org/api/v1/donors/' + thisB.donor +  '/mutations?filters={"mutation":{"location":{"is":["' + ref + ':' + start + '-' + end + '"]}}}&from=1&include=consequences&size=1000');
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
                            civic: thisB.createLinkWithId(CIVIC_LINK, variant.external_db_ids.civic),
                            clinvar: thisB.createLinkWithId(CLINVAR_LINK, variant.external_db_ids.clinvar),
                            icgc: thisB.createLinkWithId(ICGC_LINK, variant.id),
                            affected_projects: variant.affectedProjectCount,
                            affected_donors: thisB.getDonorFraction(variant),
                            type: variant.type,
                            study: thisB.prettyValue(variant.study.join()),
                            description: variant.description,
                            consequences: thisB.createConsequencesTable(variant.consequences)
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