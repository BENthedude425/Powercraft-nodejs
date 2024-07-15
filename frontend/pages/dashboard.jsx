import {React} from "react";

import SideBar from "../src/components/SideBar";
import Header from "../src/components/Header";

import "../src/assets/dashboard.css";
import "../src/assets/main.css";
import "../src/assets/app.css"

export default function PDashboard(){
    return(
        <div className="dashboard-page">
            <SideBar />
            
            <div className="dashboard-right">
                <Header />
                
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        container
                    </div>
                </div>

            </div>
        </div>
    )
}