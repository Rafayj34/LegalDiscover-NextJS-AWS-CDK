import { Bell, MessageSquare, Plus, ShieldCheck, User } from "lucide-react";

export const Header = () => {

  const actions = [
    <Plus size={20} />,
    <MessageSquare size={20} />,
    <Bell size={20} />
  ]
  return (
    <header className="flex items-center justify-between h-16 w-[84.5%] px-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">
        AI Search
      </h2>

      <div className="flex items-center space-x-4">
        <div className="flex items-center px-3 py-1.5 rounded-[8px] bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors">
          <ShieldCheck size={16} className="mr-1" />
          Secure Session
        </div>

        <div className="flex items-center space-x-2.5 text-medium-gray">
          {actions.map((i, index) => (
            <div
              key={index}
              className="cursor-pointer p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-700 transition-colors"
            >
              {i}
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
};