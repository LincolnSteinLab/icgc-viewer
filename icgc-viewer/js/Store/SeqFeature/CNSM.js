/**
 * WARNING: This store class is in development. There are no guarantees that it will work.
 */
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

        constructor: function(args) {
            var thisB = this;

            // ID of the donor
            this.donor = args.donor;

            thisB.loadDonorCNSMFile();
        },

        /**
         * Loads the CNSM file for the donor from ICGC (Promise)
         */
        loadDonorCNSMFile: function() {
            var thisB = this;
            var url = 'https://dcc.icgc.org/api/v1/download/submit?filters={"donor":{"id":{"is":["' + this.donor + '"]}}}&info=[{"key":"cnsm","value":"JSON"}]';
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
                    var chrPosition = -1;
                    var chrStartPosition = -1;
                    var chrEndPosition = -1;
                    var segMeanPosition = -1;
                    var donorIdPosition = -1;

                    // TODO: Find a node package for parsing TSV files
                    var splitFileByLine = thisB.zipBuffer.split(/\n/);
                    splitFileByLine.forEach((element) => {
                        var splitLineByTab = element.split(/\t/);

                        // Determine indices 
                        if (isHeaderLine) {
                            chrPosition = splitLineByTab.indexOf("chromosome");
                            chrStartPosition = splitLineByTab.indexOf("chromosome_start");
                            chrEndPosition = splitLineByTab.indexOf("chromosome_end");
                            segMeanPosition = splitLineByTab.indexOf("segment_mean");
                            donorIdPosition = splitLineByTab.indexOf("icgc_donor_id");
                            if (chrPosition == -1 || chrStartPosition == -1 || chrEndPosition == -1 || segMeanPosition == -1 || donorIdPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            if (splitLineByTab[chrPosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[chrPosition] + "_" + splitLineByTab[chrStartPosition] + "_" + splitLineByTab[chrEndPosition] + "_copyNumber",
                                    data: {
                                        start: splitLineByTab[chrStartPosition],
                                        end: splitLineByTab[chrEndPosition],
                                        score: splitLineByTab[segMeanPosition]
                                    }
                                }));
                            }
                        }

                        isHeaderLine = false;
                    });
                }
    
                finishCallback();
            }, function(err) {
                console.log(err);
                errorCallback(err);
            });
        }
    });
});