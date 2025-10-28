import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

//  ErrorBoundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Error caught by boundary:", error, info);
  }
  render() {
    return this.state.hasError ? (
      <div className="text-center text-danger mt-5">
        <h2>⚠ Something went wrong. Please reload.</h2>
      </div>
    ) : (
      this.props.children
    );
  }
}

//  Reusable Card Component (used for both category & recipe cards)
const CardItem = ({ image, title, text, onClick, btnText, btnClass }) => (
  <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex">
    <div
      className="card shadow-sm border-0 text-center w-100 cursor-pointer"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <img
        src={image}
        alt={title}
        className="card-img-top"
        style={{ height: "200px", objectFit: "cover" }}
      />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title fw-semibold text-dark">{title}</h5>
        {text && <p className="text-muted small">{text}</p>}
        {btnText && (
          <button onClick={onClick} className={`btn ${btnClass} mt-auto`}>
            {btnText}
          </button>
        )}
      </div>
    </div>
  </div>
);

//  Recipe Modal Component
const RecipeModal = ({ recipe, onClose }) => {
  if (!recipe) return null;
  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
      style={{ zIndex: 1050 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded shadow-lg p-4 overflow-auto position-relative"
        style={{ maxWidth: "640px", maxHeight: "85vh", width: "92%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="btn-close position-absolute top-0 end-0 m-3"
          aria-label="Close"
        ></button>

        <h3 className="fw-bold mb-3 text-center">{recipe.strMeal}</h3>
        <img
          src={recipe.strMealThumb}
          alt={recipe.strMeal}
          className="img-fluid rounded mb-3"
          style={{ maxHeight: "260px", objectFit: "cover", width: "100%" }}
        />

        <h5 className="text-start">Ingredients:</h5>
        <ul className="text-start small">
          {Array.from({ length: 20 }, (_, i) => i + 1)
            .map((i) => {
              const ing = recipe[`strIngredient${i}`];
              const meas = recipe[`strMeasure${i}`];
              return ing ? (
                <li key={i}>
                  {ing} {meas ? `— ${meas}` : ""}
                </li>
              ) : null;
            })
            .filter(Boolean)}
        </ul>

        <h5 className="mt-3 text-start">Instructions:</h5>
        <p className="text-start small" style={{ whiteSpace: "pre-line" }}>
          {recipe.strInstructions}
        </p>

        {recipe.strYoutube && (
          <div className="text-center mt-3">
            <a
              href={recipe.strYoutube}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-danger"
            >
              ▶ Watch on YouTube
            </a>
          </div>
        )}

        <div className="text-center mt-4">
          <button onClick={onClose} className="btn btn-outline-dark px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

//  Main App Component
const App = () => {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  //  Fetch Categories once
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const res = await fetch("https://www.themealdb.com/api/json/v1/1/categories.php");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch {
        setError("⚠ Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  //  Fetch Recipes
  const fetchRecipes = async (term) => {
    if (!term.trim()) return;
    try {
      setLoading(true);
      setError(null);
      setSearchTerm(term);
      const res = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`
      );
      const data = await res.json();
      setRecipes(data.meals || []);
      if (!data.meals) setError("No recipes found.");
    } catch {
      setError("⚠ Failed to load recipes. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) fetchRecipes(query);
    setQuery("");
  };

  const goBackHome = () => {
    setRecipes([]);
    setSearchTerm("");
    setError(null);
  };

  const fetchRecipeDetails = async (id) => {
    try {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await res.json();
      setSelectedRecipe(data.meals?.[0]);
    } catch {
      alert("Failed to fetch recipe details.");
    }
  };

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setSelectedRecipe(null);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-vh-100 bg-light px-5 py-4 d-flex flex-column align-items-center">
        <div className="container text-center">
          <h1 className="mb-4 fw-bold text-dark">🍽️ Recipe Ideas Finder</h1>

          {/*  Search Bar */}
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
            />
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {/*  Back Button */}
          {searchTerm && (
            <button onClick={goBackHome} className="btn btn-outline-secondary mb-4">
              ⬅ Back to Categories
            </button>
          )}

          {/*  Categories */}
          {!searchTerm && !loading && (
            <>
              <h4 className="text-secondary mb-4">Explore Recipe Categories</h4>
              <div className="row g-4 justify-content-center">
                {categories.map((cat) => (
                  <CardItem
                    key={cat.idCategory}
                    image={cat.strCategoryThumb}
                    title={cat.strCategory}
                    text={cat.strCategoryDescription.slice(0, 60) + "..."}
                    onClick={() => fetchRecipes(cat.strCategory)}
                  />
                ))}
              </div>
            </>
          )}

          {/*  Recipes */}
          {!loading && searchTerm && (
            <>
              <h4 className="mt-3 mb-4 text-secondary">
                Showing recipes for:{" "}
                <span className="text-dark fw-semibold">{searchTerm}</span>
              </h4>
              <div className="row g-4 justify-content-center">
                {recipes.map((r) => (
                  <CardItem
                    key={r.idMeal}
                    image={r.strMealThumb}
                    title={r.strMeal}
                    text={`Category: ${r.strCategory || "N/A"}`}
                    onClick={() => fetchRecipeDetails(r.idMeal)}
                    btnText="View Recipe"
                    btnClass="btn-success"
                  />
                ))}
              </div>
            </>
          )}

          {/* Error / Loading */}
          {loading && <p className="text-secondary mt-4">Loading...</p>}
          {error && <p className="text-danger mt-4">{error}</p>}
        </div>

        {/* Recipe Modal */}
        <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
