import { React } from "react";
import Cookies from "universal-cookie";

import "../assets/header.css";

export default function Header() {
    return (
        <div className="header">
            <img src="../pictures/apple.png" href="/" onClick={Home} />
            <div className="options">
                <span
                    onClick={() => {
                        Redirect("dashboard");
                    }}
                >
                    Servers
                </span>
                <span
                    onClick={() => {
                        Redirect("players");
                    }}
                >
                    Players
                </span>

                <span
                    onClick={() => {
                        Redirect("users");
                    }}
                >
                    Users and permissions
                </span>
                <span
                    onClick={() => {
                        Redirect("programs");
                    }}
                >
                    Programs
                </span>
                <span
                    onClick={() => {
                        Redirect("configurations");
                    }}
                >
                    Configurations
                </span>
                <span onClick={LogOut}>Logout</span>
            </div>
        </div>
    );
}

function Redirect(path) {
    document.location.href = path;
}

// Redirect home
function Home() {
    document.location.href = "/dashboard";
}

// Log the user out and redirect to login page
function LogOut() {
    // Check if the user wants to log out
    if (!window.confirm("Are you sure you want to log out ?")) {
        return;
    }
    const cookies = new Cookies();

    cookies.set("auth_token", null);
    document.location.href = "/login";
}
