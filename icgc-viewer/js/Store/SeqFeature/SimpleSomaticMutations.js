/**
 * Store SeqFeature for ICGC Simple Somatic Mutations
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    './BaseSeqFeature',
    '../../Model/SSMFeature'
],
function(
    declare,
    array,
    request,
    BaseSeqFeature,
    SSMFeature
) {
    return declare(BaseSeqFeature, {

        constructor: function (args) {
            // ID of the donor
            this.donor = args.donor;

            // Filters to apply to mutation query
            this.filters = args.filters !== undefined ? JSON.parse(args.filters) : {};

            // Maximum mutation count to retrieve from ICGC
            this.size = args.size !== undefined ? parseInt(args.size) : 500;
        },

        /**
         * Creates a link to a given ID and name
         * @param {string} link Base URL for link
         * @param {string} id ID to apped to base URL
         */
        createLinkWithIdAndName: function(link, id, name) {
            return id !== null ? "<a href='" + link + id + "' target='_blank'>" + name + "</a>" : "n/a";
        },


        /**
         * Return string showing fraction of total donors affected by the mutation
         * @param {Variant} variant Variant object
         */
        getDonorFraction: function(variant) {
            return variant.affectedDonorCountTotal && variant.testedDonorCount ? variant.affectedDonorCountTotal + "/" + variant.testedDonorCount : "n/a";
        },

        /**
         * Return a list of transcripts
         * @param {List<Transcript>} transcripts  List of transcripts
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
         * If a list is undefined or empty, returns n/a, else return list
         * @param {string} list Value to make pretty
         */
        prettyList: function(list) {
            return list && list.length > 0 ? list : 'n/a';
        },

        convertIntToStrand: function(strand) {
            return strand == 1 ? '+' : '-'
        },

        /**
         * Creates a table of consequences for a mutation
         * @param {List<Consequence>} consequences 
         */
        createConsequencesTable: function(consequences) {
            var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
            var headerRow = `
                <tr style=\"background-color: #f2f2f2\">
                    <th style="${thStyle}">Gene</th>
                    <th style="${thStyle}">AA Change</th>
                    <th style="${thStyle}">Consequence</th>
                    <th style="${thStyle}">Coding DNA Change</th> 
                    <th style="${thStyle}">Functional Impact</th>
                    <th style="${thStyle}">Strand</th>
                    <th style="${thStyle}">Transcripts</th>
                </tr>
            `;

            var consequenceTable = '<table class="popup-table" style="border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            for (consequence of consequences) {
                var trStyle = '';
                if (count % 2 != 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var consequenceRow = `<tr ${trStyle}>
                    <td style="${thStyle}">${this.createLinkWithIdAndName('https://dcc.icgc.org/genes/', consequence.geneAffectedId ,consequence.geneAffectedSymbol)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.aaMutation)}</td>
                    <td style="${thStyle}">${this.prettyValue((consequence.type).replace(/_/g, ' '))}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.cdsMutation)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.functionalImpact)}</td>
                    <td style="${thStyle}">${this.prettyValue(this.convertIntToStrand(consequence.geneStrand))}</td>
                    <td style="${thStyle}">${this.getTranscripts(consequence.transcriptsAffected)}</td>
                    </tr>
                `;
                
                consequenceTable += consequenceRow;
                count++;
            }

            consequenceTable += '</table>';
            return consequenceTable;
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
            if (Object.keys(thisB.filters).length === 0 || thisB.filters.mutation == undefined) {
                thisB.filters.mutation = {};
            }

            thisB.filters.mutation.location = { "is": [ ref + ':' + start + '-' + end ]};
            return JSON.stringify(thisB.filters);
        },

        /**
         * 
         * @param {*} query 
         * @param {*} featureCallback 
         * @param {*} finishCallback 
         * @param {*} errorCallback 
         */
        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;

            // Validate user provided attributes
            if (Number.isNaN(this.size) || !Number.isInteger(this.size) || (Number.isInteger(this.size) && this.size < 0)) {
                errorCallback('Invalid size provided. Must be a positive integer. User provided \"' + this.size + '\"');
            }

            // Collection of remote link base structures
            const CIVIC_LINK = "https://civic.genome.wustl.edu/links/variants/";
            const CLINVAR_LINK = "https://www.ncbi.nlm.nih.gov/clinvar/variation/";
            const ICGC_LINK = "https://dcc.icgc.org/mutations/";

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

            // Retrieve all mutations in the given chromosome range
            var url = encodeURI(searchBaseUrl +  '/mutations?filters=' + thisB.getFilterQuery(ref, start, end) + '&from=1&include=consequences&size=' + this.size);
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(mutationsResponse) {
                array.forEach(mutationsResponse.hits, function(variant) {
                    variantFeature = {
                        id: variant.id,
                        data: {
                            'start': variant.start - 1,
                            'end': variant.end - 1,
                            'type': thisB.prettyValue(variant.type),
                            'about': {
                                'mutation': thisB.prettyValue(variant.mutation),
                                'allele in the reference assembly': thisB.prettyValue(variant.referenceGenomeAllele),
                                'reference genome assembly': thisB.prettyValue(variant.assemblyVersion),
                                'type': thisB.prettyValue(variant.type),
                                'id': thisB.prettyValue(variant.id)
                            },
                            'references': {
                                'civic': thisB.createLinkWithId(CIVIC_LINK, variant.external_db_ids.civic),
                                'clinvar': thisB.createLinkWithId(CLINVAR_LINK, variant.external_db_ids.clinvar),
                                'icgc': thisB.createLinkWithId(ICGC_LINK, variant.id),
                            },
                            'mutation consequences': thisB.createConsequencesTable(variant.consequences),
                            'projects': variant.id
                        }
                    }
                    featureCallback(new SSMFeature(variantFeature));
                });
                finishCallback();
                      
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting ICGC Portal');
            });
        }
    });
});