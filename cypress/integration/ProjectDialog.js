/**
 * Tests the project dialog
 */
describe('Select tracks', function() {
    before(function() {
        cy.viewport('macbook-13')
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy
            .server()
            .route({
                method: 'GET',
                url: 'api/v1/mutations?filters=*',
                response: 'fixture:project/mutations.json'
              })
            .route({
                method: 'GET',
                url: 'api/v1/genes?filters=*',
                response: 'fixture:project/genes.json'
            })
            .route({
                method: 'GET',
                url: 'api/v1/mutations/MU4781079?field=occurences&from=1&size=0',
                response: 'fixture:project/mutation.json'
            })
            .route({
                method: 'GET',
                url: 'api/v1/genes/ENSG00000075151',
                response: 'fixture:project/gene.json'
            })

        cy.wait(1000) // Wait for load
    })

    it('Should be able to view projects', function() {
        // Open track menu
        cy.get('#dropdownbutton_icgc').type('{enter}')
        cy.contains('Explore Projects').click()

        // Check that projects viewer is opened and has expected content
        cy.contains('View projects available on the ICGC Data Portal')
        cy.contains('BRCA-US')
        cy.get('.results-table').should('be.visible')

        // Add SSM and Gene track for project BRCA-US (assume first in list)
        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('SSMs for Project').click()

        cy.get('#dijit_form_ComboButton_0_arrow').should('be.visible').type('{enter}')
        cy.contains('Genes for Project').click()

        // Go to next page and ensure pagination works (assume PRAD-CA on second page)
        cy.contains('Next').click()
        cy.contains('PRAD-CA')

        cy.contains('ICGC Project Browser').parent().within(() => {
            cy.get('.dijitDialogCloseIcon').click()
        })

        // Tracks should be added for project BRCA-US
        cy.contains('ICGC_SimpleSomaticMutations_BRCA-US')
        cy.contains('ICGC_Genes_BRCA-US')
        
        cy.wait(1000)


        cy.get('.track_icgc_viewer_view_track_ssmtrack').within(() => {
            cy.get('.feature').eq(30).click()
        })

        cy.get('.popup-dialog').within(() => {
            cy.contains('MU4781079')
            cy.contains('C>G')
            cy.contains('single base substitution')
            cy.contains('DDI2')
            cy.contains('L138V')
            cy.contains('missense variant')
            cy.contains('412C>G')

            cy.contains('BRCA-US')
            cy.contains('Breast')
            cy.contains('1 / 1020 (0.10%)')

            cy.get('.dijitDialogCloseIcon').click()
        })

        cy.get('.track_icgc_viewer_view_track_genetrack').within(() => {
            cy.get('.feature').eq(30).click()
        })

        cy.get('.popup-dialog').within(() => {
            cy.contains('eukaryotic translation initiation factor 4 gamma, 3')
            cy.contains('ENSG00000075151')
            cy.contains('EIF4G3')
            cy.contains('protein_coding')
            cy.contains('8672')
            cy.contains('3298')
            cy.contains('603929')
            cy.contains('O43432')
            cy.contains('The protein encoded by this gene is thought to be part of the eIF4F protein complex')

            cy.get('.dijitDialogPaneContent').scrollTo('bottom')

            cy.contains('Immune System')
            cy.contains('ISG15 antiviral mechanism')
            cy.contains('translation factor activity, RNA binding')

            cy.get('.dijitDialogCloseIcon').click()
        })

        // // Check detail view (assume MU4757886)
        // // NOTE: This is dependant on the screen size
        // cy.get("canvas.static-canvas").eq(0).click(70, 75)
        // cy.get('.popup-dialog').within(() => {
        //     cy.contains('MU4757886')
        //     cy.contains('G>A')
        //     cy.contains('single base substitution')
        //     cy.contains('DRAXIN')
        //     cy.contains('E166K')
        //     cy.contains('BRCA-US')
        //     cy.contains('Breast cancer')

        //     cy.get('.dijitDialogCloseIcon').click()
        // })

        // // Check detail view (assume ENSG00000130940)
        // // NOTE: This is dependant on the screen size
        // cy.get("canvas.static-canvas").eq(1).click(50, 75)
        // cy.get('.popup-dialog').within(() => {
        //     cy.contains('The protein encoded by this gene is a zinc finger transcription factor.');
        //     cy.contains('ENSG00000130940')
        //     cy.contains('CASZ1')
        //     cy.contains('protein_coding')
        //     cy.contains('castor zinc finger 1')
        //     cy.contains('54897')
        //     cy.contains('26002')
        //     cy.contains('609895')
        //     cy.contains('Q86V15')
        //     cy.get('.dijitDialogPaneContent').eq(1).scrollTo('bottom')
        //     cy.contains('GO Term')
        //     cy.contains('metal ion binding')
        //     cy.get('.dijitDialogCloseIcon').eq(1).click()
        // })
    })
})