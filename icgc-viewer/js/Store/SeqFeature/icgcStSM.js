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

            thisB.loadDonorStSMFile();
        },

        /**
         * Loads the StSM file for the donor from ICGC (Promise)
         */
        loadDonorStSMFile: function() {
            var thisB = this;
            var url = 'https://dcc.icgc.org/api/v1/download/submit?filters={"donor":{"id":{"is":["' + this.donor + '"]}}}&info=[{"key":"stsm","value":"JSON"}]';
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
                    var chrToPosition = -1;
                    var chrToStrandPosition = -1;
                    var chrToBKPTPosition = -1;
                    var chrToFlankPosition = -1;
                    var chrToRangePosition = -1;

                    var chrFromPosition = -1;
                    var chrFromStrandPosition = -1;
                    var chrFromBKPTPosition = -1;
                    var chrFromFlankPosition = -1;
                    var chrFromRangePosition = -1;

                    var donorIdPosition = -1;
                    var variantTypePosition = -1;
                    var projectCodePosition = -1;
                    var evidencePosition = -1;
                    var microhomologySequencePosition = -1;
                    var annotationPosition = -1;
                    var assemblyVersionPosition = -1;

                    // TODO: Find a node package for parsing TSV files
                    var splitFileByLine = thisB.zipBuffer.split(/\n/);
                    splitFileByLine.forEach((element) => {
                        var splitLineByTab = element.split(/\t/);

                        // Determine indices 
                        if (isHeaderLine) {
                            chrToPosition = splitLineByTab.indexOf("chr_to");
                            chrToStrandPosition = splitLineByTab.indexOf("chr_to_strand");
                            chrToBKPTPosition = splitLineByTab.indexOf("chr_to_bkpt");
                            chrToFlankPosition = splitLineByTab.indexOf("chr_to_flanking_seq");
                            chrToRangePosition = splitLineByTab.indexOf("chr_to_range");

                            chrFromPosition = splitLineByTab.indexOf("chr_from");
                            chrFromStrandPosition = splitLineByTab.indexOf("chr_from_strand");
                            chrFromBKPTPosition = splitLineByTab.indexOf("chr_from_bkpt");
                            chrFromFlankPosition = splitLineByTab.indexOf("chr_from_flanking_seq");
                            chrFromRangePosition = splitLineByTab.indexOf("chr_from_range");

                            donorIdPosition = splitLineByTab.indexOf("icgc_donor_id");
                            variantTypePosition = splitLineByTab.indexOf("variant_type");
                            projectCodePosition = splitLineByTab.indexOf("project_code");
                            evidencePosition = splitLineByTab.indexOf("evidence");
                            microhomologySequencePosition = splitLineByTab.indexOf("microhomology_sequence");
                            annotationPosition = splitLineByTab.indexOf("annotation");
                            assemblyVersionPosition = splitLineByTab.indexOf("assembly_version");

                            if (chrFromPosition == -1 || chrFromBKPTPosition == -1 || chrFromStrandPosition == -1 || chrToPosition == -1 || chrToBKPTPosition == -1 || chrToStrandPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            if (splitLineByTab[chrToPosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                var start = parseInt(splitLineByTab[chrToBKPTPosition]) - parseInt(splitLineByTab[chrToRangePosition]);
                                var end = parseInt(splitLineByTab[chrToBKPTPosition]) + parseInt(splitLineByTab[chrToRangePosition]);
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[chrToPosition] + "_" + start + "_" + end + "_copyNumber",
                                    data: {
                                        start: start,
                                        end: end,
                                        type: splitLineByTab[variantTypePosition],
                                        strand: splitLineByTab[chrToStrandPosition],
                                        project: splitLineByTab[projectCodePosition],
                                        from: "Chr " + splitLineByTab[chrFromPosition] + " , Position " + splitLineByTab[chrFromBKPTPosition] + ", Strand " + splitLineByTab[chrFromStrandPosition],
                                        evidence: splitLineByTab[evidencePosition],
                                        microhomology: splitLineByTab[microhomologySequencePosition],
                                        fromFlankingSequence: splitLineByTab[chrFromFlankPosition],
                                        annotation: splitLineByTab[annotationPosition],
                                        assemblyVersion: splitLineByTab[assemblyVersionPosition]
                                    }
                                }));
                            }
                            if (splitLineByTab[chrFromPosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                var start = parseInt(splitLineByTab[chrFromBKPTPosition]) - parseInt(splitLineByTab[chrFromRangePosition]);
                                var end = parseInt(splitLineByTab[chrFromBKPTPosition]) + parseInt(splitLineByTab[chrFromRangePosition]);
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[chrFromPosition] + "_" + start + "_" + end + "_copyNumber",
                                    data: {
                                        start: start,
                                        end: end,
                                        type: splitLineByTab[variantTypePosition],
                                        strand: splitLineByTab[chrFromStrandPosition],
                                        project: splitLineByTab[projectCodePosition],
                                        to: "Chr " + splitLineByTab[chrToPosition] + ", Position " + splitLineByTab[chrToBKPTPosition] + ", Strand " + splitLineByTab[chrToStrandPosition],
                                        evidence: splitLineByTab[evidencePosition],
                                        microhomology: splitLineByTab[microhomologySequencePosition],
                                        toFlankingSequence: splitLineByTab[chrToFlankPosition],
                                        annotation: splitLineByTab[annotationPosition],
                                        assemblyVersion: splitLineByTab[assemblyVersionPosition]
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