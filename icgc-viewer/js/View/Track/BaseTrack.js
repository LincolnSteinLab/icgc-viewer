define(
    [
        "dojo/_base/declare",
        "JBrowse/View/Track/HTMLFeatures",
        'JBrowse/View/Track/_ExportMixin',
        'dojo/dom-construct',
        'dijit/form/Button',
        './AppliedFiltersEditor'
    ],
   function(
       declare,
       HTMLFeatures,
       ExportMixin,
       domConstruct,
       Button,
       AppliedFiltersEditor) {
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
            var track = this;
            options.push({
                label: 'View Applied Filters',
                title: 'View Applied Filters',
                action: function() {
                    new AppliedFiltersEditor(track)
                        .show();
                }
            });
            return options;
        },

        _shareableLinkContent: function() {
            var track = this;
            var details = domConstruct.create('div', { className: 'detail', style: 'display: flex; flex-direction: column; align-items: center; justify-content: center;' });

            var headerString = '<h1 style="width: 80%">Shareable Link</h1>';
            var headerElement = domConstruct.toDom(headerString);
            domConstruct.place(headerElement, details);

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
            var helpString = '<span style="width: 80%">Use the following link to share the selected track at the current location.</span>';
            var helpElement = domConstruct.toDom(helpString);
            domConstruct.place(helpElement, details);

            // Create text area with shareable link
            var textArea = domConstruct.create(
                'textarea',{
                    rows: 3,
                    value: shareableLink,
                    style: "width: 80%",
                    readOnly: true
                }, details );

            // Create a copy button for text
            var copyButton = new Button({
                label: 'Copy',
                iconClass: 'dijitIconCopy',
                onClick: function() {
                    textArea.focus();
                    textArea.select();
                    document.execCommand("copy");
                }
            }).placeAt(details);

            // Create a DOM element for the link
            var linkString = '<a target="_blank" href="' + shareableLink + '">Open in New Tab</a>';
            var linkElement = domConstruct.toDom(linkString);
            domConstruct.place(linkElement, details);

            return details;
        }
   }); 
   }   
);