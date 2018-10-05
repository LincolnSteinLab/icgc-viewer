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

            thisB.loadDonorExpSFile();
        },

        /**
         * Loads the ExpS file for the donor from ICGC (Promise)
         */
        loadDonorExpSFile: function() {
            var thisB = this;
            var url = 'https://dcc.icgc.org/api/v1/download/submit?filters={"donor":{"id":{"is":["' + this.donor + '"]}}}&info=[{"key":"exp_seq","value":"JSON"}]';
            console.log(url);
            thisB.zipFileDownloadPromise = fetch(url, {
                method: 'GET'
            }).then(function(res) {
                return res.json()
            }).then(function(res) {
                var downloadLink = 'https://dcc.icgc.org/api/v1/download/' + res.downloadId;
                console.log(downloadLink);
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
                    var normalizeReadCountPosition = -1;
                    var donorIdPosition = -1;

                    var geneModelPosition = -1;
                    var geneIdPosition = -1;

                    // TODO: Find a node package for parsing TSV files
                    var splitFileByLine = thisB.zipBuffer.split(/\n/);

                    splitFileByLine.forEach((element) => {
                        var splitLineByTab = element.split(/\t/);

                        // Determine indices 
                        if (isHeaderLine) {
                            donorIdPosition = splitLineByTab.indexOf("icgc_donor_id");
                            normalizeReadCountPosition = splitLineByTab.indexOf("normalized_read_count");
                            geneModelPosition = splitLineByTab.indexOf("gene_model");
                            geneIdPosition = splitLineByTab.indexOf("gene_id");

                            if (normalizeReadCountPosition == -1 || geneIdPosition == -1 || geneModelPosition == -1 || donorIdPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            if (thisB.donor === splitLineByTab[donorIdPosition]) {
                                // Need to retrieve gene start and end positions
                                var url = "https://dcc.icgc.org/api/v1/genes/" + splitLineByTab[geneIdPosition];
                                // THIS IS HAPPENING FOR EVERY LINE OF THE FILE (50,000+)
                                var genePositionPromise = fetch(url, {
                                    method: 'GET'
                                }).then(function(res) {
                                    return res.json()
                                }).then(function(res) {
                                    var start = res.start;
                                    var end = res.end;
                                    var chr = res.chromosome;
                                    if (ref === chr) {
                                        var feature = {
                                            id: chr + "_" + start + "_" + end + "_exps",
                                            data: {
                                                start: start,
                                                end: end,
                                                score: splitLineByTab[normalizeReadCountPosition]
                                            }
                                        }
                                        featureCallback(new SimpleFeature(feature));
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