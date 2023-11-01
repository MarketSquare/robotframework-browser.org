describe('My First Test', () => {
    it('Gets, types and asserts', () => {
      cy.visit('https://example.cypress.io')
      cy.contains('type').click()
      cy.url().should('include', '/commands/actions')
      cy.get('.action-email').type('fake@email.com')
      cy.get('.action-email').should('have.value', 'fake@email.com')
    })
  })