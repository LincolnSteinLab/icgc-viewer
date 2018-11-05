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

            thisB.loadDonorJCNFile();
        },

        /**
         * Loads the JCN file for the donor from ICGC (Promise)
         */
        loadDonorJCNFile: function() {
            var thisB = this;
            var url = 'https://dcc.icgc.org/api/v1/download/submit?filters={"donor":{"id":{"is":["' + this.donor + '"]}}}&info=[{"key":"jcn","value":"JSON"}]';
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
                    var donorIdPosition = -1;
                    var projectCodePosition = -1;
                    var geneChromosomePosition = -1;
                    var geneStartPosition = -1;
                    var geneEndPosition = -1;
                    var geneStrandPosition = -1;
                    var geneStableIdPosition = -1;

                    var exonOneChromosomePositon = -1;
                    var exonOneNumberBasesPosition = -1;
                    var exonOneEndPosition = -1;
                    var exonOneStrandPosition = -1;

                    var exonTwoChromosomePositon = -1;
                    var exonTwoNumberBasesPosition = -1;
                    var exonTwoStartPosition = -1;
                    var exonTwoStrandPosition = -1;

                    var isFusionGenePosition = -1;
                    var isNovelSpliceFormPosition = -1;

                    // TODO: Find a node package for parsing TSV files
                    var splitFileByLine = thisB.zipBuffer.split(/\n/);
                    splitFileByLine.forEach((element) => {
                        var splitLineByTab = element.split(/\t/);

                        // Determine indices 
                        if (isHeaderLine) {
                            // Common positions
                            donorIdPosition = splitLineByTab.indexOf("icgc_donor_id");
                            projectCodePosition = splitLineByTab.indexOf("project_code");
                            geneChromosomePosition = splitLineByTab.indexOf("gene_chromosome");
                            geneStartPosition = splitLineByTab.indexOf("gene_start");
                            geneEndPosition = splitLineByTab.indexOf("gene_end");
                            geneStrandPosition = splitLineByTab.indexOf("gene_strand");
                            geneStableIdPosition = splitLineByTab.indexOf("gene_stable_id");

                            // Exon one positions
                            exonOneChromosomePositon = splitLineByTab.indexOf("exon1_chromosome");
                            exonOneNumberBasesPosition = splitLineByTab.indexOf("exon1_number_bases");
                            exonOneEndPosition = splitLineByTab.indexOf("exon1_end");
                            exonOneStrandPosition = splitLineByTab.indexOf("exon1_strand");

                            // Exon two positions
                            exonTwoChromosomePositon = splitLineByTab.indexOf("exon2_chromosome");
                            exonTwoNumberBasesPosition = splitLineByTab.indexOf("exon2_number_bases");
                            exonTwoStartPosition = splitLineByTab.indexOf("exon2_start");
                            exonTwoStrandPosition = splitLineByTab.indexOf("exon2_strand");

                            isFusionGenePosition = splitLineByTab.indexOf("is_fusion_gene");
                            isNovelSpliceFormPosition = splitLineByTab.indexOf("is_novel_splice_form");

                            if (donorIdPosition == -1 || geneChromosomePosition == -1 || geneStartPosition == -1 || geneEndPosition == -1 || geneStrandPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            if (splitLineByTab[geneChromosomePosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[geneChromosomePosition] + "_" + splitLineByTab[geneStableIdPosition] + "_JCN",
                                    data: {
                                        start: splitLineByTab[geneStartPosition],
                                        end: splitLineByTab[geneEndPosition],
                                        strand: splitLineByTab[geneStrandPosition],
                                        project: splitLineByTab[projectCodePosition],
                                        gene: splitLineByTab[geneStableIdPosition],
                                        exonOneChromsome: splitLineByTab[exonOneChromosomePositon],
                                        exonOneNumberBases: splitLineByTab[exonOneNumberBasesPosition],
                                        exonOneEnd: splitLineByTab[exonOneEndPosition],
                                        exonOneStrand: splitLineByTab[exonOneStrandPosition],
                                        exonTwoChromsome: splitLineByTab[exonTwoChromosomePositon],
                                        exonTwoNumberBases: splitLineByTab[exonTwoNumberBasesPosition],
                                        exonTwoEnd: splitLineByTab[exonTwoStartPosition],
                                        exonTwoStrand: splitLineByTab[exonTwoStrandPosition],
                                        isFusionGene: splitLineByTab[isFusionGenePosition],
                                        isNovelSpliceForm: splitLineByTab[isNovelSpliceFormPosition]
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