import { useEffect, useState } from "react";

import DashBoardSideBar from "../src/components/CDashSideBar";
import { DashboardHeader } from "./dashboard";
import { GetAPIAddr } from "../src/assets/APIactions";

const APIADDR = GetAPIAddr();

export default function PServers() {
    const [serverinfo, setserverinfo] = useState({ "no data loaded": false });

    useEffect(() => {
        fetch(`${APIADDR}/db/servers`, { credentials: "include" }).then(
            (response) => {
                response.json().then((responseJSON) => {
                    setserverinfo(responseJSON);
                });
            }
        );
    }, []);

    return (
        <div className="page">
            <div className="main">
                <DashBoardSideBar />
                <div className="dashboard-container">
                    <DashboardHeader />
                    <div className="dashboard-resource-container">
                        <div className="dashboard-heading">Servers</div>

                        {Object.keys(serverinfo).map((serverKey) => {
                            return (
                                <div>
                                    {JSON.stringify(
                                        serverinfo[serverKey],
                                        null,
                                        4
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
