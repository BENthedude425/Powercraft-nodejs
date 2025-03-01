import { React } from "react";

import Header from "../src/components/CHeader";
import ServerList from "../src/components/CServerList";


import "../src/assets/dashboard.css";
import "../src/assets/main.css";

export default function PDashboard() {
    return (
        <div className="dashboard-page">

            <div className="dashboard-right">
                <Header />

                <div className="dashboard-content">
                    <ServerList />
                </div>
            </div>
        </div>
    );
}
