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
       console.log(this)

        var trackObject = {
            'label': this.store.config.label,
            'storeClass': this.store.config.type,
            'type': this.track.config.type,
            'key': this.store.config.key,
            'metadata': {
                'datatype': storeArray[storeArray.length - 1]
            },
            'unsafePopup': true,
            'donor': this.store.donor,
            'size': this.store.size
        }

        if (this.store.filters) {
            trackObject['filters'] = JSON.stringify(this.store.filters);
        }

        var trackString = JSON.stringify(trackObject, null, '\t');
   
        this.print(trackString)
   },

   formatFeature: function( feature ) {
       // This file type only requires track information and not feature information
        return ''
    }
});
});