import { React, useEffect, useState } from "react";
import "../src/assets/main.css";
import GetAPIAddr from "../src/assets/getAPIAddr";

const APIADDR = GetAPIAddr();
let serverID = window.location.href.split("/");
serverID = serverID[serverID.length - 1];

function SendControl(action) {
    fetch(`${APIADDR}/api/set-server-control/${action}/${serverID}`, {
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
    const serverTerminalDOM = document.getElementById("server_terminal");

    const [serverData, setServerData] = useState("Loading data");
    //const [terminalLines, setTerminalLines] = useState(0);
    const [terminalData, setTerminalData] = useState("");
    const [controlPanelDOM, setControlPanelDOM] = useState(<ControlPanel />);

    function LiveTerminal(terminalLines) {
        fetch(
            `${APIADDR}/api/get-server-terminal/${terminalLines}/${serverID}`,
            {
                credentials: "include",
            }
        ).then((response) => {
            response.json().then((responseJSON) => {
                setTerminalData(responseJSON[1].join("\n"));
                //setTerminalLines(responseJSON[0]);

                LiveTerminal(responseJSON[0]);
            });
        });
    }

    useEffect(() => {
        fetch(`${APIADDR}/api/get-server-data/${serverID}`, {
            credentials: "include",
        }).then((response) => {
            response.text().then((responseText) => {
                setServerData(responseText);
            });
        });
        LiveTerminal(0);
    }, []);

    return (
        <div>
            <div id="server_terminal" className="server_terminal">
                {terminalData.split("\n").map((string) => {
                    const x = terminalData.split("\n");

                    if (terminalData == "") {
                        return;
                    }

                    // When the last line is added scroll to bottom
                    if (x.indexOf(string) == x.length - 1) {
                        serverTerminalDOM.scrollTop =
                            serverTerminalDOM.scrollHeight;
                    }

                    return (
                        <>
                            {string}
                            <br />
                        </>
                    );
                })}
            </div>
            {serverData}
            <div className="control_panel">{controlPanelDOM}</div>
        </div>
    );
}
