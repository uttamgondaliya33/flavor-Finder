// =============================
// Flavor Finder - favorites.js
// =============================

var favoritesGrid = document.querySelector(".favorite-grid");
var favoriteInfo = document.querySelector(".favorite-info");
var emptyState = document.querySelector(".empty-state");
var favSearchInput = document.querySelector(".favorite-search input");
var favSearchBtn = document.querySelector(".favorite-search button");

// =============================
// Safe localStorage Helpers
// =============================
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem("flavorFinderFavs")) || [];
    } catch (e) {
        console.warn("localStorage read failed:", e);
        return [];
    }
}

function saveFavorites(data) {
    try {
        localStorage.setItem("flavorFinderFavs", JSON.stringify(data));
    } catch (e) {
        console.warn("localStorage write failed:", e);
    }
}

var favorites = getFavorites();

// =============================
// Display Favorites
// =============================
function displayFavorites(list) {
    favoritesGrid.innerHTML = "";

    if (list.length === 0) {
        favoritesGrid.style.display = "none";
        favoriteInfo.style.display = "none";
        emptyState.style.display = "block";
        return;
    }

    favoritesGrid.style.display = "grid";
    favoriteInfo.style.display = "block";
    emptyState.style.display = "none";

    favoriteInfo.innerHTML = "<h3>Saved Recipes : " + list.length + "</h3>";

    list.forEach(function(recipe) {
        var card = document.createElement("div");
        card.className = "favorite-card";
        card.innerHTML =
            '<div class="image">' +
                '<img src="' + recipe.image + '" alt="' + recipe.name + '">' +
                '<button class="heart" data-id="' + recipe.id + '">❤️</button>' +
            '</div>' +
            '<div class="content">' +
                '<h2>' + recipe.name + '</h2>' +
                '<p>' + recipe.cuisine + ' Cuisine</p>' +
                '<div class="details">' +
                    '<span>⭐ ' + recipe.rating + '</span>' +
                    '<span>' + (recipe.difficulty || "") + '</span>' +
                '</div>' +
                '<button class="view" data-id="' + recipe.id + '">View Recipe</button>' +
            '</div>';
        favoritesGrid.appendChild(card);
    });

    // Remove events
    document.querySelectorAll(".heart").forEach(function(btn) {
        btn.addEventListener("click", function() {
            removeFavorite(String(btn.dataset.id));
        });
    });

    // View events
    document.querySelectorAll(".view").forEach(function(btn) {
        btn.addEventListener("click", function() {
            openFavModal(String(btn.dataset.id));
        });
    });
}

// =============================
// Remove from Favorites
// =============================
function removeFavorite(id) {
    favorites = favorites.filter(function(fav) {
        return String(fav.id) !== id;
    });
    saveFavorites(favorites);
    displayFavorites(favorites);
    showToast("Recipe removed from favorites 💔");
}

// =============================
// Search Favorites
// =============================
function searchFavorites(query) {
    query = query.toLowerCase().trim();
    if (query === "") {
        displayFavorites(favorites);
        return;
    }
    var filtered = favorites.filter(function(recipe) {
        return recipe.name.toLowerCase().includes(query) ||
               recipe.cuisine.toLowerCase().includes(query);
    });
    displayFavorites(filtered);
}

favSearchBtn.addEventListener("click", function() {
    searchFavorites(favSearchInput.value);
});

var searchTimer;
favSearchInput.addEventListener("input", function() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function() {
        searchFavorites(favSearchInput.value);
    }, 300);
});

favSearchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") searchFavorites(favSearchInput.value);
});

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

    requestAnimationFrame(function() {
        toast.classList.add("show");
    });

    setTimeout(function() {
        toast.classList.remove("show");
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// =============================
// Recipe Modal
// =============================
var favModalOverlay = null;

function createFavModal() {
    if (favModalOverlay) return;

    favModalOverlay = document.createElement("div");
    favModalOverlay.className = "fav-modal-overlay";
    favModalOverlay.innerHTML =
        '<div class="fav-modal-content">' +
            '<button class="fav-modal-close" id="favModalClose">' +
                '<i class="fa-solid fa-xmark"></i>' +
            '</button>' +
            '<div class="fav-modal-image">' +
                '<img id="favModalImg" src="" alt="">' +
                '<div class="fav-modal-badges">' +
                    '<span class="fav-badge" id="favModalDifficulty"></span>' +
                    '<span class="fav-badge" id="favModalMealType"></span>' +
                '</div>' +
            '</div>' +
            '<div class="fav-modal-body" id="favModalBody"></div>' +
        '</div>';

    document.body.appendChild(favModalOverlay);

    document.getElementById("favModalClose").addEventListener("click", closeFavModal);
    favModalOverlay.addEventListener("click", function(e) {
        if (e.target === favModalOverlay) closeFavModal();
    });
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape") closeFavModal();
    });
}

function closeFavModal() {
    if (!favModalOverlay) return;
    favModalOverlay.classList.remove("active");
    document.body.style.overflow = "";
}

function openFavModal(id) {
    createFavModal();
    favModalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";

    var body = document.getElementById("favModalBody");
    body.innerHTML =
        '<h2 style="text-align:center;padding:60px 0;color:#999;">' +
            '<i class="fa-solid fa-spinner fa-spin" style="font-size:30px;display:block;margin-bottom:15px;color:#ff6b35;"></i>' +
            'Loading Recipe...' +
        '</h2>';
    document.getElementById("favModalImg").src = "";
    document.querySelector(".fav-modal-badges").innerHTML = "";

    fetch("https://dummyjson.com/recipes/" + id)
        .then(function(res) { return res.json(); })
        .then(function(r) { populateFavModal(r); })
        .catch(function(err) {
            body.innerHTML =
                '<h2 style="text-align:center;padding:60px 0;color:#e74c3c;">Failed to load recipe.</h2>';
            console.log(err);
        });
}

function populateFavModal(r) {
    var recipeId = String(r.id);

    document.getElementById("favModalImg").src = r.image;
    document.getElementById("favModalImg").alt = r.name;
    document.querySelector(".fav-modal-badges").innerHTML =
        '<span class="fav-badge">' + r.difficulty + '</span>' +
        '<span class="fav-badge">' + r.mealType[0] + '</span>';

    var ingredientsHTML = "";
    r.ingredients.forEach(function(ing) {
        ingredientsHTML += "<li>" + ing + "</li>";
    });

    var instructionsHTML = "";
    r.instructions.forEach(function(inst) {
        instructionsHTML += "<li>" + inst + "</li>";
    });

    var tagsHTML = "";
    r.tags.forEach(function(tag) {
        tagsHTML += "<span>" + tag + "</span>";
    });

    document.getElementById("favModalBody").innerHTML =
        '<h1>' + r.name + '</h1>' +
        '<p class="fav-modal-cuisine">' + r.cuisine + ' Cuisine</p>' +

        '<div class="fav-modal-stats">' +
            '<div class="fav-stat"><i class="fa-regular fa-clock"></i>' +
                '<div><span class="fav-stat-label">Prep Time</span>' +
                '<span class="fav-stat-value">' + r.prepTimeMinutes + ' min</span></div></div>' +
            '<div class="fav-stat"><i class="fa-solid fa-fire-burner"></i>' +
                '<div><span class="fav-stat-label">Cook Time</span>' +
                '<span class="fav-stat-value">' + r.cookTimeMinutes + ' min</span></div></div>' +
            '<div class="fav-stat"><i class="fa-solid fa-users"></i>' +
                '<div><span class="fav-stat-label">Servings</span>' +
                '<span class="fav-stat-value">' + r.servings + '</span></div></div>' +
            '<div class="fav-stat"><i class="fa-solid fa-star"></i>' +
                '<div><span class="fav-stat-label">Rating</span>' +
                '<span class="fav-stat-value">' + r.rating + ' / 5</span></div></div>' +
            '<div class="fav-stat"><i class="fa-solid fa-utensils"></i>' +
                '<div><span class="fav-stat-label">Calories</span>' +
                '<span class="fav-stat-value">' + r.caloriesPerServing + ' kcal</span></div></div>' +
        '</div>' +

        '<div class="fav-modal-section">' +
            '<h2><i class="fa-solid fa-basket-shopping"></i> Ingredients</h2>' +
            '<ul class="fav-ingredients" id="favIngredients">' + ingredientsHTML + '</ul></div>' +

        '<div class="fav-modal-section">' +
            '<h2><i class="fa-solid fa-list-ol"></i> Instructions</h2>' +
            '<ol class="fav-instructions">' + instructionsHTML + '</ol></div>' +

        '<div class="fav-modal-tags">' + tagsHTML + '</div>' +

        '<button class="fav-remove-btn" id="favRemoveBtn">' +
            '<i class="fa-solid fa-heart-crack"></i> Remove from Favorites</button>';

    document.getElementById("favRemoveBtn").addEventListener("click", function() {
        favorites = favorites.filter(function(fav) {
            return String(fav.id) !== recipeId;
        });
        saveFavorites(favorites);
        closeFavModal();
        displayFavorites(favorites);
        showToast("Recipe removed from favorites 💔");
    });

    document.querySelectorAll("#favIngredients li").forEach(function(li) {
        li.addEventListener("click", function() {
            li.classList.toggle("checked");
        });
    });
}

// =============================
// Initial Load
// =============================
displayFavorites(favorites);