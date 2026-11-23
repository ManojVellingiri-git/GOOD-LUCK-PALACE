import Seo from "@/components/Seo";
import { useSettings } from "@/lib/useSettings";

const MILESTONES = [
  { year: "1983", text: "Good Luck Palace opens its doors on Cross Cut Road, Gandhipuram — a modest counter serving the neighbourhood's daily needs." },
  { year: "1990s", text: "The store grows into a full departmental destination — provisions, cosmetics and toiletries under one roof." },
  { year: "2000s", text: "Premium aisles arrive: perfumes, branded beauty and handpicked dry fruits for Coimbatore's festive seasons." },
  { year: "Today", text: "Three generations of customers, the same promise — genuine goods, honest prices, familiar faces. Now online, for delivery across the city." },
];

export default function About() {
  const { settings } = useSettings();
  return (
    <div className="paper-grain">
      <Seo
        title="About Us — Good Luck Palace, Cross Cut Road Since 1983 | Coimbatore"
        description="The story of Good Luck Palace — Coimbatore's trusted departmental store on Cross Cut Road, Gandhipuram since 1983. Groceries, cosmetics, perfumes and dry fruits, served with four decades of trust."
      />
      <section className="bg-heritage py-16 text-center text-[#FAF7F2]">
        <div className="mx-auto max-w-3xl px-4">
          <p className="font-mono text-xs tracking-widest text-[#FDE68A]">EST. 1983 · COIMBATORE</p>
          <h1 className="mt-3 font-heading text-4xl font-bold sm:text-5xl">Four Decades of Neighbourly Trust</h1>
          <p className="mt-4 text-[#D6D3D1]">
            What began as a single counter on Cross Cut Road is today a departmental institution —
            {settings.store_name}, serving Gandhipuram and beyond.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12" data-testid="about-story">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-[#1C1917]">Our Story</h2>
            <p className="mt-4 leading-relaxed text-[#57534E]">
              In 1983, when Gandhipuram was still finding its feet as Coimbatore's commercial heart,
              Good Luck Palace opened with a simple idea: know your customers by name, stock only what
              you would use at home, and never let a bill surprise anyone. Word travelled — from
              apartment kitchens to wedding halls, the store became the neighbourhood's pantry,
              perfume counter and gift-wrapping desk all at once.
            </p>
            <p className="mt-4 leading-relaxed text-[#57534E]">
              Today the shelves hold over a thousand products — from everyday staples to premium
              cosmetics, signature perfumes and hand-packed dry fruits. The counter team still weighs,
              wraps and recommends the way they did in 1983; now you can also order from your phone,
              pay online, and track the delivery to your door.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-[#1C1917]">Milestones</h2>
            <ol className="mt-4 space-y-6 border-l-2 border-[#E7E2DA] pl-6" data-testid="about-milestones">
              {MILESTONES.map((m) => (
                <li key={m.year} className="relative">
                  <span className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-[#B45309] bg-white" />
                  <p className="font-mono text-sm font-bold text-[#991B1B]">{m.year}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#57534E]">{m.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3" data-testid="about-values">
          {[
            { t: "Genuine Goods", d: "Authorised brands only — if we wouldn't buy it, we won't sell it." },
            { t: "Fair Prices", d: "Transparent everyday pricing; genuine value without fine print." },
            { t: "Personal Service", d: "Recommendations, gift-wrapping and bulk orders — ask at the counter or on WhatsApp." },
          ].map((v) => (
            <div key={v.t} className="rounded-xl border border-[#E7E2DA] bg-white p-5 shadow-[0_4px_20px_rgba(28,21,18,0.06)]">
              <h3 className="font-heading text-lg font-semibold text-[#991B1B]">{v.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#57534E]">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
