import QuickStatCards from "@/components/overview/QuickStatCards";
import { Fox } from "@/components/watermark/Fox";

const OverviewPage = () => {
  return (
    <div className="relative min-h-screen bg-background p-8">
      <div className="flex items-center">
        <Fox
          aria-hidden
          size="80%"
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] m-auto"
          style={{ color: "hsl(var(--sidebar-foreground))" }}
          nodeFill="hsl(var(--sidebar-foreground))"
        />
      </div>
      <h1 className="relative z-10 pl-2 pb-8">Overview</h1>
      <QuickStatCards />
    </div>
  );
};

export default OverviewPage;
