import { lazy, React, useEffect, useState } from "react";
import "../src/assets/server-dashboard.css";

import Header from "../src/components/CHeader";
import { GetAPIAddr } from "../src/assets/APIactions";
import GetStatusColor from "../src/components/CGetStatusColor";
import {PlayerList} from "../src/components/CPlayerList"

const APIADDR = GetAPIAddr();
let serverID = window.location.href.split("#");
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

            <button
                onClick={() => {
                    window.location = `../server-properties#${serverID}`;
                }}
            >
                Edit server properties
            </button>
        </div>
    );
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

export default function PServerDashboard() {
    const [terminalData, setTerminalData] = useState("");
    const [serverStatusStyle, setServerStatus] = useState();
    const [serverData, setServerData] = useState({ Loading: "data" });

    let keyID = 0;

    useEffect(() => {
        LongPollTerminal(0);
        LongPollServerData(0);
    }, []);

    // Make the server terminal scroll to bottom on update
    useEffect(() => {
        document.getElementById("server-terminal-content").scrollTop =
            document.getElementById("server-terminal-content").scrollHeight;
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
        var splitTerminalData = terminalData.split("\n");
        return (
            <div id="server-terminal" className="server_terminal">
                <div id="server-terminal-content" className="server_terminal_content_area">
                    {splitTerminalData.map((string) => {
                        keyID++;

                        if (
                            splitTerminalData.indexOf(string) ==
                            splitTerminalData.length - 1
                        ) {
                            return (
                                <>
                                    <TerminalText
                                        terminalData={terminalData}
                                        string={string}
                                        key={keyID}
                                    />
                                </>
                            );
                        }

                        return (
                            <TerminalText
                                terminalData={terminalData}
                                string={string}
                                key={keyID}
                            />
                        );
                    })}
                </div>

                <div className="server_terminal_input_area">
                    &gt;
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
                        autoComplete="off"
                    />
                </div>
            </div>
        );
    }

    function InformationPanel(props) {
        return (
            <div className="panel">
                <div className="flex-container">
                    <b>{props.serverData.server_name}</b>
                    <span className="flex-end">
                        {props.serverData.server_status}{" "}
                        <span
                            className="status_light"
                            style={serverStatusStyle}
                        ></span>
                    </span>
                </div>
                <div style={{borderBottom: "3px solid var(--OpaicGrey)", borderRadius: "2px"}}>
                    <span>{props.serverData.server_launcher_type} </span>
                    <span>{props.serverData.server_version} </span>
                    <i>{props.serverData.forge_release}</i>
                </div>
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

                    return PanelLabel(
                        key.split("_").join(" "),
                        props.serverData[key]
                    );
                })}
            </div>
        );
    }

    function PanelLabel(key, value) {
        if (value == null) {
            return;
        }
        return (
            <div className="panel_label" key={key}>
                <b>{key}</b> <span>{value}</span>
            </div>
        );
    }

    return (
        <>
            <div style={{ overflow: "hidden", height: "100%" }}>
                <Header />
                <div className="server-dash-container">
                    <div className="server-dash-container-main">
                        <Terminal />

                        <div className="information-container">
                            <InformationPanel serverData={serverData} />
                            <ControlPanel />
                        </div>
                    </div>

                    <div className="player-list-container">
                        <PlayerList/>
                    </div>
                </div>
            </div>
            <div className="footer"></div>
        </>
    );
}
