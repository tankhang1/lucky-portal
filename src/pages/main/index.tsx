import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator"; // Optional: for visual separation
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger, // 1. Import SidebarTrigger
} from "@/components/ui/sidebar";

import { Outlet } from "react-router-dom";

export default function MainPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 55)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* 2. Add a Header containing the Trigger */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* You can add Breadcrumbs or Page Title here */}
          </div>
        </header>

        {/* 3. Wrap Outlet in a container for padding */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
