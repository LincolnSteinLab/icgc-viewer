/**
 * Support for Sequin Feature table export.  See
 * http://www.ncbi.nlm.nih.gov/Sequin/table.html.
 */

define([ 'dojo/_base/declare',
         'JBrowse/View/Export'
       ],
       function( declare, ExportBase ) {

return declare( ExportBase,

{
   constructor: function( args ) {
       this._printHeader(args);
   },

   defaultHeader: [
        'type',
        'chromosome',
        'start',
        'end'
   ],

   geneHeader: [
        'strand',
        'gene name',
        'symbol'
   ],

   ssmHeader: [
        'allele in the reference assembly',
        'mutation',
        'reference genome assembly'
    ],

    fullHeader: [],

   _printHeader: function() {
        this.fullHeader = []
        if (this.store.config.type === 'icgc-viewer/Store/SeqFeature/Genes' || this.store.config.storeClass === 'icgc-viewer/Store/SeqFeature/Genes') {
            this.fullHeader = [...this.geneHeader];
        } else if (this.store.config.type === 'icgc-viewer/Store/SeqFeature/SimpleSomaticMutations' || this.store.config.storeClass === 'icgc-viewer/Store/SeqFeature/SimpleSomaticMutations') {
            this.fullHeader = [...this.ssmHeader];
        }

        var headerString = (this.defaultHeader.concat(this.fullHeader)).join(',')
        this.print('id,')
        this.print(headerString + '\n')
   },

   formatFeature: function( feature ) {
       var featureArray = []
       var about = feature.get('about')

       featureArray.push(about['id'])
       this.defaultHeader.forEach(field => featureArray.push(feature.get(field)))
       if (this.store.config.type === 'icgc-viewer/Store/SeqFeature/Genes' || this.store.config.storeClass === 'icgc-viewer/Store/SeqFeature/Genes') {
            featureArray.push(feature.get('strand'))
        }
       this.fullHeader.forEach(field => featureArray.push(about[field]))
       return featureArray.join(",") + "\n"
    }
});
});