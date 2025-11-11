'use client'
import { useState } from "react";
import SidebarMenu from "./SidebarMenu";

/* --------------------------- Subcomponents --------------------------- */
const Sidebar = ()=>  {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (

            <aside
                className={`fixed z-40 left-0 top-0 h-full w-72 bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-sm ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <div className="flex items-center gap-2 px-5 py-4 border-b">
                    <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                        KC
                    </div>
                    <div>
                        <div className="font-semibold leading-tight">관리자 콘솔</div>
                        <div className="text-xs text-gray-500">Korea Clean Coop</div>
                    </div>
                </div>

                <SidebarMenu />
            </aside>
  );
}
export default Sidebar;
