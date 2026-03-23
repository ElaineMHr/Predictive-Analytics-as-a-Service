import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { navItems } from "../layout/nav-items.constants";

type StatsResponse = Record<string, number>;

const API_URL = import.meta.env.VITE_API_URL;

const gradients = [
  "from-sky-500 to-sky-600",
  "from-emerald-500 to-emerald-600",
  "from-fuchsia-500 to-fuchsia-600",
  "from-amber-500 to-amber-600",
  "from-indigo-500 to-indigo-600",
  "from-rose-500 to-rose-600",
  "from-teal-500 to-teal-600",
];

const QuickStatCards = () => {
  const [stats, setStats] = useState<StatsResponse>({});
  const [loading, setLoading] = useState(true);

  const items = navItems.filter((_, i) => i !== 0);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch(`${API_URL}/dashboard/stats`);
        const json = await res.json();
        setStats(json);
      } catch {
        setStats({});
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div
      className="
        grid gap-4
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-5
      "
    >
      {items.map(({ key, label, href, icon: Icon }, i) => {
        const gradient = gradients[i % items.length];
        const count = stats[key] ?? 0;

        return (
          <Link
            key={key}
            to={href}
            className={`
              group relative overflow-hidden
              rounded-2xl shadow-sm
              bg-gradient-to-br ${gradient}
              text-white
              transition-transform
              hover:scale-105
              active:scale-95
            `}
          >
            <div className="p-4 h-28 flex flex-col justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded-lg bg-white/15 p-2">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-extrabold tabular-nums leading-none">
                  {loading ? "—" : count}
                </span>
                <span className="text-xs opacity-90 underline decoration-white/50 decoration-dotted group-hover:opacity-100">
                  Open
                </span>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      })}
    </div>
  );
};

export default QuickStatCards;
