import { useState } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setSubscribed(true);
    toast.success("Welcome to Good Luck Palace!", {
      description: "You'll receive our seasonal arrival edits and counter specials.",
    });
  };

  return (
    <footer id="contact" className="cinematic-footer" data-testid="site-footer">
      {/* 1. NEWSLETTER SUBSCRIPTION AREA */}
      <div className="footer-newsletter-band" data-testid="footer-newsletter">
        <div className="footer-newsletter-container">
          <div className="footer-newsletter-text">
            <span className="footer-newsletter-eyebrow">✦ STAY CONNECTED ✦</span>
            <h2>A little goodness, delivered.</h2>
            <p>
              Discover collections, thoughtful finds and updates from Good Luck Palace.
            </p>
          </div>
          <div className="footer-newsletter-action">
            {subscribed ? (
              <div className="footer-newsletter-success">
                <CheckCircle2 size={18} className="text-[#d4af37]" />
                <span>Thank you. You are on our private guest list.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
                <div className="footer-newsletter-input-wrap">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    aria-label="Email address for newsletter"
                    required
                  />
                  <button type="submit" aria-label="Subscribe to newsletter">
                    SUBSCRIBE <ArrowUpRight size={15} />
                  </button>
                </div>
                <span className="footer-newsletter-privacy">
                  NO SPAM · ONLY THOUGHTFUL UPDATES FROM CROSS CUT ROAD
                </span>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 2. BRAND INTRODUCTION & BACK-TO-TOP */}
      <div className="footer-intro-band">
        <div className="footer-intro-left">
          <Link to="/" className="wordmark wordmark-light" data-testid="brand-logo">
            <span className="wordmark-mark">GL</span>
            <span>
              <strong>GOOD LUCK</strong>
              <small>PALACE · EST. 1983</small>
            </span>
          </Link>
          <div className="footer-brand-statement-wrap">
            <p className="footer-brand-statement">
              Everyday goodness,
              <br />
              since 1983.
            </p>
            <div className="footer-gold-accent-line" />
          </div>
        </div>

        <button
          type="button"
          className="footer-arrow"
          onClick={scrollToTop}
          aria-label="Back to top"
          data-testid="back-to-top"
          title="Return to top"
        >
          <ArrowUpRight size={22} />
        </button>
      </div>

      {/* 3. ANIMATED HERITAGE MARQUEE */}
      <div className="footer-marquee" aria-label="Heritage footer ticker">
        <div className="footer-marquee-track">
          <span>ESTABLISHED 1983 ✦ TRUSTED GENERATIONS ✦ EVERYDAY GOODNESS ✦ COIMBATORE ✦ </span>
          <span>ESTABLISHED 1983 ✦ TRUSTED GENERATIONS ✦ EVERYDAY GOODNESS ✦ COIMBATORE ✦ </span>
          <span>ESTABLISHED 1983 ✦ TRUSTED GENERATIONS ✦ EVERYDAY GOODNESS ✦ COIMBATORE ✦ </span>
          <span>ESTABLISHED 1983 ✦ TRUSTED GENERATIONS ✦ EVERYDAY GOODNESS ✦ COIMBATORE ✦ </span>
        </div>
      </div>

      {/* 4. BALANCED INFORMATION COLUMNS */}
      <div className="footer-grid">
        <div className="footer-col">
          <span className="footer-label">VISIT US</span>
          <div className="footer-divider-mini" />
          <p>
            Cross Cut Road, Gandhipuram
            <br />
            Coimbatore, Tamil Nadu 641012
          </p>
          <a
            href="https://maps.google.com/?q=Cross+Cut+Road+Gandhipuram+Coimbatore"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-action-link"
          >
            Get directions <ArrowUpRight size={13} />
          </a>
        </div>

        <div className="footer-col">
          <span className="footer-label">GET IN TOUCH</span>
          <div className="footer-divider-mini" />
          <p>
            <a href="tel:+914222551983" className="footer-link">
              +91 422 255 1983
            </a>
            <br />
            <a href="mailto:hello@goodluckpalace.in" className="footer-link">
              hello@goodluckpalace.in
            </a>
          </p>
          <span className="footer-subtext">Direct counter line &amp; inquiries</span>
        </div>

        <div className="footer-col">
          <span className="footer-label">STORE HOURS</span>
          <div className="footer-divider-mini" />
          <p>
            <strong className="text-[#f8ecd6] font-medium text-[15px]">08:00 — 21:30</strong>
            <br />
            Monday through Sunday
          </p>
          <span className="footer-subtext">Open 365 days of the year</span>
        </div>

        <div className="footer-col">
          <span className="footer-label">FOLLOW ALONG</span>
          <div className="footer-divider-mini" />
          <p className="socials">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram <ArrowUpRight size={13} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Facebook <ArrowUpRight size={13} />
            </a>
          </p>
          <span className="footer-subtext">@goodluckpalace.cbe</span>
        </div>
      </div>

      {/* 5. ANIMATED BRAND WORDMARK */}
      <div className="footer-watermark-wrap">
        <div className="footer-watermark" aria-hidden="true">
          GOOD LUCK PALACE
        </div>
      </div>

      {/* 6. COPYRIGHT & METADATA */}
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Good Luck Palace. All rights reserved.</span>
        <span className="footer-credit">Handcrafted for Coimbatore · Cross Cut Road</span>
      </div>
    </footer>
  );
}
