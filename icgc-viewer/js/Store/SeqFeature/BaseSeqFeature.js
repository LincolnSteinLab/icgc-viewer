/**
 * Base class for some Store SeqFeature for ICGC
 */
define([
    'dojo/_base/declare',
    'JBrowse/Store/SeqFeature'
],
function(
    declare,
    SeqFeatureStore
) {
    return declare(SeqFeatureStore, {

        /**
         * Creates a link to a given ID
         * @param {string} link Base URL for link
         * @param {string} id ID to apped to base URL
         */
        createLinkWithId: function(link, id) {
            return id ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
        },

        /**
         * Returns the end value to be used for querying ICGC (GrCh37)
         * TODO: This is not ideal, and alternative options should be investigated
         * @param {string} chr Chromosome number (ex. 1)
         * @param {integer} end End location of JBrowse view
         */
        getChromosomeEnd: function getChromosomeEnd(chr, end) {
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

        /**
         * If a value is undefined, returns n/a, else return value
         * @param {string} value Value to make pretty
         */
        prettyValue: function(value) {
            return value ? value : 'n/a';
        },

        /**
         * Stub for getParser
         */
        getParser: function() {
            return new Promise(function(resolve, reject) {
                resolve({'getMetadata': function() {}});
            });
        },
    });
});