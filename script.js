const DATA_URL = document.body.dataset.cuisine ? '../data/recipes.json' : 'data/recipes.json';
const FAVORITES_KEY = 'global-kitchen-favorites';
let recipeData;

window.addEventListener('DOMContentLoaded', async () => {
    try {
        recipeData = await fetch(DATA_URL).then((response) => {
            if (!response.ok) throw new Error(`Recipe data request failed: ${response.status}`);
            return response.json();
        });
        updateFavoriteCount();
        renderHome();
        renderCuisinePage();
        renderFavorites();
        setupSearch();
        setupNewsletterForm();
    } catch (error) {
        console.error(error);
        const target = document.querySelector('#cuisine-grid, #dish-grid');
        if (target) target.innerHTML = '<p class="empty-state">Recipes are temporarily unavailable. Please try again from a local web server.</p>';
    }
});

function allRecipes() {
    return Object.entries(recipeData.cuisines).flatMap(([cuisineId, cuisine]) => cuisine.recipes.map((recipe) => ({ ...recipe, cuisineId, cuisineName: cuisine.name })));
}

function renderHome() {
    const grid = document.getElementById('cuisine-grid');
    if (!grid) return;
    grid.innerHTML = Object.entries(recipeData.cuisines).map(([id, cuisine]) => `
        <a class="cuisine-card" data-search="${escapeAttribute(`${cuisine.name} ${cuisine.description} ${cuisine.recipes.map((recipe) => recipe.name).join(' ')}`)}" href="Pages/${id}.html">
            <img src="${imagePath(cuisine.image)}" alt="${escapeAttribute(cuisine.name)} cuisine" loading="lazy">
            <div class="cuisine-card-copy"><span class="card-index">0${Object.keys(recipeData.cuisines).indexOf(id) + 1}</span><h3>${escapeHtml(cuisine.name)}</h3><p>${escapeHtml(cuisine.description)}</p><span class="card-link">${cuisine.recipes.length} recipes <span aria-hidden="true">&#8594;</span></span></div>
        </a>`).join('');
}

function renderCuisinePage() {
    const cuisineId = document.body.dataset.cuisine;
    const grid = document.getElementById('dish-grid');
    if (!cuisineId || !grid) return;
    const cuisine = recipeData.cuisines[cuisineId];
    if (!cuisine) return;
    document.title = `${cuisine.name} Recipes | Global Kitchen`;
    document.getElementById('cuisine-title').textContent = cuisine.title;
    document.getElementById('cuisine-description').textContent = cuisine.description;
    grid.innerHTML = cuisine.recipes.map((recipe) => recipeCard(recipe, cuisine.name)).join('');
    setupRecipeButtons();
    addRecipeSchema(cuisine.recipes, cuisine.name);
}

function recipeCard(recipe, cuisineName) {
    const favorite = getFavorites().includes(recipe.id);
    const videoUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.videoQuery)}`;
    return `<article class="dish-card" data-search="${escapeAttribute(`${recipe.name} ${recipe.ingredients.join(' ')} ${recipe.context} ${cuisineName}`)}">
        <img src="${imagePath(recipe.image)}" alt="${escapeAttribute(recipe.name)}" loading="lazy">
        <div class="dish-card-body"><div class="card-topline"><span>${escapeHtml(cuisineName)}</span><button class="favorite-btn ${favorite ? 'is-saved' : ''}" type="button" data-favorite-id="${recipe.id}" aria-label="${favorite ? 'Remove' : 'Save'} ${escapeAttribute(recipe.name)}" aria-pressed="${favorite}">${favorite ? '&#9733;' : '&#9734;'}</button></div>
        <h2>${escapeHtml(recipe.name)}</h2><p class="ingredients"><strong>Ingredients:</strong> ${escapeHtml(recipe.ingredients.join(', '))}</p>
        <div class="recipe-meta"><span>${escapeHtml(recipe.prepTime)} prep</span><span>${escapeHtml(recipe.cookTime)} cook</span><span>${escapeHtml(recipe.servings)} servings</span></div>
        <div class="badges">${recipe.diet.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}<span>${escapeHtml(recipe.difficulty)}</span><span>${escapeHtml(recipe.spice)} spice</span></div>
        <button class="recipe-btn" type="button" data-recipe-id="${recipe.id}" aria-expanded="false" aria-controls="${recipe.id}-details">View recipe <span aria-hidden="true">&#8594;</span></button>
        <div class="recipe-details" id="${recipe.id}-details" hidden><p class="context">${escapeHtml(recipe.context)}</p><h3>Preparation</h3><ol>${recipe.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><div class="video-section"><h3>Video tutorial</h3><a class="video-link" href="${videoUrl}" target="_blank" rel="noopener noreferrer">Find a ${escapeAttribute(recipe.name)} tutorial on YouTube <span aria-hidden="true">&#8599;</span></a></div></div></div>
    </article>`;
}

function setupRecipeButtons() {
    document.querySelectorAll('.recipe-btn').forEach((button) => button.addEventListener('click', () => {
        const details = document.getElementById(`${button.dataset.recipeId}-details`);
        const open = !details.hidden;
        details.hidden = open;
        button.setAttribute('aria-expanded', String(!open));
        button.innerHTML = open ? 'View recipe <span aria-hidden="true">&#8594;</span>' : 'Hide recipe <span aria-hidden="true">&#8593;</span>';
    }));
    document.querySelectorAll('.favorite-btn').forEach((button) => button.addEventListener('click', () => toggleFavorite(button.dataset.favoriteId)));
}

function setupSearch() {
    const input = document.getElementById('search-bar');
    if (!input) return;
    input.addEventListener('input', debounce(() => {
        const query = input.value.trim().toLowerCase();
        const cards = document.querySelectorAll('[data-search]');
        let matches = 0;
        cards.forEach((card) => {
            const match = !query || card.dataset.search.toLowerCase().includes(query);
            card.hidden = !match;
            if (match) matches += 1;
        });
        const noResults = document.getElementById('no-results');
        if (noResults) noResults.hidden = matches !== 0;
    }, 180));
}

function toggleFavorite(id) {
    const favorites = getFavorites();
    const next = favorites.includes(id) ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    updateFavoriteCount();
    document.querySelectorAll(`[data-favorite-id="${CSS.escape(id)}"]`).forEach((button) => {
        const saved = next.includes(id);
        button.classList.toggle('is-saved', saved);
        button.setAttribute('aria-pressed', String(saved));
        button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${id}`);
        button.innerHTML = saved ? '&#9733;' : '&#9734;';
    });
    renderFavorites();
}

function renderFavorites() {
    const grid = document.getElementById('favorite-grid');
    if (!grid || !recipeData) return;
    const favorites = getFavorites();
    const recipes = allRecipes().filter((recipe) => favorites.includes(recipe.id));
    grid.innerHTML = recipes.map((recipe) => recipeCard(recipe, recipe.cuisineName)).join('');
    const empty = document.getElementById('empty-favorites');
    if (empty) empty.hidden = recipes.length > 0;
    if (grid.children.length) setupRecipeButtons();
}

function addRecipeSchema(recipes, cuisineName) {
    const schema = recipes.map((recipe) => ({ '@type': 'Recipe', name: recipe.name, description: recipe.context, recipeCuisine: cuisineName, recipeCategory: 'Main course', prepTime: isoDuration(recipe.prepTime), cookTime: isoDuration(recipe.cookTime), recipeYield: `${recipe.servings} servings`, recipeIngredient: recipe.ingredients, recipeInstructions: recipe.steps.map((text) => ({ '@type': 'HowToStep', text })), image: new URL(imagePath(recipe.image), window.location.href).href, video: { '@type': 'VideoObject', name: `${recipe.name} tutorial`, contentUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.videoQuery)}` } }));
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': schema });
    document.head.appendChild(script);
}

function isoDuration(value) {
    const hours = value.match(/(\d+) hour/);
    const minutes = value.match(/(\d+) min/);
    return `PT${hours ? `${hours[1]}H` : ''}${minutes ? `${minutes[1]}M` : ''}` || 'PT0M';
}

function getFavorites() {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}

function updateFavoriteCount() {
    const count = document.getElementById('favorite-count');
    if (count) count.textContent = getFavorites().length;
}

function setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        document.getElementById('newsletter-status').textContent = 'You are on the list. Watch your inbox for the next dish.';
        form.reset();
    });
}

function imagePath(path) { return document.body.dataset.cuisine ? `../${path}` : path; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
function escapeAttribute(value) { return escapeHtml(value); }
function debounce(callback, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); }; }
