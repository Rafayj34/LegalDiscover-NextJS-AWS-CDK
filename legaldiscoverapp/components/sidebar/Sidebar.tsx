"use client";

import Link from "next/link";
import { useState } from "react";
import { Images } from "@/public/assets/index";
import { CustomImage } from "../common/image/CustomImage";
import {
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  LogOut,
  Menu,
} from "lucide-react";
import { navigationTabs } from "@/lib/sidebar-data";

type ExpandedStates = {
  [key: string]: boolean;
};

export const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedStates, setExpandedStates] = useState<ExpandedStates>(
    navigationTabs.reduce((acc, tab) => {
      acc[tab.section.name] = true;
      return acc;
    }, {} as ExpandedStates)
  );

  const handleToggle = (name: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <>
      <div className="md:hidden p-4">
        <Menu
          size={35}
          onClick={() => setMobileOpen(true)}
          className="cursor-pointer bg-accent text-white p-2 rounded-xl"
        />
      </div>

      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 md:hidden z-40"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-72 md:w-[256px] z-50 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white transform transition-transform duration-300 flex flex-col md:h-full md:relative 
          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center gap-3 p-4 border-b border-blue-700 flex-shrink-0">
          <div className="bg-white rounded-[8px] w-[32px] h-[32px] p-1.5 flex justify-center items-center">
            <CustomImage
              src={Images.logo}
              alt="LegalDiscover"
              className="bg-white rounded-[8px] w-[32px] h-[32px]"
            />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">LegalDiscover</h2>
            <p className="text-xs text-blue-200">AI-Powered Legal Platform</p>
          </div>

          <ChevronLeft
            size={16}
            onClick={() => setMobileOpen(false)}
            className="cursor-pointer"
          />
        </div>

        <div className="max-h-[72vh] px-2 overflow-y-auto flex-1 scrollbar-hide">
          {navigationTabs.map((group, idx) => {
            const sectionName = group.section.name;
            const isExpanded = expandedStates[sectionName]

            return (
              <div key={idx}>
                <div
                  className="flex cursor-pointer text-[#bfdbfe] hover:text-white items-center py-2 mt-4 mb-2 px-3"
                  onClick={() => handleToggle(sectionName)}
                >
                  {group.section.icon}
                  <h3 className="text-xs font-medium uppercase px-2">
                    {sectionName}
                  </h3>

                  {isExpanded ? (
                    <ChevronUp size={15} className="ml-auto transition-transform duration-200" />
                  ) : (
                    <ChevronDown size={15} className="ml-auto transition-transform duration-200" />
                  )}
                </div>

                {isExpanded &&
                  <div className="space-y-1">
                    {group.items.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-blue-200 hover:bg-primary-blue hover:text-white`}
                      >
                        {item.icon}
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                }
              </div>
            );
          })}
        </div>
        <div className="bg-primary-blue/30 text-blue-200 rounded-lg p-4 m-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary-blue rounded-full w-10 h-10 flex justify-center items-center">
              T
            </div>
            <div>
              <p className="text-sm font-medium text-white">Test User</p>
              <p className="text-xs capitalize">User Role</p>
            </div>
          </div>
          <div className="flex items-center cursor-pointer gap-2 mt-3 text-xs">
            <LogOut size={15} />
            Logout
          </div>
        </div>
      </aside>
    </>
  );
};
