/**
 * Simple implementation of an Gene feature object.
 */
define([
    'JBrowse/Util',
    'dojo/request'
   ],
   function( Util, request ) {

var counter = 0;

var GeneFeature = Util.fastDeclare({

/**
 * @param args.data {Object} key-value data, must include 'start' and 'end'
 * @param args.parent {Feature} optional parent feature
 * @param args.id {String} optional unique identifier.  can also be in data.uniqueID.
 *
 * Note: args.data.subfeatures can be an array of these same args,
 * which will be inflated to more instances of this class.
 */
constructor: function( args ) {
    args = args || {};
    this.data = args.data || {};
    this._parent = args.parent;
    this._uniqueID = args.id || this.data.uniqueID || (
        this._parent ? this._parent.id()+'_'+(counter++) : 'GeneFeature_'+(counter++)
    );

    // inflate any subfeatures that are not already feature objects
    var subfeatures;
    if(( subfeatures = this.data.subfeatures )) {
        for( var i = 0; i < subfeatures.length; i++ ) {
            if( typeof subfeatures[i].get != 'function' ) {
                subfeatures[i] = new GeneFeature(
                    { data: subfeatures[i],
                      parent: this
                    });
            }
        }
    }
},

/**
 * Get a piece of data about the feature.  All features must have
 * 'start' and 'end', but everything else is optional.
 */
get: function(name) {
    var thisB = this;
    if (name == 'annotations') {
        var geneId = this.data[name.toLowerCase()];

        // Find projects related to the current mutation
        var url = encodeURI('https://dcc.icgc.org/api/v1/genes/' + geneId);
        request(url, {
            method: 'get',
            headers: { 'X-Requested-With': null },
            handleAs: 'json'
        }).then(function(gene) {
            document.getElementById('annotations-icgc-' + geneId).innerHTML = thisB.createProjectIncidenceTable(gene.sets);
        }).catch(function(err) {
            console.log(err)
            document.getElementById('annotations-icgc-' + geneId).innerHTML = 'Error creating annotations table';
        });
        return geneId;
    } else {
        return this.data[ name.toLowerCase() ];
    }
},

/**
 * Creates a table of annotations for the gene
 * @param {object} sets  
 */
createProjectIncidenceTable: function(sets) {
    var thisB = this;

    var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
    var setTable = '<table class="popup-table" style="border-collapse: \'collapse\'; border-spacing: 0;">';
    var goTermRow = '<tr style=\"background-color: #f2f2f2\"><td style="' + thStyle + '"><strong>GO Term</strong></td><td style="' + thStyle + '"><ul>'
    var curatedSetRow = '<tr><td style="' + thStyle + '"><strong>Curated Gene Set</strong></td><td style="' + thStyle + '"><ul>'
    var pathwayRow = '<tr style=\"background-color: #f2f2f2\"><td style="' + thStyle + '"><strong>Reactome Pathways</strong></td><td style="' + thStyle + '"><ul>'

    var hasGo = false;
    var hasSet = false;
    var hasPathway = false;

    Object.keys(sets).forEach(set => {
        var listItem = '<li>' + thisB.createLinkWithIdAndName('https://dcc.icgc.org/genesets/', sets[set].id, sets[set].name) + '</li>';
        if (sets[set].type == 'go_term' && sets[set].annotation == 'direct') {
            goTermRow += listItem;
            hasGo = true;
        } else if (sets[set].type == 'curated_set') {
            curatedSetRow += listItem;
            hasSet = true;
        } else if (sets[set].type == 'pathway') {
            pathwayRow += listItem;
            hasPathway = true;
        }
    });

    if (!hasPathway) {
        pathwayRow += 'n/a';
    }
    pathwayRow += '</ul></td></tr>'
    setTable += pathwayRow;

    if (!hasSet) {
        curatedSetRow += 'n/a';
    }
    curatedSetRow += '</ul></td></tr>'
    setTable += curatedSetRow;

    if (!hasGo) {
        goTermRow += 'n/a';
    }
    goTermRow += '</ul></td></tr>'
    setTable += goTermRow;

    setTable += '</table>';
    return setTable;
},

/**
* Creates a link to a given ID and name
* @param {string} link Base URL for link
* @param {string} id ID to apped to base URL
* @param {string} name Name to display
*/
createLinkWithIdAndName: function(link, id, name) {
   return id !== null ? "<a href='" + link + id + "' target='_blank'>" + name + "</a>" : "n/a";
},


/**
 * Set an item of data.
 */
set: function( name, val ) {
    this.data[ name ] = val;
},

/**
 * Get an array listing which data keys are present in this feature.
 */
tags: function() {
    var t = [];
    var d = this.data;
    for( var k in d ) {
        if( d.hasOwnProperty( k ) )
            t.push( k );
    }
    return t;
},

/**
 * Get the unique ID of this feature.
 */
id: function( newid ) {
    if( newid )
        this._uniqueID = newid;
    return this._uniqueID;
},

/**
 * Get this feature's parent feature, or undefined if none.
 */
parent: function() {
    return this._parent;
},

/**
 * Get an array of child features, or undefined if none.
 */
children: function() {
    return this.get('subfeatures');
},

toJSON: function() {
    const d = Object.assign({},this)
    delete d._parent
    return d
}

});

return GeneFeature;
});