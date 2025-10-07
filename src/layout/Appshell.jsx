import React from "react";
// import Navbar from "./Navbar";
// import Footer from "./Footer";
import { Outlet } from "react-router-dom";

function AppShell() {
    return (
        <div>
            {/* <Navbar /> */}
            <main className="p-1">
                <Outlet />
            </main>
            {/* <Footer /> */}
        </div>
    );
}
export default AppShell;