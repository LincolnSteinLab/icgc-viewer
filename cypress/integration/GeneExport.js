// Tests the exporting of gene tracks
describe('Select tracks', function() {
    before(function() {
        cy.viewport('macbook-13')
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')

        // Open track menu
        cy.contains('Select').click()

        // Add existing tracks
        cy.get('#trackSelectGrid_rowSelector_1').click()

        // Close track menu
        cy.contains('Back to browser').click()

        // Gene track should be added
        cy.contains('ICGC_Genes')
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

    // Tests the exporting feature for genes
    // Assumption: loc=1%3A1..248956422
    it('Should be able to export genes in various export formats', function() {
        testExport(2, 'GFF3', ['##gff-version 3', '##sequence-region', 'protein_coding'])
        testExport(3, 'BED', ['track name="ICGC_Genes" useScore=0', '1	103342022	103574051	ENSG00000060718		-'])
        testExport(4, 'CSV', ['type,start,end,strand,id,gene name,biotype,symbol,type', 'protein_coding,103342022,103574051,-1,,collagen, type XI, alpha 1,,COL11A1,protein_coding'])
        testExport(5, 'Sequin Table', ['>Feature 1', '237205505	237997287	protein_coding'])
        testExport(6, 'Track Config', 
        [
            `[tracks.ICGC_Genes]
storeClass=icgc-viewer/Store/SeqFeature/Genes
type=icgc-viewer/View/Track/GeneTrack
key=ICGC_Genes
metadata.datatype=Genes
unsafePopup=true
size=1000
filters={"gene":{"location":{"is":["1:0-248956422"]}}}`
        ])
        testExport(7, 'Track Config JSON', 
        [
`{
\t"label": "ICGC_Genes",
\t"storeClass": "icgc-viewer/Store/SeqFeature/Genes",
\t"type": "icgc-viewer/View/Track/GeneTrack",
\t"key": "ICGC_Genes",
\t"metadata": {
\t\t"datatype": "Genes"
\t},
\t"unsafePopup": true,
\t"size": 1000,
\t"filters": "{\\"gene\\":{\\"location\\":{\\"is\\":[\\"1:0-248956422\\"]}}}"
}`
        ])
    })

    it('Should be able to export an Gene track', function() {
        cy.get('.track-menu-button').eq(1).click()
        cy.contains('Share Track as URL').click()
        cy.get('textarea').should('have.value', 'http://localhost:3000/?loc=1%3A1..194440331&tracks=DNA%2CICGC_Genes&highlight=&addTracks=%5B%7B%22label%22%3A%22ICGC_Genes%22%2C%22storeClass%22%3A%22icgc-viewer%2FStore%2FSeqFeature%2FGenes%22%2C%22type%22%3A%22icgc-viewer%2FView%2FTrack%2FGeneTrack%22%2C%22key%22%3A%22ICGC_Genes%22%2C%22metadata%22%3A%7B%22datatype%22%3A%22Gene%22%7D%2C%22unsafePopup%22%3Atrue%7D%5D')
    })
})