describe('Smoke Test', () => {
  it('verifies that each pach and component is present and working', () => {
    // Start
    cy.visit('http://localhost:3000/');
    cy.wait(1000); // Wait for redirection to complete
    cy.url().should('include', '/login');

    // Briefly check registration page
    cy.get('a[href="/signup"]').should('exist');
    cy.get('a[href="/signup"]').click();
    cy.url().should('include', '/signup');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('input[placeholder="First Name"]').should('exist');
    cy.get('input[placeholder="Last Name"]').should('exist');
    cy.get('button[type="submit"]').should('exist');

    // Login 
    cy.get('a[href="/login"]').should('exist');
    cy.get('a[href="/login"]').click();
    cy.url().should('include', '/login');
    cy.get('input[type="email"]').type('fake@gmail.com');
    cy.get('input[type="password"]').type('123456');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Verify dashboard content
    cy.contains('Welcome to Shared Roots.');
    cy.get('a[href="/dashboard"]').should('exist');
    cy.get('a[href="/familytree"]').should('exist');
    cy.get('aside button:has(img[alt="Inbox"])').should('exist');
    cy.get('aside button:has(img[alt="avatar image"])').should('exist');

    // Verify inbox works
    cy.get('aside button:has(img[alt="Inbox"])').click();

    cy.get('div.fixed.inset-0.z-50').within(() => {
      cy.contains('Inbox').should('be.visible');
      cy.contains('button', 'View Pending').should('be.visible');
      cy.contains('Pending Invitations').should('be.visible');

      cy.contains('button', 'View Archived').should('be.visible');
      cy.contains('button', 'View Archived').click();
      cy.contains('Archived Invitations').should('be.visible');

      cy.contains('button', 'Invite').should('be.visible');
      cy.contains('button', 'Invite').click();
      cy.contains('Invite a User').should('be.visible');
      cy.get('button:has(img[alt="Close Inbox"])').click();

    });

    cy.contains('button', 'Select Family').should('exist').click();
    cy.get('ul').contains('button', '+ Create Family').click();
    cy.get('input[placeholder="Family Name"]').should('exist');
    cy.contains('h2', 'Create Family').should('be.visible');
    cy.contains('button', 'Create').should('be.visible');
    cy.contains('button', 'Cancel').should('be.visible');
    cy.contains('button', 'Cancel').click();

    // Select a family
    cy.contains('button', 'Select Family').should('exist').click();
    cy.get('ul').contains('button', 'fake family').click();
    cy.contains('Users').should('be.visible');
    cy.contains('Username').should('be.visible');
    cy.contains('Role').should('be.visible');
    cy.contains('Modify').should('be.visible');
    cy.contains('Real Boy').should('be.visible');
    cy.contains('John Doe').should('be.visible');

    // Verify family tree link
    cy.get('aside a[href="/familytree"]').click();
    cy.wait(1000); // Wait for the family tree page to load
    cy.url().should('include', '/familytree');

    // Open form to add a family member
    
    
    // Back to Dashboard
    cy.contains('a[href="/dashboard"]', 'Dashboard').click();
    cy.url().should('include', '/dashboard');

    // Logout
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/login');
  });

  /*
  it('E2E user registration, family creation, and user invitation', () => {
    cy.visit('http://localhost:3000');
    cy.wait(1000); // Wait for redirect
    cy.url().should('include', '/login');
    cy.get('a[href="/signup"]').should('exist');
    cy.get('a[href="/signup"]').click();
    cy.url().should('include', '/signup');

    cy.get('input[type="email"]').type('cypresstest@gmail.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('input[placeholder="First Name"]').type('New');
    cy.get('input[placeholder="Last Name"]').type('User');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');

    // Create a family
    cy.get('select[placeholder="Select Family"]').select('+ Create Family');
    cy.get('input[placeholder="Family Name"]').type('Cypress Family');
    cy.contains('button', 'Create Family').click();
    cy.wait(1000); // Wait for the family creation to complete
    
    // Verify family creation
    cy.get('select[placeholder="Select Family"]').select('Cypress Family');
    cy.contains('Users').should('be.visible');
    cy.contains('Username').should('be.visible');
    cy.contains('Role').should('be.visible');
    cy.contains('Modify').should('be.visible');
    cy.get('a[href="/familytree"]').should('exist');
    cy.get('a[href="/familytree"]').click();
    cy.url().should('include', '/familytree');

    // Add a relative to the tree - TODO

  });*/
});

