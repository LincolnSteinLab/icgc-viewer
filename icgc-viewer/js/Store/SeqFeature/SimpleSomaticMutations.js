/**
 * Store SeqFeature for ICGC Simple Somatic Mutations
 */
define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/request',
    './BaseSeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    array,
    request,
    BaseSeqFeature,
    SimpleFeature
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
         * Creates a table of projects and their associated tumour type and incidence rate for the given mutation
         * @param {object} projects Object of the form projectId -> projectObject
         * @param {object} projectCounts Occurrence count for each project given the mutationId
         * @param {string} mutationId ICGC ID for the mutation
         */
        createProjectIncidenceTable: function(projects, projectCounts, mutationId) {
            var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
            var headerRow = `
                <tr style=\"background-color: #f2f2f2\">
                    <th style="${thStyle}">Project</th>
                    <th style="${thStyle}">Site</th>
                    <th style="${thStyle}">Tumour Type</th>
                    <th style="${thStyle}">Tumour Subtype</th>
                    <th style="${thStyle}"># Donors Affected</th> 
                </tr>
            `;

            var projectTable = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            Object.keys(projects).forEach(project => {
                var trStyle = '';
                if (count % 2 != 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var projectRow = `<tr ${trStyle}>
                    <td style="${thStyle}">${this.createLinkWithId('https://dcc.icgc.org/projects/', project)}</td>
                    <td style="${thStyle}">${this.prettyValue(projects[project].primarySite)}</td>
                    <td style="${thStyle}">${this.prettyValue(projects[project].tumourType)}</td>
                    <td style="${thStyle}">${this.prettyValue(projects[project].tumourSubtype)}</td>
                    <td style="${thStyle}">${this.prettyValue(projectCounts[project][mutationId]) + ' / ' + projects[project].ssmTestedDonorCount} (${((projectCounts[project][mutationId] / projects[project].ssmTestedDonorCount) * 100).toFixed(2)}%)</td>
                    </tr>
                `;

                projectTable += projectRow;
                count++;
            });

            projectTable += '</table>';
            return projectTable;

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

            var consequenceTable = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

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
                featurePromiseArray = []

                array.forEach(mutationsResponse.hits, function(variant) {
                    featurePromiseArray.push(new Promise(function(resolve, reject) {
                        // Find projects related to the current mutation
                        var url = encodeURI('https://dcc.icgc.org/api/v1/mutations/' + variant.id + '?field=occurences}&from=1&size=0');
                        return request(url, {
                            method: 'get',
                            headers: { 'X-Requested-With': null },
                            handleAs: 'json'
                        }).then(function(mutationResponse) {
                            if (mutationResponse) {
                                // Create an object holding all project information
                                var projects = {}
                                for (project of mutationResponse.occurrences) {
                                    projects[project.projectId] = project.project;
                                }

                                // Find counts of affected donors for each project
                                var projectArray = Object.keys(projects);
                                var url = encodeURI('https://dcc.icgc.org/api/v1/projects/' + projectArray + '/mutations/' + variant.id + '/donors/counts');
                                return request(url, {
                                    method: 'get',
                                    headers: { 'X-Requested-With': null },
                                    handleAs: 'json'
                                }).then(function(projectsResponse) {
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
                                                'affected projects': thisB.prettyValue(variant.affectedProjectCount),
                                                'affected donors': thisB.getDonorFraction(variant),
                                                'type': thisB.prettyValue(variant.type),
                                                'id': thisB.prettyValue(variant.id)
                                            },
                                            'variant description': variant.description,
                                            'external references': {
                                                'civic': thisB.createLinkWithId(CIVIC_LINK, variant.external_db_ids.civic),
                                                'clinvar': thisB.createLinkWithId(CLINVAR_LINK, variant.external_db_ids.clinvar),
                                                'icgc': thisB.createLinkWithId(ICGC_LINK, variant.id),
                                            },
                                            'mutation consequences': thisB.createConsequencesTable(variant.consequences),
                                            'projects': thisB.createProjectIncidenceTable(projects, projectsResponse, variant.id)
                                        }
                                    }
                                    featureCallback(new SimpleFeature(variantFeature));
                                    resolve("Success");
                                })
                            } else {
                                reject(Error("Failure"));
                            }
                        }, function(err) {
                            console.log(err);
                            errorCallback('Error contacting ICGC Portal');
                        });
                      }));
                      
                });
                Promise.all(featurePromiseArray).then(function(values) {
                    finishCallback();
                });
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting ICGC Portal');
            });
        }
    });
});