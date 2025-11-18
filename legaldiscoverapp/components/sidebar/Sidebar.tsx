"use client";

import Link from "next/link";
import { useState } from "react";
import { Images } from "@/public/assets/index";
import { CustomImage } from "../common/image/CustomImage";
import {
  Brain,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  CircleQuestionMark,
  DollarSign,
  FileText,
  Globe,
  House,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  SquarePen,
  Users,
} from "lucide-react";

const navigationTabs = [
  {
    section: {
      name: "Core Functions",
      icon: <House size={16} />,
    },
    items: [
      { label: "Dashboard", icon: <House size={20} color="rgb(96 165 250)" />, href: "/" },
      { label: "Discovery", icon: <Search size={20} color="rgb(192 132 252)" />, href: "/" },
      { label: "Matters", icon: <FileText size={20} color="rgb(251 146 60)" />, href: "/" },
      { label: "AI Consultant", icon: <Brain size={20} color="rgb(167 139 250)" />, href: "/" },
    ],
  },
  {
    section: { name: "Client Work", icon: <Users size={16} /> },
    items: [
      { label: "Forms", icon: <SquarePen size={20} color="rgb(74 222 128)" />, href: "/" },
      { label: "Messages", icon: <MessageSquare size={20} color="rgb(251 113 133)" />, href: "/" },
    ],
  },
  {
    section: { name: "Management", icon: <Briefcase size={16} /> },
    items: [
      { label: "Finance", icon: <DollarSign size={20} color="rgb(45 212 191)" />, href: "/" },
      { label: "Operations", icon: <Briefcase size={20} color="rgb(34 211 238)" />, href: "/" },
    ],
  },
  {
    section: { name: "System", icon: <Settings size={16} /> },
    items: [
      { label: "Integrations", icon: <Globe size={20} color="rgb(52 211 153)" />, href: "/" },
      { label: "Settings", icon: <Settings size={20} color="rgb(156 163 175)" />, href: "/" },
      { label: "Help & FAQ", icon: <CircleQuestionMark size={20} color="rgb(148 163 184)" />, href: "/" },
    ],
  },
];

export const Sidebar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedStates, setExpandedStates] = useState(
    navigationTabs.reduce((acc, tab) => {
      acc[tab.section.name] = true;
      return acc;
    }, {})
  );

  const handleToggle = (name) => {
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
        className={`fixed md:static top-0 left-0 h-[100vh] w-[17%] z-50 bg-gradient-to-b from-[#1e3a8a] to-[#1e40af] text-white transform transition-transform duration-300 flex flex-col
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

        <div className="px-2 h-[70vh] overflow-y-auto scrollbar-hide">
          {navigationTabs.map((group, idx) => {
            const sectionName = group.section.name;
            const isExpanded = expandedStates[sectionName]

            return (
              <div key={idx}>
                <div
                  className="flex cursor-pointer text-blue-300 hover:text-white items-center mt-[35px] mb-2 px-3"
                  onClick={() => handleToggle(sectionName)}
                >
                  {group.section.icon}
                  <h3 className="text-xs font-medium uppercase px-2">
                    {sectionName}
                  </h3>

                  {isExpanded ? (
                    <ChevronUp size={15} className="ml-auto" />
                  ) : (
                    <ChevronDown size={15} className="ml-auto" />
                  )}
                </div>

                {isExpanded &&
                  group.items.map((item, i) => (
                    <Link
                      key={i}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-blue-200 hover:bg-primary-blue hover:text-white`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  ))}
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