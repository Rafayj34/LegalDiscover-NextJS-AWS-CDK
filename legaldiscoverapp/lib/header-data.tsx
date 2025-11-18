import { Bell, MessageSquare, Plus } from "lucide-react";

export const actions = [
    { icon: <Plus size={20} />, label: "Create New" },
    { icon: <MessageSquare size={20} />, label: "View Messages" },
    { icon: <Bell size={20} />, label: "View Notifications", badge: 2 },
];

