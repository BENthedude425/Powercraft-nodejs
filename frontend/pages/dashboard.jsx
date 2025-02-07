import {React} from "react";

import Header from "../src/components/CHeader";
import ServerList from "../src/components/CServerList";

import "../src/assets/dashboard.css";
import "../src/assets/main.css";
import "../src/assets/app.css"
import GetAPIAddr from "../src/assets/getAPIAddr";

function RemoveServers(){
    fetch(`${GetAPIAddr()}/api/REMOVESERVERS`, {credentials: "include"}).then((response) =>[
        response.text().then((responseText) =>{
            if(responseText != ""){
                alert(responseText)
            }
        })
    ])
}

export default function PDashboard(){
    return(
        <div className="dashboard-page">
            <ServerList />
            
            <div className="dashboard-right">
                <Header />
                
                <div className="dashboard-container">
                    <div className="dashboard-content">
                        <button onClick={RemoveServers}>
                            Remove Servers (CAN CAUSE CRASH)
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}