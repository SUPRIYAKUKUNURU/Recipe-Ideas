import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// ErrorBoundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center text-danger mt-5">
          <h2>Something went wrong. Please reload.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          "https://www.themealdb.com/api/json/v1/1/categories.php"
        );
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch {
        setError("Failed to load categories. Please try again.");
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Recipes (by search or category)
  const fetchRecipes = async (term) => {
    if (!term.trim()) return;
    setLoading(true);
    setError(null);
    setSearchTerm(term);
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(
          term
        )}`
      );
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setRecipes(data.meals || []);
      if (!data.meals) setError("No recipes found for that search term.");
    } catch {
      setError("Failed to load recipes. Check your connection or try again.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Search Submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    fetchRecipes(query);
    setQuery("");
  };

  // Back to Home
  const goBackHome = () => {
    setRecipes([]);
    setSearchTerm("");
    setError(null);
  };

  // Fetch full recipe details when clicked
  const fetchRecipeDetails = async (idMeal) => {
    try {
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${idMeal}`
      );
      const data = await res.json();
      setSelectedRecipe(data.meals[0]);
    } catch {
      alert("Failed to fetch recipe details.");
    }
  };

  const closeRecipeDetails = () => setSelectedRecipe(null);

  // Close modal on ESC key
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeRecipeDetails();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-vh-100 bg-light px-5 py-4">
        <div className="container text-center">
          <h1 className="mb-4 fw-bold text-dark">🍽️ Recipe Ideas Finder</h1>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="d-flex justify-content-center mb-4 gap-2"
          >
            <input
              type="text"
              placeholder="Enter a recipe or ingredient..."
              className="form-control w-50"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {/* Back Button */}
          {searchTerm && (
            <div className="text-center mb-4">
              <button onClick={goBackHome} className="btn btn-outline-secondary">
                ⬅ Back to Categories
              </button>
            </div>
          )}

          {/* Categories Section */}
          {!searchTerm && !loading && (
            <>
              <h4 className="text-secondary mb-4">Explore Recipe Categories</h4>
              <div className="row g-4 justify-content-center">
                {categories.map((cat) => (
                  <div
                    key={cat.idCategory}
                    className="col-12 col-sm-6 col-md-4 col-lg-3"
                  >
                    <div
                      className="card h-100 shadow-sm border-0 text-center"
                      onClick={() => fetchRecipes(cat.strCategory)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={cat.strCategoryThumb}
                        alt={cat.strCategory}
                        className="card-img-top"
                        style={{ height: "180px", objectFit: "cover" }}
                      />
                      <div className="card-body">
                        <h5 className="card-title fw-semibold text-dark">
                          {cat.strCategory}
                        </h5>
                        <p className="text-muted small">
                          {cat.strCategoryDescription.slice(0, 60)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Loading / Error */}
          {loading && (
            <p className="text-center text-secondary mt-4">Loading...</p>
          )}
          {error && <p className="text-center text-danger mt-4">{error}</p>}

          {/* Recipes Section */}
          {!loading && searchTerm && !error && (
            <>
              <h4 className="mt-3 mb-4 text-secondary">
                Showing recipes for:{" "}
                <span className="text-dark fw-semibold">{searchTerm}</span>
              </h4>
              <div className="row g-4 justify-content-center">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.idMeal}
                    className="col-12 col-sm-6 col-md-4 col-lg-3"
                  >
                    <div className="card h-100 shadow-sm border-0">
                      <img
                        src={recipe.strMealThumb}
                        alt={recipe.strMeal}
                        className="card-img-top"
                        style={{ height: "200px", objectFit: "cover" }}
                      />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{recipe.strMeal}</h5>
                        <p className="text-muted mb-3">
                          Category: {recipe.strCategory || "N/A"}
                        </p>
                        <button
                          onClick={() => fetchRecipeDetails(recipe.idMeal)}
                          className="btn btn-success mt-auto"
                        >
                          View Recipe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Recipe Modal */}
          {selectedRecipe && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
              style={{ zIndex: 1050 }}
              onClick={closeRecipeDetails} // close on backdrop click
            >
              <div
                className="bg-white rounded shadow-lg p-4 overflow-auto position-relative"
                style={{
                  maxWidth: "640px",
                  maxHeight: "85vh",
                  width: "92%",
                  border: "1px solid #ddd",
                }}
                onClick={(e) => e.stopPropagation()} // prevent backdrop close when clicking inside
                role="dialog"
                aria-modal="true"
                aria-labelledby="recipe-title"
              >
                {/* Close button (visible & accessible) */}
                <button
                  onClick={closeRecipeDetails}
                  className="btn-close position-absolute top-0 end-0 m-3"
                  aria-label="Close recipe details"
                  title="Close"
                ></button>

                <h3 id="recipe-title" className="fw-bold mb-3 text-center">
                  {selectedRecipe.strMeal}
                </h3>

                <img
                  src={selectedRecipe.strMealThumb}
                  alt={selectedRecipe.strMeal}
                  className="img-fluid rounded mb-3"
                  style={{ maxHeight: "260px", objectFit: "cover", width: "100%" }}
                />

                <h5 className="text-start">Ingredients:</h5>
                <ul className="text-start small">
                  {Array.from({ length: 20 }, (_, i) => i + 1)
                    .map((i) => {
                      const ingredient = selectedRecipe[`strIngredient${i}`];
                      const measure = selectedRecipe[`strMeasure${i}`];
                      return ingredient
                        ? (
                          <li key={i}>
                            {ingredient} {measure ? `— ${measure}` : ""}
                          </li>
                        )
                        : null;
                    })
                    .filter(Boolean)}
                </ul>

                <h5 className="mt-3 text-start">Instructions:</h5>
                <p className="text-start small" style={{ whiteSpace: "pre-line" }}>
                  {selectedRecipe.strInstructions}
                </p>

                {selectedRecipe.strYoutube && (
                  <div className="text-center mt-3">
                    <a
                      href={selectedRecipe.strYoutube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-danger"
                    >
                      ▶ Watch on YouTube
                    </a>
                  </div>
                )}
                 {/* ✅ Close Button (inside the card) */}
                <div className="text-center mt-4">
                  <button
                    onClick={closeRecipeDetails}
                    className="btn btn-outline-dark px-4"
                  >
                     Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
