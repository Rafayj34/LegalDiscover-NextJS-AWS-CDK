import { Input } from "../../ui/input";
import { actions } from "@/lib/header-data";
import { Search, ShieldCheck, User } from "lucide-react";
import { Button } from "../../ui/button";
import { AISearchBar } from "@/components/AISearchBar";

export const Header = () => (
  <header className="flex items-center justify-between h-16 px-6 border-b border-gray-200 flex-shrink-0">
    <AISearchBar />
    <div className="flex items-center space-x-4 flex-shrink-0">
      <div className="flex items-center px-3 py-1.5 rounded-[10px] bg-green-50 text-green-700 text-sm font-medium border border-green-200 hover:bg-green-100">
        <ShieldCheck size={16} className="mr-1" />
        Secure Session
      </div>

      <div className="flex items-center space-x-2.5 text-medium-gray">
        {actions.map((action, index) => (
          <div
            key={index}
            aria-label={action.label}
            className="relative p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            {action.icon}
            {action.label === "View Messages" && action.badge && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-500 rounded-full transform translate-x-1/2 -translate-y-1/2">
                {action.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-3 pl-2 border-l ">
        <div className="flex flex-col text-right">
          <p className="text-sm font-medium text-gray-800 leading-none">Test User</p>
          <p className="text-xs capitalize text-medium-gray leading-none">User Role</p>
        </div>

        <div className="flex-shrink-0 bg-accent text-white flex justify-center items-center rounded-full w-10 h-10">
          <User size={20} />
        </div>
      </div>
    </div>
  </header>
);