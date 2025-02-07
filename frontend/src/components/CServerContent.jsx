import React, { useEffect, useState } from "react";

import ServerStatHolder from "./ServerStatHolder";

import GetApiAddr from "../assets/getAPIAddr";

export default function ServerContent() {
    const APIADDR = GetApiAddr();
    const serverName = "server1";
    const [startButtonStyle, setStartButtonStyle] = useState({
        backgroundColor: "grey",
    });
    const [startButtonText, setStartButtonText] = useState("fetching");

    useEffect(() => {
        fetch(`${APIADDR}/api/getserver/${serverName}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                if (responseJSON[0] == true)   {
                    setStartButtonStyle({ backgroundColor: "green" });
                    setStartButtonText("running");
                } else {
                    setStartButtonStyle({ backgroundColor: "red" });
                    setStartButtonText("stopped");
                }
            });
        });
    }, []);

    return (
        <div className="server_content">
            <div>
                <div className="server_name">Server Name!</div>
                <img
                    className="server_image_main"
                    src="http://192.168.0.62:8080/images/pic1.png"
                />
            </div>

            <div className="server_controls">
                <button style={startButtonStyle}>{startButtonText}</button>
            </div>
        </div>
    );
}
