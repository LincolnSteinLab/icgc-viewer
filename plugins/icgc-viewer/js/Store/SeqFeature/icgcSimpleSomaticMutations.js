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

        constructor: function (args) {
            this.donor = args.donor;
            this.baseUrl = args.baseUrl;
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
         * Creates a table of projects and their associated tumour type and incidence rate for the given mutation
         */
        createProjectIncidenceTable: function(projects, projectCounts, mutationId) {
            var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
            var headerRow = `
                <tr>
                    <th style="${thStyle}">Project</th>
                    <th style="${thStyle}">Tumour Type</th>
                    <th style="${thStyle}">Frequency</th> 
                </tr>
            `;

            var projectTable = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            Object.keys(projects).forEach(project => {
                var trStyle = '';
                if (count % 2 == 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var projectRow = `<tr ${trStyle}>
                    <td style="${thStyle}">${this.prettyValue(project)}</td>
                    <td style="${thStyle}">${this.prettyValue(projects[project].tumourType)}</td>
                    <td style="${thStyle}">${this.prettyValue(projectCounts[project][mutationId])}</td>
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
         * @param {*} consequences 
         */
        createConsequencesTable: function(consequences) {
            var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
            var headerRow = `
                <tr>
                    <th style="${thStyle}">Gene</th>
                    <th style="${thStyle}">AA Change</th>
                    <th style="${thStyle}">Consequence</th>
                    <th style="${thStyle}">CDS Change</th> 
                    <th style="${thStyle}">Functional Impact</th>
                    <th style="${thStyle}">Strand</th>
                    <th style="${thStyle}">Transcripts</th>
                </tr>
            `;

            var consequenceTable = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

            var count = 0;
            for (consequence of consequences) {
                var trStyle = '';
                if (count % 2 == 0) {
                    trStyle = 'style=\"background-color: #f2f2f2\"';
                }
                var consequenceRow = `<tr ${trStyle}>
                    <td style="${thStyle}">${this.prettyValue(consequence.geneAffectedSymbol)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.aaMutation)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.type)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.cdsMutation)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.functionalImpact)}</td>
                    <td style="${thStyle}">${this.prettyValue(consequence.geneStrand)}</td>
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

            // Alter URL if looking at a donor
            var searchBaseUrl = 'https://dcc.icgc.org/api/v1';
            if (thisB.donor) {
                searchBaseUrl = searchBaseUrl + '/donors/' + thisB.donor;
            }

            var url = encodeURI(searchBaseUrl +  '/mutations?filters={"mutation":{"location":{"is":["' + ref + ':' + start + '-' + end + '"]}}}&from=1&include=consequences&size=3');
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            }).then(function(res) {
                promiseArray = []
                array.forEach(res.hits, function(item) {
                    promiseArray.push(new Promise(function(resolve, reject) {
                        var variant = item;
                        var url = encodeURI('https://dcc.icgc.org/api/v1/mutations/' + variant.id + '?field=occurences}&from=1&size=0');

                        return request(url, {
                            method: 'get',
                            headers: { 'X-Requested-With': null },
                            handleAs: 'json'
                        }).then(function(res) {
                            if (res) {
                                var projectsObject = {}
                                for (project of res.occurrences) {
                                    projectsObject[project.projectId] = project.project;
                                }

                                var projectArray = Object.keys(projectsObject);
                                var url = encodeURI('https://dcc.icgc.org/api/v1/projects/' + projectArray + '/mutations/' + variant.id + '/donors/counts');

                                return request(url, {
                                    method: 'get',
                                    headers: { 'X-Requested-With': null },
                                    handleAs: 'json'
                                }).then(function(res) {
                                    variantObject = {
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
                                            consequences: thisB.createConsequencesTable(variant.consequences),
                                            projects: thisB.createProjectIncidenceTable(projectsObject, res, variant.id)
                                        }
                                    }
                                    featureCallback(new SimpleFeature(variantObject));
                                    resolve("Success");
                                })
                            }
                            else {
                                reject(Error("Failure"));
                            }
                        });
                      }));
                      
                });
                Promise.all(promiseArray).then(function(values) {
                    finishCallback();
                });
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting ICGC Portal');
            });
        }
    });
});