import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAppAuth } from "@/lib/authContext";

function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`wordmark ${light ? "wordmark-light" : ""}`} data-testid="brand-logo">
      <span className="wordmark-mark">GL</span>
      <span>
        <strong>GOOD LUCK</strong>
        <small>PALACE · EST. 1983</small>
      </span>
    </Link>
  );
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { user, isAdmin, openAuthModal } = useAppAuth();

  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      setSearchOpen(false);
      setMenuOpen(false);
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const isSolid = !isHome || scrolled;

  return (
    <header className={`site-header ${isSolid ? "site-header-solid" : ""}`} data-testid="site-header">
      <Wordmark light={!isSolid} />
      <nav className="desktop-nav" aria-label="Main navigation">
        <Link to="/shop">Shop All</Link>
        <a href="/#story">Our story</a>
        <a href="/#aisles">Shop by aisle</a>
        <a href="/#picks">House picks</a>
        <a href="/#contact">Visit us</a>
      </nav>
      <div className="header-actions">
        <button
          type="button"
          className="icon-button"
          onClick={() => setSearchOpen(!searchOpen)}
          aria-label="Search"
          data-testid="search-button"
        >
          <Search size={18} />
        </button>

        <button
          type="button"
          className="bag-button"
          onClick={() => navigate("/cart")}
          aria-label="Shopping bag"
          data-testid="cart-button"
        >
          <ShoppingBag size={18} />
          <span>{count}</span>
        </button>

        <button
          type="button"
          className="mobile-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          data-testid="mobile-menu-button"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {searchOpen && (
        <form onSubmit={handleSearchSubmit} className="search-dock" data-testid="search-panel">
          <Search size={18} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the palace"
            aria-label="Search the palace"
            data-testid="search-input"
          />
          <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search">
            <X size={17} />
          </button>
        </form>
      )}

      {menuOpen && (
        <nav className="mobile-nav" data-testid="mobile-menu">
          <Link to="/shop" onClick={() => setMenuOpen(false)}>Shop All Products</Link>
          <a href="/#story" onClick={() => setMenuOpen(false)}>Our story</a>
          <a href="/#aisles" onClick={() => setMenuOpen(false)}>Shop by aisle</a>
          <a href="/#picks" onClick={() => setMenuOpen(false)}>House picks</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)}>Visit us</a>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart ({count})</Link>
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-[#8F1D22] font-semibold">
              Admin Dashboard
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
