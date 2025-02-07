import { React, useEffect, useState } from "react";
import "../src/assets/main.css";

import Header from "../src/components/CHeader";
import GetAPIAddr from "../src/assets/getAPIAddr";

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
    const [serverTerminalDOM, setServerTerminalDOM] = useState(null)
    const [terminalData, setTerminalData] = useState("");

    const [serverData, setServerData] = useState("Loading data");
    const [controlPanelDOM, setControlPanelDOM] = useState(<ControlPanel />);

    useEffect(() => {
        LongPollTerminal(0);
    }, []);

    function LongPollTerminal(terminalLines) {
        fetch(
            `${APIADDR}/api/get-server-terminal/${terminalLines}/${serverID}`,
            {
                credentials: "include",
            }
        ).then((response) => {
            response.json().then((responseJSON) => {
                setTerminalData(responseJSON[1].join("\n"));
                
                if (serverTerminalDOM != null) {
                    serverTerminalDOM.scrollTop =
                        serverTerminalDOM.scrollHeight;
                }else{
                    setServerTerminalDOM(document.getElementById("server_terminal"))
                }
                LongPollTerminal(responseJSON[0]);
            });
        });
    }

    function Terminal() {

        return (
            <>
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
            </>
        );
    }

    useEffect(() => {
        if (serverTerminalDOM != null) {
            serverTerminalDOM.scrollTop = serverTerminalDOM.scrollHeight;
        }
    });

    // Create a 'unique key' to keep react happy and smiling.
    // React can really get on my nerves...

    let keyID = 0;

    return (
        <div>
            <Header />
            <div id="server_terminal" className="server_terminal">
            <Terminal />
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


            {serverData}

            <button onClick={() =>{                
                const splitURL = window.location.href.split("/")
                const serverID = splitURL[splitURL.length - 1]

                window.location = `../server-properties/${serverID}`
            }}>Edit server properties</button>
            <div className="control_panel">{controlPanelDOM}</div>
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
