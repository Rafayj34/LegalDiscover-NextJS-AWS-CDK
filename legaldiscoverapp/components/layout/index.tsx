import { PropsWithChildren } from 'react';
import { Sidebar } from "./sidebar"
import { Header } from "./header";

type AppLayoutProps = PropsWithChildren<{}>

export const AppLayout = ({ children }: AppLayoutProps) => {
    return (
        <div className="h-screen grid md:grid-cols-[256px_1fr] grid-cols-[56px_1fr] overflow-hidden">
            <Sidebar />
            <div className="flex flex-col h-full">
                <Header />
                {children}
            </div>
        </div>
    )
}
