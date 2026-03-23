import NavSidebar from "@/components/layout/NavSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export default function DashboardLayout() {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-svh w-full">
        <NavSidebar />
        <main className="flex-1">
          <Outlet />
          <Toaster position="bottom-left" />
        </main>
      </div>
    </SidebarProvider>
  );
}
