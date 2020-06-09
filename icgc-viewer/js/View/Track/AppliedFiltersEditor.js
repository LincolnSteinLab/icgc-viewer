/**
 * Create dialog showing applied filters for the given track.
 * User can apply new filters here too.
 */
define([
    'dojo/_base/declare',
    'dojo/aspect',
    'dojo/json',
    'dojo/dom-construct',
    'dijit/Dialog',
    'dijit/form/Button',
    'dijit/form/NumberSpinner',
    'dijit/form/ValidationTextBox',
    './ValidationTextArea'
],
function(
    declare,
    aspect,
    JSON,
    dom,
    Dialog,
    Button,
    NumberSpinner,
    ValidationTextBox,
    ValidationTextArea
) {

return declare( null, {

    constructor: function( track ) {
        this.track = track;
        console.log(this.track)
    },

    show: function( editCallback, cancelCallback ) {
        var dialog = this.dialog = new Dialog(
            { title: "Track Filters", className: 'appliedFiltersEditor' }
            );

        var content = [
            this._makeEditControls().domNode
        ];
        dialog.set( 'content', content );
        dialog.show();

        aspect.after( dialog, 'hide', dojo.hitch( this, function() {
                            setTimeout( function() {
                                dialog.destroyRecursive();
                            }, 500 );
                    }));
    },

    _makeEditControls: function() {
        var details = dom.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });
            
        var headerString = '<h1 style="width: 80%">Track Filters</h1>';
        var headerElement = dom.toDom(headerString);
        dom.place(headerElement, details);

        // Create help text
        var helpString = '<span style="width: 80%; font-size: 14px;">The following filters have been applied to the track. You can update the filters here, though no validation is done on the input.</span>';
        var helpElement = dom.toDom(helpString);
        dom.place(helpElement, details);

        var filterString = '<div style="width: 80%"><h3>Filters</h3><span>Filters narrow down the features displayed on the track. We use the same format as the ICGC API.</span></div>';
        var filterElement = dom.toDom(filterString);
        dom.place(filterElement, details);

        // Get filtered text
        var filteredText = JSON.stringify(this.track.store.filters, null, 2)

        var textArea = new ValidationTextArea({
            rows: 20,
            value: filteredText,
            style: "width: 80%",
            readOnly: false,
            id: "filterTextArea",
            invalidMessage: "Invalid JSON filter - must be a valid JSON",
            isValid: function() {
                var value = this.attr('value')
                try {
                  JSON.parse(value)
                } catch (e) {
                    return false;
                }
                return true;
              }
        }).placeAt(details);

        var donorString = '<div style="width: 80%"><h3>Donor UUID</h3><span>UUID for a donor in the form of DOxxxx. Multiple UUIDs supported using commas.</span></div>';
        var donorElement = dom.toDom(donorString);
        dom.place(donorElement, details);

        var donorIdTextBox = new ValidationTextBox({
            value: this.track.store.config.donor,
            style: "width: 80%",
            id: "donorTextBox",
            regExp: "^DO[0-9]+(,DO[0-9]+)*$",
            invalidMessage: "Invalid Donor ID - Must be of the form DOxxxx, where xxxx is some number greater than 0.",
            trim: true
        }).placeAt(details);

        var sizeHeader = '<div style="width: 80%"><h3>Size</h3><span>This is the maximum number of results to return per panel.</span></div>';
        var sizeElement = dom.toDom(sizeHeader);
        dom.place(sizeElement, details);

        var sizeTextBox = new NumberSpinner({
            value: this.track.store.size,
            style: "width: 80%",
            id: "sizeTextBox",
            constraints: { min: 1, max: 1000, places: 0 },
            smallDelta: 10
        }).placeAt(details);

        var actionBar = dom.create(
            'div', {
                className: 'dijitDialogPaneActionBar'
            }, details);

        var closeButton = new Button({
            iconClass: 'dijitIconDelete',
            label: 'Cancel',
            onClick: dojo.hitch( this, function() {
                                this.dialog.hide();
                            })
            })
            .placeAt(actionBar);

        var updateTrackButton = new Button({
            label: 'Apply',
            iconClass: 'dijitIconSave',
            onClick: dojo.hitch( this, function() {
                const trackString = document.getElementById("filterTextArea").value;
                const donorString = document.getElementById("donorTextBox").value;
                const sizeString = document.getElementById("sizeTextBox").value;
                var storeConf = {
                    browser: this.track.browser,
                    refSeq: this.track.browser.refSeq,
                    type: this.track.store.config.type,
                    donor: donorString,
                    size: sizeString,
                    filters: trackString
                };
                var storeName = this.track.browser.addStoreConfig(null, storeConf);
                this.track.config.store = storeName;
                this.track.browser.publish( '/jbrowse/v1/v/tracks/replace', [this.track.config] );
                this.dialog.hide();
            })
        }).placeAt(actionBar);

        donorIdTextBox.on('change', function(e) {
            updateTrackButton.set('disabled', !donorIdTextBox.validate() || !sizeTextBox.validate() || !textArea.validate())
        });

        sizeTextBox.on('change', function(e) {
            updateTrackButton.set('disabled', !donorIdTextBox.validate() || !sizeTextBox.validate() || !textArea.validate())
        });

        textArea.on('change', function(e) {
            updateTrackButton.set('disabled', !donorIdTextBox.validate() || !sizeTextBox.validate() || !textArea.validate())
        });

        return { domNode: details };
    },

});
});
