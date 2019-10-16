// Tests the exporting of SSM tracks
describe('Select tracks', function() {
    before(function() {
        cy.viewport('macbook-13')
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy.wait(10000)

        // Open track menu
        cy.contains('Select').click()

        // Add existing tracks
        cy.get('#trackSelectGrid_rowSelector_2').click()

        // Close track menu
        cy.contains('Back to browser').click()

        // Gene track should be added
        cy.contains('ICGC_Mutations')
    })

    /**
     * Checks that export of a particular type works
     * @param {*} radioIndex Index of export checkbox
     * @param {*} exportType Name of export type
     * @param {*} textValues Values to check for in export
     */
    var testExport = function (radioIndex, exportType, textValues) {
        cy.get('.track-menu-button').eq(1).click()
        cy.contains('Save track data').click()
        cy.contains(exportType)
        cy.get('.dijitCheckBoxInput').eq(radioIndex).click()

        cy.get('.dijitIconTask').click()
        for (var text of textValues) {
            cy.get('textarea').should('to.include.value', text)
        }
        cy.contains('Close').click()
    }

    // Tests the exporting feature for ssms
    // Assumption: loc=1%3A1..248956422
    it('Should be able to export SSMs in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region', 'single base substitution'])
        testExport(3, 'BED', ['track name="ICGC_Mutations" useScore=0', '1	115256528	115256528	MU68272'])
        testExport(4, 'CSV', ['type,start,end,strand,id,allele in the reference assembly,mutation,reference genome assembly', 'single base substitution,115256528,115256528,,,T,T>C,GRCh37'])
        testExport(5, 'Sequin Table', ['>Feature 1', '115256529	115256528	single base substitution'])
        testExport(6, 'Track Config', 
        [
            `[tracks.ICGC_Mutations]
storeClass=icgc-viewer/Store/SeqFeature/SimpleSomaticMutations
type=icgc-viewer/View/Track/SSMTrack
key=ICGC_Mutations
metadata.datatype=SimpleSomaticMutations
unsafePopup=true
size=500
filters={"mutation":{"location":{"is":["1:0-248956422"]}}}`
        ])
        testExport(7, 'Track Config JSON', 
        [
`{
\t"label": "ICGC_Mutations",
\t"storeClass": "icgc-viewer/Store/SeqFeature/SimpleSomaticMutations",
\t"type": "icgc-viewer/View/Track/SSMTrack",
\t"key": "ICGC_Mutations",
\t"metadata": {
\t\t"datatype": "SimpleSomaticMutations"
\t},
\t"unsafePopup": true,
\t"size": 500,
\t"filters": "{\\"mutation\\":{\\"location\\":{\\"is\\":[\\"1:0-248956422\\"]}}}"
}`
        ])
    })

    it('Should be able to export an SSM track', function() {
        cy.get('.track-menu-button').eq(1).click()
        cy.contains('Share Track as URL').click()
        cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..194440331&tracks=DNA%2CICGC_Mutations&highlight=&addTracks=%5B%7B%22label%22%3A%22ICGC_Mutations%22%2C%22storeClass%22%3A%22icgc-viewer%2FStore%2FSeqFeature%2FSimpleSomaticMutations%22%2C%22type%22%3A%22icgc-viewer%2FView%2FTrack%2FSSMTrack%22%2C%22key%22%3A%22ICGC_Mutations%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22SSM%22%7D%2C%22unsafePopup%22%3Atrue%7D%5D')
    })
})