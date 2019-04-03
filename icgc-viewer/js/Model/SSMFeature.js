/**
 * Simple implementation of an SSM feature object.
 */
define([
    'JBrowse/Util',
    'dojo/request'
   ],
   function( Util, request ) {

var counter = 0;

var SSMFeature = Util.fastDeclare({

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
        this._parent ? this._parent.id()+'_'+(counter++) : 'SSMFeature_'+(counter++)
    );

    // inflate any subfeatures that are not already feature objects
    var subfeatures;
    if(( subfeatures = this.data.subfeatures )) {
        for( var i = 0; i < subfeatures.length; i++ ) {
            if( typeof subfeatures[i].get != 'function' ) {
                subfeatures[i] = new SSMFeature(
                    { data: subfeatures[i],
                      parent: this
                    });
            }
        }
    }
},

projects: undefined,

/**
 * Get a piece of data about the feature.  All features must have
 * 'start' and 'end', but everything else is optional.
 */
get: function(name) {
    var thisB = this;
    if (name == 'projects') {
        var mutationId = this.data[name.toLowerCase()];

        // Find projects related to the current mutation
        var url = encodeURI('https://dcc.icgc.org/api/v1/mutations/' + mutationId + '?field=occurences&from=1&size=0');
        request(url, {
            method: 'get',
            headers: { 'X-Requested-With': null },
            handleAs: 'json'
        }).then(function(mutationResponse) {
            // Create an object holding all project information
            thisB.projects = {}
            for (project of mutationResponse.occurrences) {
                thisB.projects[project.projectId] = project.project;
            }

            // Find counts of affected donors for each project
            var projectArray = Object.keys(thisB.projects);
            var url = encodeURI('https://dcc.icgc.org/api/v1/projects/' + projectArray + '/mutations/' + mutationId + '/donors/counts');
            return request(url, {
                method: 'get',
                headers: { 'X-Requested-With': null },
                handleAs: 'json'
            })
        }).then(function(response) {
            document.getElementById('projects-icgc-' + mutationId).innerHTML = thisB.createProjectIncidenceTable(thisB.projects, response, mutationId);
        }).catch(function(err) {
            console.log(err)
            document.getElementById('projects-icgc-' + mutationId).innerHTML = 'Error creating projects table';
        });
        return mutationId;
    } else {
        return this.data[ name.toLowerCase() ];
    }
},
/**
 * Creates a table of projects and their associated tumour type and incidence rate for the given mutation
 * @param {object} projects Object of the form projectId -> projectObject
 * @param {object} projectCounts Occurrence count for each project given the mutationId
 * @param {string} mutationId ICGC ID for the mutation
 */
createProjectIncidenceTable: function(projects, projectCounts, mutationId) {
    var thStyle = 'border: 1px solid #e6e6e6; padding: .2rem .2rem;';
    var headerRow = `
        <tr style=\"background-color: #f2f2f2\">
            <th style="${thStyle}">Project</th>
            <th style="${thStyle}">Site</th>
            <th style="${thStyle}">Tumour Type</th>
            <th style="${thStyle}">Tumour Subtype</th>
            <th style="${thStyle}"># Donors Affected</th> 
        </tr>
    `;

    var projectTable = '<table style="width: 560px; border-collapse: \'collapse\'; border-spacing: 0;">' + headerRow;

    var count = 0;
    Object.keys(projects).forEach(project => {
        var trStyle = '';
        if (count % 2 != 0) {
            trStyle = 'style=\"background-color: #f2f2f2\"';
        }
        var projectRow = `<tr ${trStyle}>
            <td style="${thStyle}">${this.createLinkWithId('https://dcc.icgc.org/projects/', project)}</td>
            <td style="${thStyle}">${this.prettyValue(projects[project].primarySite)}</td>
            <td style="${thStyle}">${this.prettyValue(projects[project].tumourType)}</td>
            <td style="${thStyle}">${this.prettyValue(projects[project].tumourSubtype)}</td>
            <td style="${thStyle}">${this.prettyValue(projectCounts[project][mutationId]) + ' / ' + projects[project].ssmTestedDonorCount} (${((projectCounts[project][mutationId] / projects[project].ssmTestedDonorCount) * 100).toFixed(2)}%)</td>
            </tr>
        `;

        projectTable += projectRow;
        count++;
    });

    projectTable += '</table>';
    return projectTable;

},

/**
 * If a value is undefined, returns n/a, else return value
 * @param {string} value Value to make pretty
 */
prettyValue: function(value) {
    return value ? value : 'n/a';
},

/**
 * Creates a link to a given ID
 * @param {string} link Base URL for link
 * @param {string} id ID to apped to base URL
 */
createLinkWithId: function(link, id) {
    return id ? "<a href='" + link + id + "' target='_blank'>" + id + "</a>" : "n/a";
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

return SSMFeature;
});