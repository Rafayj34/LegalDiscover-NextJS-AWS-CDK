import { Header } from "../../common/header";
import { Sidebar } from "../../sidebar"

export const DashboardLayout = () => (
    <div className="h-screen grid md:grid-cols-[256px_1fr] grid-cols-[56px_1fr] overflow-hidden">
        <Sidebar />
        <div className="flex flex-col h-full">
            <Header />
        </div>
    </div>
)
