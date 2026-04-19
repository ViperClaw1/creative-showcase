import { ReactNode } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, MessageSquare, Inbox, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin/dashboard", label: "Projects", icon: LayoutGrid },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/messages", label: "Messages", icon: Inbox },
];

const AdminLayout = ({ children }: { children?: ReactNode }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="md:w-60 md:min-h-screen border-b md:border-b-0 md:border-r border-border bg-card">
        <div className="p-6">
          <h2 className="text-lg font-semibold tracking-tight">Admin</h2>
          <p className="text-xs text-muted-foreground truncate mt-1">{user?.email}</p>
        </div>
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-secondary text-secondary-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-6">
          <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-6xl">{children ?? <Outlet />}</main>
    </div>
  );
};

export default AdminLayout;
