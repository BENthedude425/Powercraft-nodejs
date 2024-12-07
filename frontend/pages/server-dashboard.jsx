import { React, useEffect, useState } from "react";
import "../src/assets/main.css";
import GetAPIAddr from "../src/assets/getAPIAddr";

const APIADDR = GetAPIAddr();
let serverID = window.location.href.split("/");
serverID = serverID[serverID.length - 1];

function SendControl(action) {
    fetch(`${APIADDR}/api/set-server-control/${serverID}/${action}`, {
        credentials: "include",
    }).then((response) => {
        response.text().then((responseText) => {
            alert(responseText);
        });
    });
}

function ControlPanel() {
    return (
        <>
            <button
                className="start_button"
                onClick={() => {
                    SendControl("start");
                }}
            >
                Start
            </button>

            <button
                className="restart_button"
                onClick={() => {
                    SendControl("restart");
                }}
            >
                Restart
            </button>

            <button
                className="stop_button"
                onClick={() => {
                    SendControl("stop");
                }}
            >
                Stop
            </button>
        </>
    );
}

export default function PServerDashboard() {
    const [serverData, setServerData] = useState("Loading data");
    const [terminalData, setTerminalData] = useState("Loading terminal");
    const [controlPanelDOM, setControlPanelDOM] = useState(<ControlPanel />);

    useEffect(() => {
        fetch(`${APIADDR}/api/get-server-data/${serverID}`, {
            credentials: "include",
        }).then((response) => {
            response.text().then((responseText) => {
                setServerData(responseText);
            });
        });

        fetch(`${APIADDR}/api/get-server-terminal/${serverID}`, {
            credentials: "include",
        }).then((response) => {
            response.text().then((responseText) => {
                setTerminalData(responseText);
            });
        });
    }, []);

    return (
        <div>
            <div className="server_terminal">{terminalData}</div>
            {serverData}
            <div className="control_panel">{controlPanelDOM}</div>
        </div>
    );
}
