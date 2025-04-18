import { React, useEffect, useState } from "react";
import "../assets/dash-sidebar.css";

export default function DashBoardSideBar() {
    return (
        <div className="dashboard-sidebar">
            <a>Servers</a>
            <a>Players</a>
            <a>Users and permissions</a>
            <a>Programs</a>

            <a className="dashboard-sidebar-bottom">Configurations</a>
            <a className="dashboard-sidebar-bottom">Logout</a>
        </div>
    );
}
