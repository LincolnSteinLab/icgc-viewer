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
                    var icgcSpecimenIdPosition = -1;
                    var icgcSampleIdPosition = -1;
                    var submittedSampleIdPosition = -1;
                    var analysisIdPosition = -1;
                    var junctionIdPosition = -1;
                    var assemblyVersionIdPosition = -1;
                    var secondGeneStableIdPosition = -1;
                    var junctionSeqPosition = -1;
                    var junctionTypePosition = -1;
                    var junctionReadCountPosition = -1;
                    var qualityScorePosition = -1;
                    var probabilityPosition = -1;
                    var verificationPosition = -1;
                    var verificationPlatformPosition = -1;
                    var geneBuildVersionPosition = -1;
                    var platformPosition = -1;
                    var experimentalProtocolPosition = -1;
                    var baseCallingAlgorithmPosition = -1;
                    var alignmentAlgorithmPosition = -1;
                    var normalizationAlgorithmPosition = -1;
                    var otherAnalysisPlatformPosition = -1;
                    var seqCoveragePosition = -1;
                    var rawDataRepositoryPosition = -1;
                    var rawDataAccessionPosition = -1;
                    var projectCodePosition = -1;
                    var geneChromosomePosition = -1;
                    var geneStartPosition = -1;
                    var geneEndPosition = -1;
                    var geneStrandPosition = -1;
                    var geneStableIdPosition = -1;

                    var exonOneChromosomePosition = -1;
                    var exonOneNumberBasesPosition = -1;
                    var exonOneEndPosition = -1;
                    var exonOneStrandPosition = -1;

                    var exonTwoChromosomePosition = -1;
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

                            verificationPosition = splitLineByTab.indexOf("verification_status");
                            verificationPlatformPosition = splitLineByTab.indexOf("verification_platform");
                            platformPosition = splitLineByTab.indexOf("platform");
                            experimentalProtocolPosition = splitLineByTab.indexOf("experimental_protocol");
                            baseCallingAlgorithmPosition = splitLineByTab.indexOf("base_calling_algorithm");
                            alignmentAlgorithmPosition = splitLineByTab.indexOf("alignment_algorithm");
                            normalizationAlgorithmPosition = splitLineByTab.indexOf("variation_calling_algorithm");
                            otherAnalysisPlatformPosition = splitLineByTab.indexOf("other_analysis_algorithm");
                            seqCoveragePosition = splitLineByTab.indexOf("seq_coverage");
                            rawDataRepositoryPosition = splitLineByTab.indexOf("raw_data_repository");
                            rawDataAccessionPosition = splitLineByTab.indexOf("raw_data_accession");
                            icgcSpecimenIdPosition = splitLineByTab.indexOf("icgc_specimen_id");
                            icgcSampleIdPosition = splitLineByTab.indexOf("icgc_sample_id");
                            submittedSampleIdPosition = splitLineByTab.indexOf("submitted_sample_id");
                            qualityScorePosition = splitLineByTab.indexOf("quality_score");
                            probabilityPosition = splitLineByTab.indexOf("probability");
                            geneBuildVersionPosition = splitLineByTab.indexOf("gene_build_version");
                            analysisIdPosition = splitLineByTab.indexOf("analysis_id");
                            assemblyVersionIdPosition = splitLineByTab.indexOf("assembly_version_id");
                            junctionIdPosition = splitLineByTab.indexOf("junction_id");
                            secondGeneStableIdPosition = splitLineByTab.indexOf("second_gene_stable_id");
                            junctionSeqPosition = splitLineByTab.indexOf("junction_seq");
                            junctionTypePosition = splitLineByTab.indexOf("junction_type");
                            junctionReadCountPosition = splitLineByTab.indexOf("junction_read_count");
                            isFusionGenePosition = splitLineByTab.indexOf("is_fusion_gene");
                            isNovelSpliceFormPosition = splitLineByTab.indexOf("is_novel_splice_form");

                            // Exon one positions
                            exonOneChromosomePosition = splitLineByTab.indexOf("exon1_chromosome");
                            exonOneNumberBasesPosition = splitLineByTab.indexOf("exon1_number_bases");
                            exonOneEndPosition = splitLineByTab.indexOf("exon1_end");
                            exonOneStrandPosition = splitLineByTab.indexOf("exon1_strand");

                            // Exon two positions
                            exonTwoChromosomePosition = splitLineByTab.indexOf("exon2_chromosome");
                            exonTwoNumberBasesPosition = splitLineByTab.indexOf("exon2_number_bases");
                            exonTwoStartPosition = splitLineByTab.indexOf("exon2_start");
                            exonTwoStrandPosition = splitLineByTab.indexOf("exon2_strand");

                            if (donorIdPosition == -1 || geneChromosomePosition == -1 || geneStartPosition == -1 || geneEndPosition == -1 || geneStrandPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            if (splitLineByTab[geneChromosomePosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[geneChromosomePosition] + "_" + splitLineByTab[geneStableIdPosition] + "_JCN",
                                    data: {
                                        'start': splitLineByTab[geneStartPosition],
                                        'end': splitLineByTab[geneEndPosition],
                                        'strand': splitLineByTab[geneStrandPosition],
                                        'Project': splitLineByTab[projectCodePosition],
                                        'Gene': splitLineByTab[geneStableIdPosition],
                                        'Exon One Chromsome': splitLineByTab[exonOneChromosomePosition],
                                        'Exon One Number Bases': splitLineByTab[exonOneNumberBasesPosition],
                                        'Exon One End': splitLineByTab[exonOneEndPosition],
                                        'Exon One Strand': splitLineByTab[exonOneStrandPosition],
                                        'Exon Two Chromsome': splitLineByTab[exonTwoChromosomePosition],
                                        'Exon Two Number Bases': splitLineByTab[exonTwoNumberBasesPosition],
                                        'Exon Two End': splitLineByTab[exonTwoStartPosition],
                                        'Exon Two Strand': splitLineByTab[exonTwoStrandPosition],
                                        'Is Fusion Gene': splitLineByTab[isFusionGenePosition],
                                        'Is Novel Splice Form': splitLineByTab[isNovelSpliceFormPosition],
                                        'Quality Score': splitLineByTab[qualityScorePosition],
                                        'Probability': splitLineByTab[probabilityPosition],
                                        'Verification Status': splitLineByTab[verificationPosition],
                                        'Verification Platform': splitLineByTab[verificationPlatformPosition],
                                        'Platform': splitLineByTab[platformPosition],
                                        'Experimental Protocol': splitLineByTab[experimentalProtocolPosition],
                                        'Base Calling Algorithm': splitLineByTab[baseCallingAlgorithmPosition],
                                        'Alignment Algorithm': splitLineByTab[alignmentAlgorithmPosition],
                                        'Normalization Algorithm': splitLineByTab[normalizationAlgorithmPosition],
                                        'Other Analysis Platform': splitLineByTab[otherAnalysisPlatformPosition],
                                        'Seq Coverage Position': splitLineByTab[seqCoveragePosition],
                                        'Raw Data Repository': splitLineByTab[rawDataRepositoryPosition],
                                        'Raw Data Accession': splitLineByTab[rawDataAccessionPosition],
                                        'ICGC Specimin Id': splitLineByTab[icgcSpecimenIdPosition],
                                        'ICGC Sample Id': splitLineByTab[icgcSampleIdPosition],
                                        'Submitted Sample Id': splitLineByTab[submittedSampleIdPosition],
                                        'Gene Build Version': splitLineByTab[geneBuildVersionPosition],
                                        'Junction Id': splitLineByTab[junctionIdPosition],
                                        'Second Gene Stable Id': splitLineByTab[secondGeneStableIdPosition],
                                        'Junction Seq': splitLineByTab[junctionSeqPosition],
                                        'Junction Type': splitLineByTab[junctionTypePosition],
                                        'Junction Read Count': splitLineByTab[junctionReadCountPosition]
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