import { React, useEffect, useState } from "react";
import "../src/assets/server-dashboard.css";

import Header from "../src/components/CHeader";
import {GetAPIAddr} from "../src/assets/APIactions";
import GetStatusColor from "../src/components/CGetStatusColor";

const APIADDR = GetAPIAddr();
let serverID = window.location.href.split("/");
serverID = serverID[serverID.length - 1];

function SendControl(action) {
    const terminalInputDOM = document.getElementById("server-terminal-input");
    const input = terminalInputDOM.value;

    if (action == "input") {
        fetch(`${APIADDR}/api/input-server-terminal/${input}/${serverID}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                if (responseJSON[0] != "success") {
                    alert(responseJSON[1]);
                    return;
                }
                terminalInputDOM.value = "";
            });
        });
        return;
    }

    fetch(`${APIADDR}/api/set-server-control/${action}/${serverID}`, {
        credentials: "include",
    }).then((response) => {
        response.json().then((responseJSON) => {
            if (responseJSON[0] != "success") {
                alert(responseJSON[1]);
                return;
            }
        });
    });
}

function ControlPanel() {
    return (
        <div className="control_panel">
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
        </div>
    );
}

export default function PServerDashboard() {
    const [terminalData, setTerminalData] = useState("");
    const [serverStatusStyle, setServerStatus] = useState();
    const [serverData, setServerData] = useState({ Loading: "data" });
    const [controlPanelDOM, setControlPanelDOM] = useState(<ControlPanel />);

    let keyID = 0;

    useEffect(() => {
        LongPollTerminal(0);
        LongPollServerData(0);
    }, []);

    // Make the server terminal scroll to bottom on update
    useEffect(() => {
        document.getElementById("server-terminal").scrollTop =
            document.getElementById("server-terminal").scrollHeight;
    });

    function LongPollTerminal(terminalLines) {
        fetch(
            `${APIADDR}/api/get-server-terminal/${terminalLines}/${serverID}`,
            {
                credentials: "include",
            }
        ).then((response) => {
            response.json().then((responseJSON) => {
                setTerminalData(responseJSON[1].join("\n"));

                LongPollTerminal(responseJSON[0]);
            });
        });
    }

    function LongPollServerData(checkSum) {
        fetch(`${APIADDR}/api/LP-get-server-data/${checkSum}/${serverID}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                setServerData(responseJSON[1]);

                const style = GetStatusColor(responseJSON[1].server_status);
                setServerStatus(style);

                LongPollServerData(responseJSON[0]);
            });
        });
    }

    function Terminal() {
        return (
            <div id="server-terminal" className="server_terminal">
                {terminalData.split("\n").map((string) => {
                    keyID++;

                    return (
                        <TerminalText
                            terminalData={terminalData}
                            string={string}
                            key={keyID}
                        />
                    );
                })}
            </div>
        );
    }
    // Takes the server data object and returns formatted data
    function Panel(props) {
        return (
            <div className="panel">
                <span className="status_light" style={serverStatusStyle}></span>
                {Object.keys(props.serverData).map((key) => {
                    // Choose which keys to ignore
                    switch (key) {
                        case "server_executable_path":
                            return;
                        case "server_icon_path":
                            return;
                        case "ID":
                            return;
                    }

                    return PanelLabel(key, props.serverData[key]);
                })}

                {controlPanelDOM}
            </div>
        );
    }

    function PanelLabel(key, value) {
        if (value == null) {
            return;
        }
        return (
            <div className="panel_label" key={key}>
                <span>{key}</span> <b>{value}</b>
            </div>
        );
    }

    return (
        <>
            <Header />

            <div className="flexbox">
                <Terminal />

                <Panel serverData={serverData} />
            </div>
            <input
                className="server_terminal_input"
                id="server-terminal-input"
                onKeyDown={(event) => {
                    if (event.key == "Enter") {
                        SendControl("input");
                    }
                }}
                spellCheck="false"
                type="text"
            />

            <button
                onClick={() => {
                    const splitURL = window.location.href.split("/");
                    const serverID = splitURL[splitURL.length - 1];

                    window.location = `../server-properties/${serverID}`;
                }}
            >
                Edit server properties
            </button>
        </>
    );
}

function x() {
    <div className="row2">
        <button
            onClick={() => {
                const splitURL = window.location.href.split("/");
                const serverID = splitURL[splitURL.length - 1];

                window.location = `../server-properties/${serverID}`;
            }}
        >
            Edit server properties
        </button>
    </div>;
}

function TerminalText(props) {
    if (props.terminalData == "") {
        return;
    }

    return (
        <a className="terminal_text">
            {props.string}
            <br />
        </a>
    );
}
