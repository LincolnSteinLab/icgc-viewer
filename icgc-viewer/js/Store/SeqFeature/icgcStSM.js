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
                    var projectCodePosition = -1;
                    var icgcSpecimenIdPositon = -1;
                    var icgcSampleIdPosition = -1;
                    var submittedSampleIdPosition = -1;
                    var submittedMatchedSampleIdPosition = -1;
                    var variantTypePosition = -1;
                    var evidencePosition = -1;
                    var microhomologySequencePosition = -1;
                    var annotationPosition = -1;
                    var interpretedAnnotationPosition = -1;
                    var assemblyVersionPosition = -1;
                    var svIdPosition = -1;
                    var sequencingStrategyPosition = -1;
                    var nonTemplateSequencePositon = -1;
                    var qualityScorePositon = -1;
                    var probabilityPosition = -1;
                    var zygosityPosition = -1;
                    var verificationPosition = -1;
                    var verificationPlatformPosition = -1;
                    var geneAffectedByBKPTFromPosition = -1;
                    var geneAffectedByBKPTToPosition = -1;
                    var transcriptAffectedByBKPTFromPosition = -1;
                    var transcriptAffectedByBKPTToPosition = -1;
                    var bkptFromContextPosition = -1;
                    var bkptToContextPosition = -1;
                    var geneBuildVersionPosition = -1;
                    var platformPosition = -1;
                    var experimentalProtocolPosition = -1;
                    var baseCallingAlgorithmPosition = -1;
                    var alignmentAlgorithmPosition = -1;
                    var variantCallingAlgorithmPosition = -1;
                    var otherAnalysisPlatformPosition = -1;
                    var seqCoveragePosition = -1;
                    var rawDataRepositoryPosition = -1;
                    var rawDataAccessionPosition = -1;

                    // TODO: Find a node package for parsing TSV files
                    var splitFileByLine = thisB.zipBuffer.split(/\n/);
                    splitFileByLine.forEach((element) => {
                        var splitLineByTab = element.split(/\t/);

                        // Determine indices 
                        if (isHeaderLine) {
                            // Chr To related positions
                            chrToPosition = splitLineByTab.indexOf("chr_to");
                            chrToStrandPosition = splitLineByTab.indexOf("chr_to_strand");
                            chrToBKPTPosition = splitLineByTab.indexOf("chr_to_bkpt");
                            chrToFlankPosition = splitLineByTab.indexOf("chr_to_flanking_seq");
                            chrToRangePosition = splitLineByTab.indexOf("chr_to_range");

                            // Chr From related positions
                            chrFromPosition = splitLineByTab.indexOf("chr_from");
                            chrFromStrandPosition = splitLineByTab.indexOf("chr_from_strand");
                            chrFromBKPTPosition = splitLineByTab.indexOf("chr_from_bkpt");
                            chrFromFlankPosition = splitLineByTab.indexOf("chr_from_flanking_seq");
                            chrFromRangePosition = splitLineByTab.indexOf("chr_from_range");

                            // Common positions
                            donorIdPosition = splitLineByTab.indexOf("icgc_donor_id");
                            variantTypePosition = splitLineByTab.indexOf("variant_type");
                            projectCodePosition = splitLineByTab.indexOf("project_code");
                            evidencePosition = splitLineByTab.indexOf("evidence");
                            microhomologySequencePosition = splitLineByTab.indexOf("microhomology_sequence");
                            annotationPosition = splitLineByTab.indexOf("annotation");
                            assemblyVersionPosition = splitLineByTab.indexOf("assembly_version");
                            svIdPosition = splitLineByTab.indexOf("sv_id");
                            sequencingStrategyPosition = splitLineByTab.indexOf("sequencing_strategy");
                            nonTemplateSequencePositon = splitLineByTab.indexOf("non_templated_sequence");
                            qualityScorePositon = splitLineByTab.indexOf("quality_score");
                            probabilityPosition = splitLineByTab.indexOf("probability");
                            zygosityPosition = splitLineByTab.indexOf("zygosity");
                            verificationPosition = splitLineByTab.indexOf("verification_status");
                            verificationPlatformPosition = splitLineByTab.indexOf("verification_platform");
                            platformPosition = splitLineByTab.indexOf("platform");
                            experimentalProtocolPosition = splitLineByTab.indexOf("experimental_protocol");
                            baseCallingAlgorithmPosition = splitLineByTab.indexOf("base_calling_algorithm");
                            alignmentAlgorithmPosition = splitLineByTab.indexOf("alignment_algorithm");
                            variantCallingAlgorithmPosition = splitLineByTab.indexOf("variation_calling_algorithm");
                            otherAnalysisPlatformPosition = splitLineByTab.indexOf("other_analysis_algorithm");
                            seqCoveragePosition = splitLineByTab.indexOf("seq_coverage");
                            rawDataRepositoryPosition = splitLineByTab.indexOf("raw_data_repository");
                            rawDataAccessionPosition = splitLineByTab.indexOf("raw_data_accession");
                            
                            icgcSpecimenIdPositon = splitLineByTab.indexOf("icgc_specimen_id");
                            icgcSampleIdPosition = splitLineByTab.indexOf("icgc_sample_id");
                            submittedSampleIdPosition = splitLineByTab.indexOf("submitted_sample_id");
                            submittedMatchedSampleIdPosition = splitLineByTab.indexOf("submitted_matched_sample_id");
                            interpretedAnnotationPosition = splitLineByTab.indexOf("interpreted_annotation");
                            geneAffectedByBKPTFromPosition = splitLineByTab.indexOf("gene_affected_by_bkpt_from");
                            geneAffectedByBKPTToPosition = splitLineByTab.indexOf("gene_affected_by_bkpt_to");
                            transcriptAffectedByBKPTFromPosition = splitLineByTab.indexOf("transcript_affected_by_bkpt_from");
                            transcriptAffectedByBKPTToPosition = splitLineByTab.indexOf("transcript_affected_by_bkpt_to");
                            bkptFromContextPosition = splitLineByTab.indexOf("bkpt_from_context");
                            bkptToContextPosition = splitLineByTab.indexOf("bkpt_to_context");
                            geneBuildVersionPosition = splitLineByTab.indexOf("gene_build_version");

                            
                            if (chrFromPosition == -1 || chrFromBKPTPosition == -1 || chrFromStrandPosition == -1 || chrToPosition == -1 || chrToBKPTPosition == -1 || chrToStrandPosition == -1) {
                                errorCallback("File is missing a required header field.");
                            }
                        } else {
                            // Create a feature for the TO position
                            if (splitLineByTab[chrToPosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                var start = parseInt(splitLineByTab[chrToBKPTPosition]) - parseInt(splitLineByTab[chrToRangePosition]);
                                var end = parseInt(splitLineByTab[chrToBKPTPosition]) + parseInt(splitLineByTab[chrToRangePosition]);
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[chrToPosition] + "_" + start + "_" + end + "_StSMs",
                                    data: {
                                        'start': start,
                                        'end': end,
                                        'type': splitLineByTab[variantTypePosition],
                                        'strand': splitLineByTab[chrToStrandPosition],
                                        'Project': splitLineByTab[projectCodePosition],
                                        'From': "Chr " + splitLineByTab[chrFromPosition] + ", Position " + splitLineByTab[chrFromBKPTPosition] + " (+/-" + splitLineByTab[chrFromRangePosition] + " bases), Strand " + splitLineByTab[chrFromStrandPosition],
                                        'Evidence': splitLineByTab[evidencePosition],
                                        'Microhomology': splitLineByTab[microhomologySequencePosition],
                                        'From Flanking Sequence': splitLineByTab[chrFromFlankPosition],
                                        'Annotation': splitLineByTab[annotationPosition],
                                        'Assembly Version': splitLineByTab[assemblyVersionPosition],
                                        'name': splitLineByTab[svIdPosition] + ' - To',
                                        'Sequencing Strategy': splitLineByTab[sequencingStrategyPosition],
                                        'Non Template Sequence': splitLineByTab[nonTemplateSequencePositon],
                                        'Quality Score': splitLineByTab[qualityScorePositon],
                                        'Probability': splitLineByTab[probabilityPosition],
                                        'Zygosity': splitLineByTab[zygosityPosition],
                                        'Verification Status': splitLineByTab[verificationPosition],
                                        'Verification Platform': splitLineByTab[verificationPlatformPosition],
                                        'Platform': splitLineByTab[platformPosition],
                                        'Experimental Protocol': splitLineByTab[experimentalProtocolPosition],
                                        'Base Calling Algorithm': splitLineByTab[baseCallingAlgorithmPosition],
                                        'Alignment Algorithm': splitLineByTab[alignmentAlgorithmPosition],
                                        'Variant Calling Algorithm': splitLineByTab[variantCallingAlgorithmPosition],
                                        'Other Analysis Platform': splitLineByTab[otherAnalysisPlatformPosition],
                                        'Seq Coverage Position': splitLineByTab[seqCoveragePosition],
                                        'Raw Data Repository': splitLineByTab[rawDataRepositoryPosition],
                                        'Raw Data Accession': splitLineByTab[rawDataAccessionPosition],
                                        'ICGC Specimin Id': splitLineByTab[icgcSpecimenIdPositon],
                                        'ICGC Sample Id': splitLineByTab[icgcSampleIdPosition],
                                        'Submitted Sample Id': splitLineByTab[submittedSampleIdPosition],
                                        'Submitted Matched Sample Id': splitLineByTab[submittedMatchedSampleIdPosition],
                                        'Interpreted Annotation': splitLineByTab[interpretedAnnotationPosition],
                                        'Gene Affected By BKPT From': splitLineByTab[geneAffectedByBKPTFromPosition],
                                        'Gene Affected By BKPT To': splitLineByTab[geneAffectedByBKPTToPosition],
                                        'Transcript Affected By BKPT From': splitLineByTab[transcriptAffectedByBKPTFromPosition],
                                        'Transcript Affected By BKPT To': splitLineByTab[transcriptAffectedByBKPTToPosition],
                                        'BKPT From Context': splitLineByTab[bkptFromContextPosition],
                                        'BKPT To Context': splitLineByTab[bkptToContextPosition],
                                        'Gene Build Version': splitLineByTab[geneBuildVersionPosition]
                                    }
                                }));
                            }

                            // Create a feature for the FROM position
                            if (splitLineByTab[chrFromPosition] === ref && thisB.donor === splitLineByTab[donorIdPosition]) {
                                var start = parseInt(splitLineByTab[chrFromBKPTPosition]) - parseInt(splitLineByTab[chrFromRangePosition]);
                                var end = parseInt(splitLineByTab[chrFromBKPTPosition]) + parseInt(splitLineByTab[chrFromRangePosition]);
                                featureCallback(new SimpleFeature({
                                    id: splitLineByTab[chrFromPosition] + "_" + start + "_" + end + "_StSMs",
                                    data: {
                                        'start': start,
                                        'end': end,
                                        'type': splitLineByTab[variantTypePosition],
                                        'strand': splitLineByTab[chrFromStrandPosition],
                                        'Project': splitLineByTab[projectCodePosition],
                                        'To': "Chr " + splitLineByTab[chrToPosition] + ", Position " + splitLineByTab[chrToBKPTPosition] + " (+/-" + splitLineByTab[chrToRangePosition] + " bases), Strand " + splitLineByTab[chrToStrandPosition],
                                        'Evidence': splitLineByTab[evidencePosition],
                                        'Microhomology': splitLineByTab[microhomologySequencePosition],
                                        'To Flanking Sequence': splitLineByTab[chrToFlankPosition],
                                        'Annotation': splitLineByTab[annotationPosition],
                                        'Assembly Version': splitLineByTab[assemblyVersionPosition],
                                        'name': splitLineByTab[svIdPosition] + '- From',
                                        'Sequencing Strategy': splitLineByTab[sequencingStrategyPosition],
                                        'Non Template Sequence': splitLineByTab[nonTemplateSequencePositon],
                                        'Quality Score': splitLineByTab[qualityScorePositon],
                                        'Probability': splitLineByTab[probabilityPosition],
                                        'Zygosity': splitLineByTab[zygosityPosition],
                                        'Verification Status': splitLineByTab[verificationPosition],
                                        'Verification Platform': splitLineByTab[verificationPlatformPosition],
                                        'Platform': splitLineByTab[platformPosition],
                                        'Experimental Protocol': splitLineByTab[experimentalProtocolPosition],
                                        'Base Calling Algorithm': splitLineByTab[baseCallingAlgorithmPosition],
                                        'Alignment Algorithm': splitLineByTab[alignmentAlgorithmPosition],
                                        'Variant Calling Algorithm': splitLineByTab[variantCallingAlgorithmPosition],
                                        'Other Analysis Platform': splitLineByTab[otherAnalysisPlatformPosition],
                                        'Seq Coverage Position': splitLineByTab[seqCoveragePosition],
                                        'Raw Data Repository': splitLineByTab[rawDataRepositoryPosition],
                                        'Raw Data Accession': splitLineByTab[rawDataAccessionPosition],
                                        'ICGC Specimin Id': splitLineByTab[icgcSpecimenIdPositon],
                                        'ICGC Sample Id': splitLineByTab[icgcSampleIdPosition],
                                        'Submitted Sample Id': splitLineByTab[submittedSampleIdPosition],
                                        'Submitted Matched Sample Id': splitLineByTab[submittedMatchedSampleIdPosition],
                                        'Interpreted Annotation Id': splitLineByTab[interpretedAnnotationIdPosition],
                                        'Gene Affected By BKPT From': splitLineByTab[geneAffectedByBKPTFromPosition],
                                        'Gene Affected By BKPT To': splitLineByTab[geneAffectedByBKPTToPosition],
                                        'Transcript Affected By BKPT From': splitLineByTab[transcriptAffectedByBKPTFromPosition],
                                        'Transcript Affected By BKPT To': splitLineByTab[transcriptAffectedByBKPTToPosition],
                                        'BKPT From Context': splitLineByTab[bkptFromContextPosition],
                                        'BKPT To Context': splitLineByTab[bkptToContextPosition],
                                        'Gene Build Version': splitLineByTab[geneBuildVersionPosition]
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