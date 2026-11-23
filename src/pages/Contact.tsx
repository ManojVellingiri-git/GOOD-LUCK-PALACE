import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Button } from "@/components/ui/button";
import Seo from "@/components/Seo";
import { useSettings } from "@/lib/useSettings";
import { waHello } from "@/lib/whatsapp";

const MAP_QUERY = "Good Luck Palace, Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012";

export default function Contact() {
  const { settings } = useSettings();
  return (
    <div className="paper-grain">
      <Seo
        title="Contact Us — Good Luck Palace, Cross Cut Road, Gandhipuram, Coimbatore"
        description="Visit Good Luck Palace at Cross Cut Road, Gandhipuram, Coimbatore (opposite Ramraj Textiles). Call +91 422 223 6592. Open Mon–Sat 10 AM–9 PM, Sunday 4–9 PM. Directions on Google Maps."
      />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="font-heading text-4xl font-semibold text-[#1C1917]" data-testid="contact-title">Contact Us</h1>
        <p className="mt-2 max-w-2xl text-[#57534E]">
          Come by the store, call ahead to check stock, or message us on WhatsApp — a real person replies, usually within minutes during shop hours.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-5" data-testid="contact-info">
            <div className="flex gap-4 rounded-xl border border-[#E7E2DA] bg-white p-5 shadow-[0_4px_20px_rgba(28,21,18,0.06)]">
              <MapPin className="h-6 w-6 shrink-0 text-[#991B1B]" />
              <div>
                <h2 className="font-heading text-lg font-semibold">Store Address</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#57534E]">
                  {settings.address_lines.map((l) => <span key={l} className="block">{l}</span>)}
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-[#E7E2DA] bg-white p-5 shadow-[0_4px_20px_rgba(28,21,18,0.06)]">
              <Phone className="h-6 w-6 shrink-0 text-[#991B1B]" />
              <div>
                <h2 className="font-heading text-lg font-semibold">Phone</h2>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="mt-1 block font-mono text-sm text-[#991B1B] hover:underline" data-testid="contact-phone">{settings.phone}</a>
                <a href={waHello(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#16A34A] hover:underline" data-testid="contact-whatsapp">
                  <SiWhatsapp className="h-4 w-4" /> Chat on WhatsApp instead
                </a>
              </div>
            </div>

            <div className="flex gap-4 rounded-xl border border-[#E7E2DA] bg-white p-5 shadow-[0_4px_20px_rgba(28,21,18,0.06)]">
              <Clock className="h-6 w-6 shrink-0 text-[#991B1B]" />
              <div>
                <h2 className="font-heading text-lg font-semibold">Shop Hours</h2>
                <ul className="mt-1 space-y-0.5 text-sm text-[#57534E]" data-testid="contact-hours">
                  {settings.hours.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAP_QUERY)}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-directions"
            >
              <Button className="w-full bg-[#991B1B] text-white hover:bg-[#7F1D1D]" size="lg">
                <Navigation className="mr-2 h-4 w-4" /> Get Directions on Google Maps
              </Button>
            </a>
          </div>

          {/* Map */}
          <div className="overflow-hidden rounded-2xl border border-[#E7E2DA] bg-white shadow-[0_4px_20px_rgba(28,21,18,0.06)]" data-testid="contact-map-panel">
            <iframe
              title="Good Luck Palace on Google Maps — Cross Cut Road, Gandhipuram, Coimbatore"
              src={`https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`}
              className="h-[420px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              data-testid="contact-map"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
