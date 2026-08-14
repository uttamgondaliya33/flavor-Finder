// =============================
// Security: XSS Protection
// =============================
function escapeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =============================
// Variables & Helpers
// =============================
var categoriesSection = document.querySelector(".categories");

function getFavorites() {
    try {
        var data = JSON.parse(localStorage.getItem("flavorFinderFavs"));
        return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
}
function saveFavorites(data) {
    try { localStorage.setItem("flavorFinderFavs", JSON.stringify(data)); } catch (e) {}
}

// =============================
// Category Click
// =============================
document.querySelectorAll(".category-card").forEach(function(card) {
    card.addEventListener("click", function() {
        fetchAndShowCategory(card.dataset.category);
    });
});

async function fetchAndShowCategory(category) {
    categoriesSection.innerHTML = '<h2 style="text-align:center;padding:80px 0;color:#999;"><i class="fa-solid fa-spinner fa-spin" style="font-size:30px;display:block;margin-bottom:15px;color:#ff6b35;"></i>Loading ' + escapeHTML(category) + ' recipes...</h2>';
    try {
        var response = await fetch("https://dummyjson.com/recipes/meal-type/" + category);
        var data = await response.json();
        showCategoryRecipes(data.recipes, category);
    } catch (error) {
        categoriesSection.innerHTML = '<h2 style="text-align:center;padding:80px 0;color:#e74c3c;">Failed to load recipes.</h2><div style="text-align:center;margin-bottom:40px;"><button class="back-btn" onclick="goBack()"><i class="fa-solid fa-arrow-left"></i> Back to Categories</button></div>';
    }
}

function showCategoryRecipes(recipes, category) {
    var cardsHTML = "";
    if (recipes.length === 0) {
        cardsHTML = '<h2 style="text-align:center;grid-column:1/-1;padding:60px 0;">No recipes found for ' + escapeHTML(category) + ' 😔</h2>';
    } else {
        recipes.forEach(function(recipe) {
            cardsHTML +=
                '<div class="cat-recipe-card">' +
                    '<img src="' + recipe.image + '" alt="' + escapeHTML(recipe.name) + '">' +
                    '<div class="cat-card-content">' +
                        '<h3>' + escapeHTML(recipe.name) + '</h3>' +
                        '<p>' + escapeHTML(recipe.cuisine) + '</p>' +
                        '<div class="cat-card-info">' +
                            '<span>⭐ ' + recipe.rating + '</span>' +
                            '<span>' + escapeHTML(recipe.difficulty) + '</span>' +
                            '<span>🕐 ' + (recipe.prepTimeMinutes + recipe.cookTimeMinutes) + ' min</span>' +
                        '</div>' +
                        '<button class="cat-view-btn" data-id="' + recipe.id + '">View Recipe</button>' +
                    '</div>' +
                '</div>';
        });
    }

    categoriesSection.innerHTML =
        '<div class="cat-header">' +
            '<button class="back-btn" onclick="goBack()"><i class="fa-solid fa-arrow-left"></i> Back</button>' +
            '<h1>' + escapeHTML(category.charAt(0).toUpperCase() + category.slice(1)) + ' Recipes 🍴</h1>' +
            '<p>' + recipes.length + ' delicious ' + escapeHTML(category) + ' recipes found</p>' +
        '</div>' +
        '<div class="cat-recipes-grid">' + cardsHTML + '</div>';

    document.querySelectorAll(".cat-view-btn").forEach(function(btn) {
        btn.addEventListener("click", function() { openRecipeModal(btn.dataset.id); });
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
    categoriesSection.innerHTML =
        '<h1>Browse By Categories 🍴</h1><p>Choose your favorite category and discover delicious recipes.</p>' +
        '<div class="category-card" data-category="breakfast"><img src="images/breakfast.jpg"><h3>Breakfast</h3></div>' +
        '<div class="category-card" data-category="lunch"><img src="images/lunch.jpg"><h3>Lunch</h3></div>' +
        '<div class="category-card" data-category="dinner"><img src="images/dinner.jpg"><h3>Dinner</h3></div>' +
        '<div class="category-card" data-category="dessert"><img src="images/dessert.jpg"><h3>Dessert</h3></div>' +
        '<div class="category-card" data-category="snack"><img src="images/snacks.jpg"><h3>Snacks</h3></div>';
    
    document.querySelectorAll(".category-card").forEach(function(card) {
        card.addEventListener("click", function() { fetchAndShowCategory(card.dataset.category); });
    });
}

// =============================
// Modal
// =============================
var catModalOverlay = null;
function createCatModal() {
    if (catModalOverlay) return;
    catModalOverlay = document.createElement("div");
    catModalOverlay.className = "cat-modal-overlay";
    catModalOverlay.innerHTML =
        '<div class="cat-modal-content"><button class="cat-modal-close" id="catModalClose"><i class="fa-solid fa-xmark"></i></button>' +
        '<div class="cat-modal-image"><img id="catModalImg" src="" alt=""><div class="cat-modal-badges"><span class="cat-badge" id="catModalDifficulty"></span><span class="cat-badge" id="catModalMealType"></span></div></div>' +
        '<div class="cat-modal-body" id="catModalBody"></div></div>';
    document.body.appendChild(catModalOverlay);
    document.getElementById("catModalClose").addEventListener("click", closeCatModal);
    catModalOverlay.addEventListener("click", function(e) { if (e.target === catModalOverlay) closeCatModal(); });
    document.addEventListener("keydown", function(e) { if (e.key === "Escape") closeCatModal(); });
}
function closeCatModal() { if (!catModalOverlay) return; catModalOverlay.classList.remove("active"); document.body.style.overflow = ""; }

function openRecipeModal(id) {
    createCatModal();
    catModalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
    var body = document.getElementById("catModalBody");
    body.innerHTML = '<h2 style="text-align:center;padding:60px 0;color:#999;"><i class="fa-solid fa-spinner fa-spin" style="font-size:30px;display:block;margin-bottom:15px;color:#ff6b35;"></i>Loading Recipe...</h2>';
    document.getElementById("catModalImg").src = "";
    document.querySelector(".cat-modal-badges").innerHTML = "";
    fetch("https://dummyjson.com/recipes/" + id).then(function(res) { return res.json(); }).then(function(r) { populateCatModal(r); }).catch(function() { body.innerHTML = '<h2 style="text-align:center;padding:60px 0;color:#e74c3c;">Failed to load recipe.</h2>'; });
}

function populateCatModal(r) {
    var recipeId = String(r.id);
    document.getElementById("catModalImg").src = r.image;
    document.getElementById("catModalImg").alt = escapeHTML(r.name);
    document.querySelector(".cat-modal-badges").innerHTML = '<span class="cat-badge">' + escapeHTML(r.difficulty) + '</span><span class="cat-badge">' + escapeHTML(r.mealType[0]) + '</span>';
    
    var isFav = getFavorites().some(function(fav) { return String(fav.id) === recipeId; });
    var ingredientsHTML = ""; r.ingredients.forEach(function(ing) { ingredientsHTML += "<li>" + escapeHTML(ing) + "</li>"; });
    var instructionsHTML = ""; r.instructions.forEach(function(inst) { instructionsHTML += "<li>" + escapeHTML(inst) + "</li>"; });
    var tagsHTML = ""; r.tags.forEach(function(tag) { tagsHTML += "<span>" + escapeHTML(tag) + "</span>"; });

    document.getElementById("catModalBody").innerHTML =
        '<h1>' + escapeHTML(r.name) + '</h1><p class="cat-modal-cuisine">' + escapeHTML(r.cuisine) + ' Cuisine</p>' +
        '<div class="cat-modal-stats">' +
            '<div class="cat-stat"><i class="fa-regular fa-clock"></i><div><span class="cat-stat-label">Prep Time</span><span class="cat-stat-value">' + r.prepTimeMinutes + ' min</span></div></div>' +
            '<div class="cat-stat"><i class="fa-solid fa-fire-burner"></i><div><span class="cat-stat-label">Cook Time</span><span class="cat-stat-value">' + r.cookTimeMinutes + ' min</span></div></div>' +
            '<div class="cat-stat"><i class="fa-solid fa-users"></i><div><span class="cat-stat-label">Servings</span><span class="cat-stat-value">' + r.servings + '</span></div></div>' +
            '<div class="cat-stat"><i class="fa-solid fa-star"></i><div><span class="cat-stat-label">Rating</span><span class="cat-stat-value">' + r.rating + ' / 5</span></div></div>' +
            '<div class="cat-stat"><i class="fa-solid fa-utensils"></i><div><span class="cat-stat-label">Calories</span><span class="cat-stat-value">' + r.caloriesPerServing + ' kcal</span></div></div>' +
        '</div>' +
        '<div class="cat-modal-section"><h2><i class="fa-solid fa-basket-shopping"></i> Ingredients</h2><ul class="cat-ingredients" id="catIngredients">' + ingredientsHTML + '</ul></div>' +
        '<div class="cat-modal-section"><h2><i class="fa-solid fa-list-ol"></i> Instructions</h2><ol class="cat-instructions">' + instructionsHTML + '</ol></div>' +
        '<div class="cat-modal-tags">' + tagsHTML + '</div>' +
        '<button class="cat-fav-btn ' + (isFav ? 'favorited' : '') + '" id="catFavBtn"><i class="fa-' + (isFav ? 'solid' : 'regular') + ' fa-heart"></i> ' + (isFav ? 'Remove from Favorites' : 'Add to Favorites') + '</button>';

    document.getElementById("catFavBtn").addEventListener("click", function() {
        var favs = getFavorites();
        var idx = -1;
        for(var i=0; i<favs.length; i++) { if(String(favs[i].id) === recipeId) { idx = i; break; } }
        if (idx > -1) { favs.splice(idx, 1); this.innerHTML = '<i class="fa-regular fa-heart"></i> Add to Favorites'; this.classList.remove("favorited"); }
        else { favs.push({id:r.id, name:r.name, image:r.image, cuisine:r.cuisine, rating:r.rating, difficulty:r.difficulty}); this.innerHTML = '<i class="fa-solid fa-heart"></i> Remove from Favorites'; this.classList.add("favorited"); }
        saveFavorites(favs);
    });

    document.querySelectorAll("#catIngredients li").forEach(function(li) { li.addEventListener("click", function() { li.classList.toggle("checked"); }); });
}