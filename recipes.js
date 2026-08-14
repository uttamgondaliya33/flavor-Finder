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
// Variables
// =============================
var allRecipes = [];
var recipeContainer = document.querySelector(".recipes-container");
var searchInput = document.querySelector("#searchInput");
var searchBtn = document.querySelector("#searchBtn");
var filterButtons = document.querySelectorAll(".filters button");
var recipeModal = null;

// =============================
// Safe localStorage
// =============================
function getFavorites() {
    try {
        var data = JSON.parse(localStorage.getItem("flavorFinderFavs"));
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

function saveFavorites(data) {
    try {
        localStorage.setItem("flavorFinderFavs", JSON.stringify(data));
    } catch (e) {
        // Silently fail if storage is full or blocked
    }
}

// =============================
// Display Recipes
// =============================
function displayRecipes(recipes) {
    recipeContainer.innerHTML = "";
    if (recipes.length === 0) {
        recipeContainer.innerHTML =
            '<h2 style="text-align:center;margin-top:50px;grid-column:1/-1;">No Recipes Found 😔</h2>';
        return;
    }
    recipes.forEach(function(recipe) {
        recipeContainer.innerHTML +=
            '<div class="recipe-card">' +
                '<img src="' + recipe.image + '" alt="' + escapeHTML(recipe.name) + '">' +
                '<div class="content">' +
                    '<h2>' + escapeHTML(recipe.name) + '</h2>' +
                    '<p>' + escapeHTML(recipe.cuisine) + '</p>' +
                    '<div class="info">' +
                        '<span>⭐ ' + recipe.rating + '</span>' +
                        '<span>' + escapeHTML(recipe.difficulty) + '</span>' +
                    '</div>' +
                    '<button class="viewBtn" data-id="' + recipe.id + '">View Recipe</button>' +
                '</div>' +
            '</div>';
    });
    attachViewButtons();
}

function attachViewButtons() {
    document.querySelectorAll(".viewBtn").forEach(function(btn) {
        btn.addEventListener("click", function() {
            openRecipeModal(btn.dataset.id);
        });
    });
}

// =============================
// Create Modal
// =============================
function createRecipeModal() {
    if (recipeModal) return;
    recipeModal = document.createElement("div");
    recipeModal.className = "modal-overlay";
    recipeModal.innerHTML =
        '<div class="modal-content">' +
            '<button class="modal-close" id="recipeModalClose"><i class="fa-solid fa-xmark"></i></button>' +
            '<div class="modal-image">' +
                '<img id="recipeModalImg" src="" alt="">' +
                '<div class="modal-badges" id="recipeModalBadges"></div>' +
            '</div>' +
            '<div class="modal-body" id="recipeModalBody"></div>' +
        '</div>';
    document.body.appendChild(recipeModal);

    document.getElementById("recipeModalClose").addEventListener("click", closeRecipeModal);
    recipeModal.addEventListener("click", function(e) {
        if (e.target === recipeModal) closeRecipeModal();
    });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeRecipeModal();
    });
}

function closeRecipeModal() {
    if (!recipeModal) return;
    recipeModal.classList.remove("active");
    document.body.style.overflow = "";
}

// =============================
// Open Modal
// =============================
function openRecipeModal(id) {
    createRecipeModal();
    recipeModal.classList.add("active");
    document.body.style.overflow = "hidden";

    var body = document.getElementById("recipeModalBody");
    body.innerHTML =
        '<h2 style="text-align:center;padding:60px 0;color:#999;">' +
            '<i class="fa-solid fa-spinner fa-spin" style="font-size:30px;display:block;margin-bottom:15px;color:#ff6b35;"></i>' +
            'Loading Recipe...</h2>';
    document.getElementById("recipeModalImg").src = "";
    document.getElementById("recipeModalBadges").innerHTML = "";

    fetch("https://dummyjson.com/recipes/" + id)
        .then(function(res) { return res.json(); })
        .then(function(r) { populateModal(r); })
        .catch(function() {
            body.innerHTML = '<h2 style="text-align:center;padding:60px 0;color:#e74c3c;">Failed to load recipe.</h2>';
        });
}

// =============================
// Populate Modal
// =============================
function populateModal(r) {
    var recipeId = String(r.id);
    document.getElementById("recipeModalImg").src = r.image;
    document.getElementById("recipeModalImg").alt = escapeHTML(r.name);
    document.getElementById("recipeModalBadges").innerHTML =
        '<span class="badge">' + escapeHTML(r.difficulty) + '</span>' +
        '<span class="badge">' + escapeHTML(r.mealType[0]) + '</span>';

    var favorites = getFavorites();
    var isFav = favorites.some(function(fav) { return String(fav.id) === recipeId; });

    var ingredientsHTML = "";
    r.ingredients.forEach(function(ing) { ingredientsHTML += "<li>" + escapeHTML(ing) + "</li>"; });

    var instructionsHTML = "";
    r.instructions.forEach(function(inst) { instructionsHTML += "<li>" + escapeHTML(inst) + "</li>"; });

    var tagsHTML = "";
    r.tags.forEach(function(tag) { tagsHTML += "<span>" + escapeHTML(tag) + "</span>"; });

    document.getElementById("recipeModalBody").innerHTML =
        '<h1>' + escapeHTML(r.name) + '</h1>' +
        '<p class="modal-cuisine">' + escapeHTML(r.cuisine) + ' Cuisine</p>' +
        '<div class="modal-stats">' +
            '<div class="stat"><i class="fa-regular fa-clock"></i><div><span class="stat-label">Prep Time</span><span class="stat-value">' + r.prepTimeMinutes + ' min</span></div></div>' +
            '<div class="stat"><i class="fa-solid fa-fire-burner"></i><div><span class="stat-label">Cook Time</span><span class="stat-value">' + r.cookTimeMinutes + ' min</span></div></div>' +
            '<div class="stat"><i class="fa-solid fa-users"></i><div><span class="stat-label">Servings</span><span class="stat-value">' + r.servings + '</span></div></div>' +
            '<div class="stat"><i class="fa-solid fa-star"></i><div><span class="stat-label">Rating</span><span class="stat-value">' + r.rating + ' / 5</span></div></div>' +
            '<div class="stat"><i class="fa-solid fa-utensils"></i><div><span class="stat-label">Calories</span><span class="stat-value">' + r.caloriesPerServing + ' kcal</span></div></div>' +
        '</div>' +
        '<div class="modal-section"><h2><i class="fa-solid fa-basket-shopping"></i> Ingredients</h2><ul id="modalIngredients">' + ingredientsHTML + '</ul></div>' +
        '<div class="modal-section"><h2><i class="fa-solid fa-list-ol"></i> Instructions</h2><ol id="modalInstructions">' + instructionsHTML + '</ol></div>' +
        '<div class="modal-tags">' + tagsHTML + '</div>' +
        '<button class="modal-fav-btn ' + (isFav ? "favorited" : "") + '" id="modalFavBtn"><i class="fa-' + (isFav ? 'solid' : 'regular') + ' fa-heart"></i> ' + (isFav ? 'Remove from Favorites' : 'Add to Favorites') + '</button>';

    document.getElementById("modalFavBtn").addEventListener("click", function() {
        var currentFavs = getFavorites();
        var index = -1;
        for (var i = 0; i < currentFavs.length; i++) {
            if (String(currentFavs[i].id) === recipeId) { index = i; break; }
        }
        if (index > -1) {
            currentFavs.splice(index, 1);
            this.innerHTML = '<i class="fa-regular fa-heart"></i> Add to Favorites';
            this.classList.remove("favorited");
        } else {
            currentFavs.push({ id: r.id, name: r.name, image: r.image, cuisine: r.cuisine, rating: r.rating, difficulty: r.difficulty });
            this.innerHTML = '<i class="fa-solid fa-heart"></i> Remove from Favorites';
            this.classList.add("favorited");
        }
        saveFavorites(currentFavs);
        showToast(index > -1 ? "Removed from favorites 💔" : "Added to favorites ❤️");
    });

    document.querySelectorAll("#modalIngredients li").forEach(function(li) {
        li.addEventListener("click", function() { li.classList.toggle("checked"); });
    });
}

// =============================
// Toast
// =============================
function showToast(message) {
    var existing = document.querySelector(".fav-toast");
    if (existing) existing.remove();
    var toast = document.createElement("div");
    toast.className = "fav-toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add("show"); });
    setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// =============================
// Fetch, Search, Filter
// =============================
function getRecipes() {
    fetch("https://dummyjson.com/recipes?limit=0")
        .then(function(res) { return res.json(); })
        .then(function(data) { allRecipes = data.recipes; displayRecipes(allRecipes); })
        .catch(function() {});
}

function searchRecipes(query) {
    query = query.toLowerCase().trim();
    if (query === "") { displayRecipes(allRecipes); return; }
    var filtered = allRecipes.filter(function(recipe) {
        return recipe.name.toLowerCase().includes(query) || recipe.cuisine.toLowerCase().includes(query) || recipe.difficulty.toLowerCase().includes(query) || recipe.tags.some(function(tag) { return tag.toLowerCase().includes(query); });
    });
    displayRecipes(filtered);
}

searchBtn.addEventListener("click", function() { searchRecipes(searchInput.value); });
var timer;
searchInput.addEventListener("input", function() {
    clearTimeout(timer);
    timer = setTimeout(function() { searchRecipes(searchInput.value); }, 300);
});
searchInput.addEventListener("keydown", function(e) { if (e.key === "Enter") searchRecipes(searchInput.value); });

function filterRecipes(category) {
    recipeContainer.innerHTML = "<h2 style='text-align:center;grid-column:1/-1;'>Loading...</h2>";
    var url = category === "all" ? "https://dummyjson.com/recipes?limit=0" : "https://dummyjson.com/recipes/meal-type/" + category.toLowerCase();
    fetch(url).then(function(res) { return res.json(); }).then(function(data) { allRecipes = data.recipes; displayRecipes(data.recipes); }).catch(function() {});
}

filterButtons.forEach(function(button) {
    button.addEventListener("click", function() {
        filterButtons.forEach(function(btn) { btn.classList.remove("active"); });
        button.classList.add("active");
        filterRecipes(button.dataset.category);
    });
});

getRecipes();