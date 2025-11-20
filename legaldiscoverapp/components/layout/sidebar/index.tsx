"use client";

import Link from "next/link";
import { useState } from "react";
import { Images } from "@/public/assets/index";
import { CustomImage } from "../../common/image";
import { navigationTabs } from "@/lib/sidebar-data";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, LogOut, Menu } from "lucide-react";

type ExpandedStates = {
  [key: string]: boolean;
};

export const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const handleCollapseToggle = () => {
    setIsCollapsed(prev => !prev);
  };

  const COLLAPSED_WIDTH_MD = "md:w-[80px]";
  const FULL_WIDTH_MD = "md:w-[256px]";
  const hiddenWhenCollapsed = isCollapsed ? "hidden" : "block";

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
        className={`fixed top-0 left-0 h-screen z-50 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white transform transition-all duration-300 flex flex-col md:h-full md:relative 
          ${mobileOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? COLLAPSED_WIDTH_MD : FULL_WIDTH_MD}
        `}
      >
        <div className={`flex items-center gap-3 p-4 border-b border-blue-700 flex-shrink-0 ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="bg-white rounded-[8px] w-[32px] h-[32px] p-1.5 flex justify-center items-center flex-shrink-0">
            <CustomImage
              src={Images.logo}
              alt="LegalDiscover"
              className="bg-white rounded-[8px] w-[32px] h-[32px]"
            />
          </div>
          <div className={`flex-1 overflow-hidden ${hiddenWhenCollapsed}`}>
            <h2 className="text-lg font-bold whitespace-nowrap">LegalDiscover</h2>
            <p className="text-xs text-blue-200 whitespace-nowrap">AI-Powered Legal Platform</p>
          </div>

          {isCollapsed ? (
            <ChevronRight
              size={16}
              onClick={handleCollapseToggle}
              className={`cursor-pointer absolute top-1/2 -right-[12px] transform -translate-y-1/2 bg-[#1e3b9a] w-[12px] h-[70px] rounded-r-[3px] hidden md:block`}
            />
          ) : (
            <ChevronLeft
              size={16}
              onClick={handleCollapseToggle}
              className={`cursor-pointer hidden md:block`}
            />
          )}
          <ChevronLeft
            size={16}
            onClick={() => setMobileOpen(false)}
            className={`cursor-pointer ${isCollapsed ? 'hidden' : 'md:hidden'}`}
          />
        </div>

        <div className="max-h-[72vh] px-2 overflow-y-auto flex-1 scrollbar-hide">
          {navigationTabs.map((group, idx) => {
            const sectionName = group.section.name;
            const isExpanded = expandedStates[sectionName]

            return (
              <div key={idx}>
                {!isCollapsed &&
                  <div
                    className={`flex cursor-pointer text-[#bfdbfe] hover:text-white items-center py-2 mt-4 mb-2 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
                    onClick={() => handleToggle(sectionName)}
                  >
                    {group.section.icon}
                    <h3 className={`text-xs font-medium uppercase px-2 ${hiddenWhenCollapsed}`}>
                      {sectionName}
                    </h3>

                    {!isCollapsed && (
                      isExpanded ? (
                        <ChevronUp size={15} className="ml-auto transition-transform duration-200" />
                      ) : (
                        <ChevronDown size={15} className="ml-auto transition-transform duration-200" />
                      )
                    )}
                  </div>
                }
                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-in-out
                    ${isExpanded ? "max-h-screen" : "max-h-0"} 
                  `}
                >
                  <div className={`space-y-1 ${isCollapsed && "mt-4 mb-2"}`}>
                    {group.items.map((item, i) => (
                      <Link
                        key={i}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-lg cursor-pointer text-blue-200 hover:bg-primary-blue hover:text-white`}
                      >
                        {item.icon}
                        <span className={`text-sm ${hiddenWhenCollapsed}`}>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className={`bg-primary-blue/30 text-blue-200 rounded-lg p-4 m-4 flex-shrink-0 ${isCollapsed ? 'p-2 m-2' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="bg-primary-blue rounded-full w-10 h-10 flex justify-center items-center flex-shrink-0">
              T
            </div>
            <div className={`overflow-hidden ${hiddenWhenCollapsed}`}>
              <p className="text-sm font-medium text-white whitespace-nowrap">Test User</p>
              <p className="text-xs capitalize whitespace-nowrap">User Role</p>
            </div>
          </div>
          <div className={`flex items-center cursor-pointer gap-2 mt-3 text-xs ${hiddenWhenCollapsed}`}>
            <LogOut size={15} />
            Logout
          </div>
        </div>
      </aside>
    </>
  );
};
