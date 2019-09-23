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

   _printHeader: function() {
       var storeArray = (this.store.config.type).split('/')

       var trackArray = [
            '[tracks.' + this.store.config.label + ']',
            'storeClass=' + this.store.config.type,
            'type=' + this.track.config.type,
            'key=' + this.store.config.key,
            'metadata.datatype=' + storeArray[storeArray.length - 1],
            'unsafePopup=true',
        ]

        if (this.store.config.type === 'icgc-viewer/Store/SeqFeature/SimpleSomaticMutations') {
            trackArray.push('fmtDetailValue_projects=function(value) { return "<div id=\'projects-icgc-" + value +  "\'>Loading...</div>";}');
        }

        if (this.store.filters) {
            trackArray.push('filters=' + JSON.stringify(this.store.filters))
        }

        var trackString = trackArray.join('\n')
   
        this.print(trackString)
   },

   formatFeature: function( feature ) {
       // This file type only requires track information and not feature information
        return ''
    }
});
});