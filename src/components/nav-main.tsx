import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Icon } from "@tabler/icons-react";
import { NavLink, useLocation } from "react-router-dom";

type NavItem = {
  title: string;
  url: string;
  icon?: Icon;
  badge?: string | number; // optional
};

export function NavMain({
  items,
  label = "Menu",
}: {
  items: NavItem[];
  label?: string;
}) {
  const { pathname } = useLocation();

  const isItemActive = (url: string) =>
    pathname === url || pathname.startsWith(url + "/");

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground">
        {label}
      </SidebarGroupLabel>

      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => {
            const active = isItemActive(item.url);
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={active}
                  className={[
                    "relative h-10 rounded-sm transition ",
                    "hover:bg-muted/70",
                    "focus-visible:ring-2 focus-visible:ring-offset-2",
                    // Active styles:
                    "data-[active=true]:bg-white data-[active=true]:text-foreground",
                    "data-[active=true]:shadow-sm data-[active=true]:ring-1 data-[active=true]:ring-primary/20",
                  ].join(" ")}
                >
                  <NavLink
                    to={item.url}
                    className="flex w-full items-center gap-2"
                  >
                    {/* Left active indicator */}
                    {active && (
                      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-primary" />
                    )}

                    {/* Icon */}
                    {item.icon && (
                      <item.icon className="h-4 w-4 shrink-0 opacity-80 group-data-[active=true]:opacity-100" />
                    )}

                    {/* Title */}
                    <span className="truncate">{item.title}</span>

                    {/* Badge (optional) */}
                    {item.badge != null && String(item.badge) !== "" && (
                      <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
