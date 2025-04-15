// Wait for DOM content to load before running scripts
document.addEventListener('DOMContentLoaded', () => {
    // Handle page initialization
    initPage();
    
    // Set up navigation and interactive elements
    setupNavigation();
    setupRecipeToggles();
    setupSearch();
    setupNewsletterForm();
    
    // Image handling for better UX
    setupImageHandling();
});

// Initialize page based on current URL
function initPage() {
    // Determine if we're on the home page or a cuisine page
    const isHomePage = !window.location.pathname.includes('/pages/');
    
    if (isHomePage) {
        // Show home section by default on index.html
        showSection('home');
        
        // Add click event for CTA button
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('click', () => showSection('cuisines'));
        }
    }
}

// Setup navigation link functionality
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only handle anchor links on home page
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                // Get the target section ID
                const targetId = this.getAttribute('href').substring(1);
                
                // Show the target section
                showSection(targetId);
                
                // Update active state
                navLinks.forEach(link => link.classList.remove('active'));
                this.classList.add('active');
                
                // Smooth scroll to section
                document.getElementById(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Show a specific section and hide others
function showSection(sectionId) {
    const sections = document.querySelectorAll('main section');
    
    sections.forEach(section => {
        if (section.id === sectionId) {
            section.style.display = sectionId === 'home' ? 'flex' : 'block';
        } else {
            section.style.display = 'none';
        }
    });
}

// Setup recipe toggles
function setupRecipeToggles() {
    const recipeButtons = document.querySelectorAll('.recipe-btn');
    
    recipeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent any default behavior
            const recipeId = this.getAttribute('data-recipe-id');
            if (recipeId) {
                toggleRecipe(recipeId);
            }
        });
    });
}

// Toggle recipe details visibility
function toggleRecipe(id) {
    try {
        const recipe = document.getElementById(id);
        if (!recipe) throw new Error(`Recipe element with ID ${id} not found`);
        
        const button = document.querySelector(`.recipe-btn[data-recipe-id="${id}"]`);
        if (!button) throw new Error(`Button for recipe ID ${id} not found`);

        // Toggle display with a smooth animation
        if (recipe.style.display === 'none' || !recipe.style.display) {
            recipe.style.display = 'block';
            recipe.style.opacity = '0';
            recipe.style.maxHeight = '0';
            
            // Apply transition
            setTimeout(() => {
                recipe.style.transition = 'opacity 0.3s ease, max-height 0.5s ease';
                recipe.style.opacity = '1';
                recipe.style.maxHeight = '500px';
            }, 10);
            
            // Update button text
            button.textContent = 'Hide Recipe';
        } else {
            recipe.style.opacity = '0';
            recipe.style.maxHeight = '0';
            
            // Remove element after transition
            setTimeout(() => {
                recipe.style.display = 'none';
            }, 300);
            
            // Update button text
            button.textContent = 'View Recipe';
        }
    } catch (error) {
        console.error('Error toggling recipe:', error.message);
    }
}

// Setup search functionality
function setupSearch() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) return;
    
    searchBar.addEventListener('input', debounce(function(e) {
        const query = e.target.value.toLowerCase().trim();
        
        // Different search behavior based on page type
        const isHomePage = !window.location.pathname.includes('/pages/');
        
        if (isHomePage) {
            // On home page, search cuisine categories
            searchCuisines(query);
        } else {
            // On cuisine pages, search dishes
            searchDishes(query);
        }
    }, 300));
}

// Search cuisine categories on home page
function searchCuisines(query) {
    const cuisineCards = document.querySelectorAll('.cuisine-card');
    let matchFound = false;
    
    cuisineCards.forEach(card => {
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const description = card.querySelector('p')?.textContent.toLowerCase() || '';
        
        if (query === '' || name.includes(query) || description.includes(query)) {
            card.style.display = 'flex';
            matchFound = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    displaySearchResults(matchFound, query);
}

// Search dishes on cuisine pages
function searchDishes(query) {
    const dishCards = document.querySelectorAll('.dish-card');
    let matchFound = false;
    
    dishCards.forEach(card => {
        const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
        const ingredients = card.querySelector('p')?.textContent.toLowerCase() || '';
        
        if (query === '' || name.includes(query) || ingredients.includes(query)) {
            card.style.display = 'block';
            matchFound = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    displaySearchResults(matchFound, query);
}

// Display search results status
function displaySearchResults(matchFound, query) {
    // Only show message if query isn't empty
    if (query) {
        const resultsContainer = document.querySelector('.dish-grid, .cuisine-grid');
        let noResultsMsg = document.getElementById('no-results');
        
        if (!matchFound) {
            if (!noResultsMsg) {
                noResultsMsg = document.createElement('p');
                noResultsMsg.id = 'no-results';
                noResultsMsg.style.textAlign = 'center';
                noResultsMsg.style.gridColumn = '1 / -1';
                noResultsMsg.style.padding = '20px';
                resultsContainer.appendChild(noResultsMsg);
            }
            noResultsMsg.textContent = `No results found for "${query}".`;
        } else if (noResultsMsg) {
            noResultsMsg.remove();
        }
    }
}

// Setup newsletter form
function setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = this.querySelector('input[type="email"]').value;
        
        // Simulate form submission
        const button = this.querySelector('button');
        const originalText = button.textContent;
        
        button.disabled = true;
        button.textContent = 'Submitting...';
        
        // Simulate API call
        setTimeout(() => {
            alert(`Thank you! ${email} has been subscribed to our newsletter.`);
            this.reset();
            button.disabled = false;
            button.textContent = originalText;
        }, 1000);
    });
}

// Setup image handling for better user experience
function setupImageHandling() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
        // Add loading attribute if not present
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
        
        // Handle image errors
        img.onerror = () => {
            console.error(`Failed to load image: ${img.src}`);
            img.alt = 'Image not available';
            img.src = img.src.includes('../') ? '../images/placeholder.jpg' : 'images/placeholder.jpg';
            img.style.background = '#f0f0f0';
        };
    });
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}