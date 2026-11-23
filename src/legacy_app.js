import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import Lenis from "lenis";
import { ArrowUpRight, ChevronDown, ChevronRight, Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import "@/App.css";

const categories = [
  ["01", "Groceries & Provisions", "The everyday, considered.", "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85"],
  ["02", "Cosmetics & Beauty", "Rituals for every day.", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85"],
  ["03", "Dry Fruits & Nuts", "Hand-picked goodness.", "https://images.unsplash.com/photo-1599599810694-b5ac3b9f2e8d?auto=format&fit=crop&w=900&q=85"],
  ["04", "Perfumes & Fragrances", "A signature in the air.", "https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&w=900&q=85"],
  ["05", "Bags & Accessories", "Made to accompany.", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85"],
  ["06", "Festive & Gift Hampers", "Thoughtfully gathered.", "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=900&q=85"],
];

const picks = [
  ["The pantry edit", "A considered table of everyday essentials", "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85", "01"],
  ["The ritual edit", "Small luxuries, beautifully chosen", "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=900&q=85", "02"],
  ["The gifting edit", "Warm gestures for every occasion", "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=85", "03"],
];

const reveal = { hidden: { opacity: 0, y: 34 }, visible: { opacity: 1, y: 0, transition: { duration: .8, ease: [0.22, 1, .36, 1] } } };

function Wordmark({ light = false }) {
  return <a href="#top" className={`wordmark ${light ? "wordmark-light" : ""}`} data-testid="brand-logo"><span className="wordmark-mark">GL</span><span><strong>GOOD LUCK</strong><small>PALACE · EST. 1983</small></span></a>;
}

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const prefersReduced = useReducedMotion();
  const heroRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: !prefersReduced });
    let frame;
    const raf = (time) => { lenis.raf(time); frame = requestAnimationFrame(raf); };
    if (!prefersReduced) frame = requestAnimationFrame(raf);
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); lenis.destroy(); cancelAnimationFrame(frame); };
  }, [prefersReduced]);

  const scrollTo = (id) => document.querySelector(id)?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });

  return <main id="top" className="site-shell">
    <header className={`site-header ${scrolled ? "site-header-solid" : ""}`} data-testid="site-header">
      <Wordmark light={!scrolled} />
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#story">Our story</a><a href="#aisles">Shop by aisle</a><a href="#picks">House picks</a><a href="#contact">Visit us</a></nav>
      <div className="header-actions"><button className="icon-button" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search" data-testid="search-button"><Search size={18}/></button><button className="bag-button" aria-label="Shopping bag" data-testid="cart-button"><ShoppingBag size={18}/><span>0</span></button><button className="mobile-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu" data-testid="mobile-menu-button">{menuOpen ? <X/> : <Menu/>}</button></div>
      {searchOpen && <div className="search-dock" data-testid="search-panel"><Search size={18}/><input autoFocus placeholder="Search the palace" aria-label="Search the palace" data-testid="search-input"/><button onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={17}/></button></div>}
      {menuOpen && <nav className="mobile-nav" data-testid="mobile-menu"><a href="#story" onClick={() => setMenuOpen(false)}>Our story</a><a href="#aisles" onClick={() => setMenuOpen(false)}>Shop by aisle</a><a href="#picks" onClick={() => setMenuOpen(false)}>House picks</a><a href="#contact" onClick={() => setMenuOpen(false)}>Visit us</a></nav>}
    </header>

    <section className="hero" ref={heroRef} data-testid="hero-section">
      <div className="hero-image" />
      <div className="hero-noise" />
      <div className="hero-content"><p className="eyebrow hero-reveal">EST. 1983 · CROSS CUT ROAD · GANDHIPURAM</p><h1><span className="line-mask"><span>A legacy of trust.</span></span><span className="line-mask"><span>A tradition of goodness.</span></span></h1><p className="hero-copy hero-reveal">Since 1983, Good Luck Palace has been part of Coimbatore&apos;s everyday life — bringing generations together through quality, care, and honest value.</p><div className="hero-actions hero-reveal"><button className="button button-gold" onClick={() => scrollTo("#story")} data-testid="explore-legacy-button">Explore our legacy <ArrowUpRight size={16}/></button><button className="button button-ghost" onClick={() => scrollTo("#aisles")} data-testid="discover-collection-button">Discover the collection <ChevronRight size={16}/></button></div></div>
      <div className="hero-index">01 <span /> 06</div><div className="hero-side-note">THE GOODNESS OF EVERYDAY<br/>SINCE NINETEEN EIGHTY THREE</div><div className="scroll-cue">Scroll to discover <span /></div>
    </section>

    <div className="marquee" aria-label="Brand statement"><div>ROOTED IN TRADITION <i>✦</i> TRUSTED ACROSS GENERATIONS <i>✦</i> ROOTED IN TRADITION <i>✦</i> TRUSTED ACROSS GENERATIONS <i>✦</i></div></div>

    <motion.section id="story" className="story section-pad" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .2 }} variants={reveal} data-testid="heritage-story-section"><div className="section-kicker">01 / OUR STORY</div><div className="story-grid"><div><h2>More than a store.<br/><em>A part of Coimbatore&apos;s story.</em></h2></div><div className="story-copy"><p className="lead">Since 1983, Good Luck Palace has built its reputation on neighbourhood trust, quality products, and honest pricing.</p><p>What began as a departmental store has become a familiar destination for generations of families across Coimbatore. Today, the tradition continues — with the same care, brought closer to you.</p><a className="text-link" href="#aisles" data-testid="story-shop-link">Discover our world <ArrowUpRight size={16}/></a></div></div><div className="timeline"><div className="timeline-line"/><div className="timeline-item timeline-highlight"><strong>1983</strong><div><b>The beginning</b><p>Good Luck Palace established on Cross Cut Road, Gandhipuram.</p></div></div><div className="timeline-item"><strong>∞</strong><div><b>Generations of trust</b><p>Everyday essentials and selected quality products, chosen with care.</p></div></div><div className="timeline-item"><strong>NOW</strong><div><b>The tradition continues</b><p>The familiar Good Luck Palace experience, made modern.</p></div></div></div></motion.section>

    <section className="statement" data-testid="brand-statement"><div className="statement-ornament">✦</div><p className="eyebrow">A GOOD LUCK PALACE ORIGINAL</p><h2>Rooted in tradition.<br/><em>Trusted across generations.</em></h2><div className="statement-meta"><span>ESTABLISHED 1983</span><span>CROSS CUT ROAD, COIMBATORE</span><span>HONEST PRICING · QUALITY PRODUCTS</span></div></section>

    <motion.section id="aisles" className="aisles section-pad" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .1 }} variants={reveal} data-testid="aisles-section"><div className="section-heading"><div><div className="section-kicker">02 / THE COLLECTION</div><h2>Shop by <em>aisle.</em></h2></div><p>Discover the collections that continue<br/>a tradition of quality.</p></div><div className="category-grid">{categories.map(([num, title, sub, image], i) => <a href="#picks" className={`category-card category-${i + 1}`} key={title} data-testid={`category-card-${i + 1}`}><img src={image} alt=""/><div className="category-shade"/><span className="category-num">{num}</span><div className="category-info"><h3>{title}</h3><p>{sub}</p><ArrowUpRight size={18}/></div></a>)}</div></motion.section>

    <motion.section id="picks" className="picks section-pad" initial="hidden" whileInView="visible" viewport={{ once: true, amount: .12 }} variants={reveal} data-testid="picks-section"><div className="section-heading"><div><div className="section-kicker">03 / HOUSE PICKS</div><h2>Fresh on the <em>shelves.</em></h2></div><a className="text-link" href="#aisles" data-testid="view-all-picks-link">View all collections <ArrowUpRight size={16}/></a></div><div className="picks-grid">{picks.map(([title, sub, image, num], i) => <article className={`pick-card pick-${i + 1}`} key={title} data-testid={`pick-card-${i + 1}`}><div className="pick-image"><img src={image} alt={title}/><span>0{num}</span><button className="pick-add" aria-label={`Add ${title}`} data-testid={`add-pick-${i + 1}`}><ShoppingBag size={16}/></button></div><div className="pick-meta"><div><h3>{title}</h3><p>{sub}</p></div><ArrowUpRight size={18}/></div></article>)}</div></motion.section>

    <section className="gift-section" data-testid="gift-section"><div className="gift-copy"><div className="section-kicker">04 / THE GIFT EDIT</div><h2>Goodness,<br/><em>gathered.</em></h2><p>Thoughtfully assembled hampers for the moments that deserve a little more.</p><a className="button button-dark" href="#picks" data-testid="gift-collection-button">Explore gift hampers <ArrowUpRight size={16}/></a></div><div className="gift-image"><img src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=1200&q=85" alt="Good Luck Palace gift selection"/></div><Sparkles className="gift-sparkle" size={22}/></section>

    <footer id="contact" className="footer" data-testid="site-footer"><div className="footer-top"><Wordmark light/><p>Everyday goodness,<br/>since 1983.</p><a className="footer-arrow" href="#top" aria-label="Back to top" data-testid="back-to-top"><ArrowUpRight size={22}/></a></div><div className="footer-grid"><div><span className="footer-label">Visit us</span><p>Cross Cut Road, Gandhipuram<br/>Coimbatore, Tamil Nadu</p></div><div><span className="footer-label">Call the palace</span><p>+91 422 255 1983<br/>hello@goodluckpalace.in</p></div><div><span className="footer-label">Open daily</span><p>08:00 — 21:30<br/>Monday through Sunday</p></div><div><span className="footer-label">Follow along</span><p className="socials"><a href="#contact">Instagram</a><a href="#contact">Facebook</a></p></div></div><div className="footer-bottom"><span>© 2025 Good Luck Palace</span><span>Made with care in Coimbatore</span></div></footer>
  </main>;
}

function App() { return <BrowserRouter><Routes><Route path="/" element={<Home />} /></Routes></BrowserRouter>; }
export default App;
