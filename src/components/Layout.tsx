import {
  Activity,
  BookOpen,
  Calendar,
  Dumbbell,
  Home,
  LogOut,
  Menu,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { path: "/", icon: Home, label: "Inicio" },
    { path: "/tracking", icon: Activity, label: "Seguimiento" },
    { path: "/routines", icon: BookOpen, label: "Rutinas" },
    { path: "/weekly-planner", icon: Calendar, label: "Plan Semanal" },
    { path: "/challenges", icon: Trophy, label: "Retos" },
    { path: "/social", icon: Users, label: "Comunidad" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const isTrackingPage = location.pathname === "/tracking";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="bg-[#141414] border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to="/tracking"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Dumbbell className="w-6 h-6" />
                <span className="text-xl font-thin">TRACER</span>
              </Link>

              <nav className="hidden md:flex ml-10 space-x-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-light transition-all duration-300 ${
                      location.pathname === item.path
                        ? "bg-white text-[#0a0a0a]"
                        : "text-gray-400 hover:text-white hover:bg-[#1f1f1f]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-gray-400 font-light">
                  {profile?.username}
                </span>
                {profile?.role === "coach" && (
                  <span className="text-xs px-2 py-1 bg-white text-[#0a0a0a] rounded-sm font-light">
                    COACH
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut()}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white transition-colors duration-300"
              >
                <LogOut className="w-4 h-4" />
              </button>

              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors duration-300"
              >
                {menuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#1f1f1f] bg-[#141414]">
            <div className="px-4 py-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-4 py-3 rounded-sm text-sm font-light transition-all duration-300 flex items-center gap-2 ${
                    location.pathname === item.path
                      ? "bg-white text-[#0a0a0a]"
                      : "text-gray-400 hover:text-white hover:bg-[#1f1f1f]"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => signOut()}
                className="w-full px-4 py-3 rounded-sm text-sm font-light text-gray-400 hover:text-white hover:bg-[#1f1f1f] transition-all duration-300 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}
      </nav>

      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${
          isTrackingPage ? "h-[calc(100vh-4rem)]" : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
}
