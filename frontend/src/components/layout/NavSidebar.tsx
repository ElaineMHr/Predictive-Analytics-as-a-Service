import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "../theme";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { navItems } from "./nav-items.constants";

{
  /* To be replaced! */
}
const user = {
  name: "John",
  lastName: "Doe",
  imageUrl: "/images/man.png",
  role: "Admin",
};
{
  /* End of to be replaced! */
}

const NavSidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="bg-sidebar text-sidebar-foreground"
    >
      {/* Header */}
      <SidebarHeader
        className={cn(
          "w-full items-center justify-between",
          collapsed ? "flex flex-col gap-2 p-1" : "flex flex-row p-2"
        )}
      >
        <ThemeToggle />
        {/* Toggle */}
        <Button
          onClick={toggleSidebar}
          variant={"ghost"}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "inline-flex items-center justify-center rounded-md transition",
            collapsed ? "h-7 w-7" : "h-8 w-8",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground active:font-semibold"
                    >
                      <Link to={item.href}>
                        <Icon className="h-4 w-4 flex-none" />
                        {!collapsed && (
                          <span className="ml-2 truncate">{item.label}</span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t pt-3">
        <div className="flex items-center">
          <img
            src={user?.imageUrl || "/images/user.png"}
            alt={user?.name || "Unknown User"}
            className="h-10 w-10 rounded-full object-cover"
          />

          {!collapsed && (
            <article className="ml-2">
              <h2 className="truncate text-sm font-medium">
                {user?.name} {user?.lastName}
              </h2>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </article>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default NavSidebar;
