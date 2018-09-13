const zlib = cjsRequire("zlib");
const request = cjsRequire("request");
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

        zipPromise: undefined,
        buffer: [],

        constructor: function(args) {
            var thisB = this;
            this.donor = 'DO229446';
            var url = 'https://dcc.icgc.org/api/v1/download/submit?filters={"donor":{"id":{"is":["' + this.donor + '"]}}}&info=[{"key":"cnsm","value":"JSON"}]';
            thisB.zipPromise = fetch(url, {
                method: 'GET'
            }).then(function(res) {
                return res.json()
            }).then(function(res) {
                var downloadId = res.downloadId;
                var downloadLink = 'https://dcc.icgc.org/api/v1/download/' + downloadId;
                console.log(downloadLink);
                return new Promise((resolve, reject) => {
                    http.get(downloadLink, function(res) {
                        var gunzip = zlib.createGunzip();            
                        res.pipe(gunzip);

                        gunzip.on('data', function(data) {
                            thisB.buffer.push(data.toString())
                        }).on("end", function() {
                            thisB.buffer = thisB.buffer.join("");               
                        }).on("error", function(e) {
                            console.log('error!');
                            console.log(e);
                            thisB.buffer = thisB.buffer.join("");
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

            /**
             * Fetch the genes from the ICGC within a given range
             */
            var start = query.start;
            var end = query.end;
            var ref = query.ref.replace(/chr/, '');

            thisB.zipPromise.then(function(zip) {
                if (thisB.buffer) {
                    var isHeaderLine = true;
                    var chr = null;
                    var chrStart = 0;
                    var chrEnd = 1;
                    var segMean = null;

                    var splitFile = thisB.buffer.split(/\n/);
                    splitFile.forEach((element, index, array) => {
                        var splitLine = element.split(/\t/);
                        if (isHeaderLine) {
                            chr = splitLine.indexOf("chromosome");
                            chrStart = splitLine.indexOf("chromosome_start");
                            chrEnd = splitLine.indexOf("chromosome_end");
                            segMean = splitLine.indexOf("segment_mean");
                        } else {
                            if (splitLine[chr] === ref) {
                                featureCallback(new SimpleFeature({
                                    id: splitLine[chr] + "_" + splitLine[chrStart] + "_" + splitLine[chrEnd] + "_copyNumber",
                                    data: {
                                        start: splitLine[chrStart],
                                        end: splitLine[chrEnd],
                                        score: splitLine[segMean]
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