"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  Wallet,
  BarChart2,
  FileText,
  Box,
  Users,
  AppWindow,
  BarChart,
  Settings,
  CalendarRange,
  User,
  ChevronDown,
  ChevronRight,
  Building,
  Sparkles,
  TrendingUp,
  FolderTree,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const menuSections = [
  {
    name: "Général",
    items: [{ name: "Tableau de Bord", href: "/", icon: Home }],
  },
  {
    name: "Finances",
    items: [
      { name: "Comptes", href: "/accounts", icon: Wallet },
      { name: "Revenus & Dépenses", href: "/transactions", icon: TrendingUp },
      { name: "Catégories", href: "/transaction-categories", icon: FolderTree },
      {
        name: "Dépenses Fixes & Revenus Récurrents",
        href: "/recurring-operations",
        icon: CalendarRange,
      },
      { name: "Facturation", href: "/invoices", icon: FileText },
    ],
  },
  {
    name: "Gestion",
    items: [
      { name: "Actifs Matériels", href: "/assets", icon: Box },
      { name: "Matériel Employés", href: "/employee-assets", icon: Users },
    ],
  },
  {
    name: "Analytique",
    items: [{ name: "Rapports", href: "/rapport", icon: BarChart }],
  },
  {
    name: "Système",
    items: [
      { name: "Applications UN-IT", href: "/applications", icon: AppWindow },
      { name: "Administration", href: "/Admindashboard", icon: Settings },
    ],
  },
];

interface MenuSectionProps {
  section: {
    name: string;
    items: {
      name: string;
      href: string;
      icon: React.ElementType;
    }[];
  };
  pathname: string;
  isCollapsed: boolean;
}

const MenuSection = ({ section, pathname, isCollapsed }: MenuSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (isCollapsed) {
    return (
      <div className="space-y-1">
        <div className="px-2 py-1">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>
        {section.items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center p-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                }
              `}
              title={item.name}
            >
              <Icon className="h-5 w-5" />
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
      >
        <span>{section.name}</span>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-1">
          {section.items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200"
                  }
                `}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    active ? "text-white" : "text-gray-500"
                  }`}
                />
                <span className="flex-1">{item.name}</span>
                {active && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full ml-2" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      {/* Overlay pour mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <div className="text-center">
              {/* Icône d'alerte */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              {/* Titre et message */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmer la déconnexion
              </h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
              </p>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Se déconnecter
                </button>
              </div>

              {/* Message d'information */}
              <p className="text-xs text-gray-500 mt-4">
                Vous pourrez vous reconnecter à tout moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar principale */}
      <aside
        className={`
        fixed lg:sticky top-0 h-screen
        bg-white border-r border-gray-200/60
        flex flex-col
        transition-all duration-300 ease-in-out
        shadow-xl lg:shadow-sm
        overflow-y-auto
        z-50
        ${isCollapsed ? "w-20" : "w-80"}
        ${isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
      `}
      >
        {/* Header avec logo et toggle */}
        <div className="flex-shrink-0 px-6 py-6 border-b border-gray-200/60">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              isCollapsed ? "flex-col space-y-3" : "flex-row"
            }`}
          >
            {/* Logo */}
            <div
              className={`flex items-center transition-all duration-300 ${
                isCollapsed ? "flex-col space-y-2" : "space-x-3"
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full border-2 border-white flex items-center justify-center">
                  <Sparkles className="h-2 w-2 text-white" />
                </div>
              </div>

              {!isCollapsed && (
                <div className="flex flex-col">
                  <h1 className="text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-700 bg-clip-text text-transparent">
                    UN-IT
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">
                    Business Suite
                  </p>
                </div>
              )}
            </div>

            {/* Toggle Button */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 rounded-lg border border-gray-300/50 bg-white/80 hover:bg-gray-50/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md ${
                isCollapsed ? "lg:flex hidden" : "flex"
              }`}
            >
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                  isCollapsed ? "rotate-90" : "-rotate-90"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Navigation avec scroll indépendant */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {menuSections.map((section) => (
            <MenuSection
              key={section.name}
              section={section}
              pathname={pathname}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Footer/Bottom Section avec bouton de déconnexion */}
        <div
          className={`flex-shrink-0 p-4 border-t border-gray-200/60 ${
            isCollapsed ? "px-3" : "px-4"
          }`}
        >
          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            } p-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 group`}
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.name || "Utilisateur"}
                    </span>
                    <span className="text-xs text-gray-500">Connecté</span>
                  </div>
                </div>
                {/* Icône de déconnexion subtile */}
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </div>
              </>
            ) : (
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                {/* Tooltip en mode collapsed */}
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 top-1/2 transform -translate-y-1/2">
                  Se déconnecter
                </span>
              </div>
            )}
          </button>

          {/* Info supplémentaire en mode non-collapsed */}
          {!isCollapsed && (
            <p className="text-xs text-gray-500 mt-2 px-2">
              Cliquez pour vous déconnecter
            </p>
          )}
        </div>
      </aside>

      {/* Mobile menu button */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed bottom-4 left-4 z-40 lg:hidden w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </>
  );
}
