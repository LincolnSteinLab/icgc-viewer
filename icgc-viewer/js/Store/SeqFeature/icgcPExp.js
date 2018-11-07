const zlib = cjsRequire("zlib");
const http = cjsRequire("http");

define([
    'dojo/_base/declare',
    'JBrowse/Store/SeqFeature',
    'JBrowse/Model/SimpleFeature'
],
function(
    declare,
    SeqFeatureStore,
    SimpleFeature
) {
    return declare(SeqFeatureStore, {

        zipFileDownloadPromise: undefined,
        zipBuffer: [],
        addedFeaturesPromise: [],

        constructor: function(args) {
            var thisB = this;

            // ID of the donor
            this.donor = args.donor;

            thisB.loadDonorPExpFile();
        },

        /**
         * Loads the PExp file for the donor from ICGC (Promise)
         */
        loadDonorPExpFile: function() {
            var thisB = this;
            var url = 'https://dcc.icgc.org/api/v1/download/submit?filters={"donor":{"id":{"is":["' + this.donor + '"]}}}&info=[{"key":"pexp","value":"JSON"}]';
            thisB.zipFileDownloadPromise = fetch(url, {
                method: 'GET'
            }).then(function(res) {
                return res.json()
            }).then(function(res) {
                var downloadLink = 'https://dcc.icgc.org/api/v1/download/' + res.downloadId;
                return new Promise((resolve, reject) => {
                    http.get(downloadLink, function(res) {
                        var gunzip = zlib.createGunzip();            
                        res.pipe(gunzip);

                        // TODO: Even valid zip files throw error, so even on error this chain will never reject
                        gunzip.on('data', function(data) {
                            thisB.zipBuffer.push(data.toString())
                        }).on("end", function() {
                            thisB.zipBuffer = thisB.zipBuffer.join("");
                            resolve("success");               
                        }).on("error", function(e) {
                            console.log(e);
                            thisB.zipBuffer = thisB.zipBuffer.join("");
                            resolve("failure");
                        })
                    }).on('error', function(e) {
                        console.log(e)
                        resolve("failure");
                    });
                })
            }, function(err) {
                console.log(err);
                errorCallback('Error contacting ICGC Portal');
            });
        },

        getFeatures: function(query, featureCallback, finishCallback, errorCallback) {
            var thisB = this;
            // Valid refs for chromosome i is chri and i
            var ref = query.ref.replace(/chr/, '');

            thisB.zipFileDownloadPromise.then(function() {
                if (thisB.zipBuffer) {
                    var isHeaderLine = true;
                    // Index position within header
                    var normalizedExpressionLevelPosition = -1;
                    var donorIdPosition = -1;

                    var geneNamePosition = -1;

                    // TODO: Find a node package for parsing TSV files
                    var splitFileByLine = thisB.zipBuffer.split(/\n/);

                    splitFileByLine.forEach((element) => {
                        var splitLineByTab = element.split(/\t/);
                        // Determine indices 
                        if (isHeaderLine) {
                            donorIdPosition = splitLineByTab.indexOf("icgc_donor_id");
                            normalizedExpressionLevelPosition = splitLineByTab.indexOf("normalized_expression_level");
                            geneNamePosition = splitLineByTab.indexOf("gene_name");

                            if (normalizedExpressionLevelPosition == -1 || geneNamePosition == -1 || donorIdPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            if (thisB.donor === splitLineByTab[donorIdPosition]) {
                                // Need to retrieve gene start and end positions
                                var url = 'https://dcc.icgc.org/api/v1/genes?filters={"gene":{"symbol":{"is":["' + splitLineByTab[geneNamePosition] + '"]}}}';
                                var genePositionPromise = fetch(url, {
                                    method: 'GET'
                                }).then(function(res) {
                                    return res.json()
                                }).then(function(res) {
                                    var hit = res.hits[0];
                                    if (hit != undefined) {
                                        var start = hit.start;
                                        var end = hit.end;
                                        var chr = hit.chromosome;
                                        if (ref === chr) {
                                            var feature = {
                                                id: chr + "_" + start + "_" + end + "_exps",
                                                data: {
                                                    start: start,
                                                    end: end,
                                                    score: splitLineByTab[normalizedExpressionLevelPosition]
                                                }
                                            }
                                            featureCallback(new SimpleFeature(feature));
                                        }
                                    } else {
                                        console.log(splitLineByTab[geneNamePosition] + ' cannot be found.')
                                    }
                                });
                                thisB.addedFeaturesPromise.push(genePositionPromise);
                            }
                        }

                        isHeaderLine = false;
                    });

                    Promise.all(thisB.addedFeaturesPromise).then(function(res) {
                        finishCallback();
                    });
                }
            }, function(err) {
                console.log(err);
                errorCallback(err);
            });
        }
    });
});