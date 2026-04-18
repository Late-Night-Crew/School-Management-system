import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSIdebar";
import { AUTH_TOKEN_KEY } from "../../constants/storageKeys";

export default function AdminAppShell() {
    const location = useLocation();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
            navigate("/login");
        }
    }, [navigate]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 900px)");

        const handleMedia = (event) => {
            setIsMobile(event.matches);
            if (!event.matches) {
                setMenuOpen(false);
            }
        };

        handleMedia(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleMedia);
        } else {
            mediaQuery.addListener(handleMedia);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleMedia);
            } else {
                mediaQuery.removeListener(handleMedia);
            }
        };
    }, []);

    const hideSidebar =
        location.pathname === "/admin/" ||
        location.pathname === "/admin" ||
        location.pathname === "/admin/login";

    const getTitle = () => {
        const value = location.pathname.replace("/admin", "").replace(/\//g, " ").trim();
        if (!value) return "Admin Dashboard";
        return `Admin ${value}`
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    const getInitials = (role) =>
        role
            .split("_")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase();

    return (
        <>
            {isMobile && menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
            <div className="role-page-container">
                {!hideSidebar && (
                    <div
                        className={`role-sidebar-wrapper ${isMobile ? "mobile" : ""}`}
                        style={{ transform: isMobile ? (menuOpen ? "translateX(0)" : "translateX(-100%)") : "none" }}
                    >
                        <AdminSidebar />
                    </div>
                )}
                <div className="role-main-area">
                    <header className="role-fixed-header">
                        <div className="role-title-row">
                            {isMobile && (
                                <button className="role-menu-button" onClick={() => setMenuOpen(!menuOpen)}>
                                    ☰
                                </button>
                            )}
                            <div>
                                <span className="role-meta">National School Management</span>
                                <h1 className="role-title">{getTitle()}</h1>
                            </div>
                        </div>
                        <div className="role-avatar">{getInitials("admin")}</div>
                    </header>
                    <main className="role-content">
                        <Outlet />
                    </main>
                </div>
            </div>
            <style>{`
                .role-page-container {
                    display: flex;
                    min-height: 100vh;
                    background: #f5f7fb;
                }

                .role-sidebar-wrapper {
                    width: 280px;
                    min-width: 280px;
                    position: sticky;
                    top: 0;
                    z-index: 30;
                    height: 100vh;
                    transition: transform 0.3s ease;
                }

                .role-sidebar-wrapper.mobile {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 85%;
                    max-width: 300px;
                    height: 100vh;
                    z-index: 40;
                    box-shadow: 2px 0 20px rgba(0,0,0,0.2);
                }

                .sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    z-index: 35;
                }

                .role-main-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }

                .role-fixed-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 18px;
                    background: #ffffff;
                    border-bottom: 1px solid #e2e8f0;
                    position: fixed;
                    top: 0;
                    left: ${isMobile ? "0" : "280px"};
                    right: 0;
                    width: ${isMobile ? "100%" : "calc(100% - 280px)"};
                    z-index: 15;
                }

                .role-title-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .role-menu-button {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    color: #0f172a;
                    cursor: pointer;
                    font-size: 18px;
                }

                .role-meta {
                    display: block;
                    font-size: 11px;
                    color: #64748b;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }

                .role-title {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #0f172a;
                }

                .role-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: #166534;
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 14px;
                }

                .role-content {
                    padding: 18px;
                    padding-top: 88px;
                }

                @media (max-width: 900px) {
                    .role-page-container {
                        flex-direction: column;
                    }

                    .role-sidebar-wrapper {
                        width: 85%;
                        max-width: 300px;
                    }

                    .role-fixed-header {
                        left: 0;
                        width: 100%;
                    }
                }
            `}</style>
        </>
    );
}
