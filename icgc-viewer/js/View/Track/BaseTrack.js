define(
    [
        "dojo/_base/declare",
        "JBrowse/View/Track/HTMLFeatures",
        'JBrowse/View/Track/_ExportMixin',
        'dojo/dom-construct',
        'dijit/form/Button',
        'dijit/form/TextBox',
        'dijit/form/NumberSpinner'
    ],
   function(
       declare,
       HTMLFeatures,
       ExportMixin,
       domConstruct,
       Button,
       TextBox,
       NumberSpinner) {
   return declare([ HTMLFeatures, ExportMixin ], {

        _exportFormats: function() {
            return [
                {name: 'icgc-viewer/View/Export/GFF3', label: 'GFF3', fileExt: 'gff3'},
                {name: 'icgc-viewer/View/Export/BED', label: 'BED', fileExt: 'bed'},
                {name: 'icgc-viewer/View/Export/CSV', label: 'CSV', fileExt: 'csv'},
                {name: 'icgc-viewer/View/Export/SequinTable', label: 'Sequin Table', fileExt: 'sqn'},
                {name: 'icgc-viewer/View/Export/TrackConfig', label: 'Track Config', fileExt: 'conf'},
                {name: 'icgc-viewer/View/Export/TrackConfigJson', label: 'Track Config JSON', fileExt: 'json'}
            ];
        },

        _trackMenuOptions: function () {
            var track = this;
            var options = this.inherited(arguments);
            options.push({
                label: 'Share Track as URL',
                action: "contentDialog",
                title: 'Share Track as URL',
                content: dojo.hitch(this,'_shareableLinkContent')
            });
            options.push({
                label: 'View Applied Filters',
                action: "contentDialog",
                title: 'View Applied Filters',
                content: dojo.hitch(this,'_appliedFilters')
            });
            return options;
        },

        _appliedFilters: function() {
            var track = this;
            var details = domConstruct.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });
            
            var headerString = '<h1 style="width: 80%">Track Filters</h1>';
            var headerElement = domConstruct.toDom(headerString);
            domConstruct.place(headerElement, details);

            // Create help text
            var helpString = '<span style="width: 80%">The following filters have been applied to the track. You can update the filters here, though no validation is done on the input.</span>';
            var helpElement = domConstruct.toDom(helpString);
            domConstruct.place(helpElement, details);

            var filterString = '<div style="width: 80%"><h3>Filters</h3></div>';
            var filterElement = domConstruct.toDom(filterString);
            domConstruct.place(filterElement, details);

            // Get filtered text
            var filteredText = JSON.stringify(track.store.filters, null, 2)

            var textArea = domConstruct.create(
                'textarea',{
                    rows: 20,
                    value: filteredText,
                    style: "width: 80%",
                    readOnly: false,
                    id: "filterTextArea"
                }, details );

            var donorString = '<div style="width: 80%"><h3>Donor ID</h3></div>';
            var donorElement = domConstruct.toDom(donorString);
            domConstruct.place(donorElement, details);

            var donorIdTextBox = new TextBox({
                value: track.store.config.donor,
                style: "width: 80%",
                id: "donorTextBox"
            }).placeAt(details);

            var sizeHeader = '<div style="width: 80%"><h3>Size</h3></div>';
            var sizeElement = domConstruct.toDom(sizeHeader);
            domConstruct.place(sizeElement, details);

            var sizeTextBox = new NumberSpinner({
                value: track.store.size,
                style: "width: 80%",
                id: "sizeTextBox",
                constraints: { min: 1, max: 1000, places: 0 },
                smallDelta: 10
            }).placeAt(details);

            var updateTrackButton = new Button({
                label: 'Update track',
                onClick: function() {
                    let trackString = document.getElementById("filterTextArea").value;
                    let donorString = document.getElementById("donorTextBox").value;
                    let sizeString = document.getElementById("sizeTextBox").value;
                    var storeConf = {
                        browser: track.browser,
                        refSeq: track.browser.refSeq,
                        type: track.store.config.type,
                        donor: donorString,
                        size: sizeString,
                        filters: trackString
                    };
                    var storeName = track.browser.addStoreConfig(null, storeConf);
                    track.config.store = storeName;
                    track.browser.publish( '/jbrowse/v1/v/tracks/replace', [track.config] );
                }
            }).placeAt(details);
            return details;
        },

        _shareableLinkContent: function() {
            var track = this;
            var details = domConstruct.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });

            // Create addTracks value
            var addTracksArray = [];
            var addTrackConf = {};
            addTrackConf.label = track.config.label;
            addTrackConf.storeClass = track.store.config.type;
            addTrackConf.type = track.config.type;
            addTrackConf.key = track.config.key;
            addTrackConf.metadata = track.config.metadata;
            addTrackConf.unsafePopup = true;
            addTrackConf.filters = track.store.config.filters;
            addTrackConf.donor = track.store.config.donor;
            addTrackConf.size = track.config.size;
            addTracksArray.push(addTrackConf);
            addTracksArray = JSON.stringify(addTracksArray); 

            // Create a shareable URL
            var params = new URLSearchParams(window.location.search);
            params.set("addTracks", addTracksArray);
            var shareableLink = window.location.protocol + "//" + window.location.host + window.location.pathname + '?' + params.toString();

            // Create help text
            var helpString = '<p>Use the following link to share the selected track at the current location.</p>';
            var helpElement = domConstruct.toDom(helpString);
            domConstruct.place(helpElement, details);

            // Create text area with shareable link
            var textArea = domConstruct.create(
                'textarea',{
                    rows: 10,
                    value: shareableLink,
                    style: "width: 80%",
                    readOnly: true
                }, details );

            // Create a DOM element for the link
            var linkString = '<a target="_blank" href="' + shareableLink + '">Open in New Tab</a>';
            var linkElement = domConstruct.toDom(linkString);
            domConstruct.place(linkElement, details);

            return details;
        }
   }); 
   }   
);