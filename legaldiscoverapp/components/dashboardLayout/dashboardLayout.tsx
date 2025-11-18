import { Header } from "../header/header"
import { Sidebar } from "../sidebar/Sidebar"

export const DashboardLayout = () => (
    <div className="flex text-white">
        <Sidebar />
        <Header />
    </div>
)
