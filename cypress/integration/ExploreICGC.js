/**
 * Tests the explore dialog
 */
describe('Select tracks from explore', function() {
    before(function() {
        cy.viewport('macbook-13')
        cy.visit('http://localhost:3000/?loc=1%3A1..248956422')
        cy.wait(1000) // Wait for load
        cy.get('#dropdownbutton_icgc').type('{enter}')
        cy.contains('Explore donors, genes and mutations').click()
    })

    var selectFacetTab = function (tabIndex, optionIndex, checkBoxIndex) {
        cy.get('.dijitTabListWrapper').eq(0).within(() => {
            cy.get('.dijitTab').eq(tabIndex).click()
        })

        cy.get('.dijitTabContainerTopChildWrapper.dijitVisible').eq(0).within(() => {
            cy.get('.dijitAccordionTitle').eq(optionIndex).click()
            cy.get('.dijitAccordionChildWrapper').eq(optionIndex).within(() => {
                cy.get('.dijitCheckBox').eq(checkBoxIndex).click()
            })
        })
    }

    var selectResultsTab = function (tabIndex) {
        cy.get('.dijitTabListWrapper').eq(1).within(() => {
            cy.get('.dijitTab').eq(tabIndex).click()
        })
    }

    var checkResultsTab = function (textValues) {
        cy.get('.dijitTabContainer').eq(1).within(() => {
            for (var text of textValues) {
                cy.contains(text)
            }
        })
    }

    it('Should be able to explore and apply facets', function() {
        // Select relapse type -> distant recurrence/metastasis
        cy.get('.dijitDialog').within(() => {
            cy.contains('Explore data available on the ICGC Data Portal')
            selectFacetTab(0, 0, 0)
        })

        // Validate donor results
        checkResultsTab(['Showing 1 to 20 of 876', 'DO232224', 'DO229177'])

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(['Showing 1 to 20 of 57,412', 'CSMD1', 'PCDH15'])

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(['Showing 1 to 20 of 11,115,580', 'MU37643', 'MU12519'])

        // Select study - PCAWG
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(0, 4, 0)
        })

        // Validate donor results
        checkResultsTab(['Showing 1 to 20 of 153', 'DO51962', 'DO51493'])

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(['Showing 1 to 20 of 55,957', 'RBFOX1', 'PCDH15'])

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(['Showing 1 to 20 of 1,609,595', 'MU37643', 'MU11602977'])

        // Remove filters
        cy.get('.dijitIconDelete').click()

        // Check that filters are clear
        selectResultsTab(0)
        checkResultsTab(['Showing 1 to 20 of 24,289'])
    })

    it('Should be able to apply filters across data types', function() {
        // Select study - PCAWG
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(0, 4, 0)
        })

        // Validate donor results
        checkResultsTab(['Showing 1 to 20 of 2,809', 'DO220886', 'DO220877'])

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(['Showing 1 to 20 of 57,402', 'CSMD1', 'LRP1B'])

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(['Showing 1 to 20 of 25,129,453', 'MU37643', 'MU12519'])

        // Apply gene filter - type rRNA
        selectResultsTab(0)
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(1, 1, 24)
        })

        // Validate donor results
        checkResultsTab(['Showing 1 to 20 of 1,974', 'DO220877', 'DO220906'])

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(['Showing 1 to 20 of 517', 'RNA5-8SP2', 'RNA5SP272'])

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(['Showing 1 to 20 of 39,868', 'MU9416907', 'MU51522486'])

        // Apply mutation filter - consequence type exon variant
        selectResultsTab(0)
        cy.get('.dijitDialog').within(() => {
            selectFacetTab(2, 5, 1)
        })

        // Validate donor results
        checkResultsTab(['Showing 1 to 20 of 312', 'DO220903', 'DO220913'])

        // Validate gene results
        selectResultsTab(1)
        checkResultsTab(['Showing 1 to 20 of 260', 'RNA5SP406', 'RNA5SP26'])

        // Validate mutation results
        selectResultsTab(2)
        checkResultsTab(['Showing 1 to 20 of 445', 'MU3457350', 'MU33141830'])
    })

    // it('Should be able to add filtered donor data', function() {
    //     cy.get('.dijitDialog').within(() => {
    //         // Check that explore dialog looks correct
    //         cy.contains('Explore data available on the ICGC Data Portal')
    //     })
    // })

    // it('Should be able to add filtered gene data', function() {
    //     cy.get('.dijitDialog').within(() => {
    //         // Check that explore dialog looks correct
    //         cy.contains('Explore data available on the ICGC Data Portal')
    //     })
    // })

    // it('Should be able to add filtered mutation data', function() {
    //     cy.get('.dijitDialog').within(() => {
    //         // Check that explore dialog looks correct
    //         cy.contains('Explore data available on the ICGC Data Portal')
    //     })
    // })
})