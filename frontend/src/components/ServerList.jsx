import { React, useState, useEffect } from "react";

import GetAPIAddr from "../assets/getAPIAddr";

import "../assets/main.css";

function Server(props) {
    return (
        <li className="server_listing">
            {props.serverName}
            <img src={props.serverImg} />
        </li>
    );
}

function Redirect(){
    window.location = "/createserver";
}

function CreateServerButton() {
    return <li className="create_server" onClick={Redirect}>Create server</li>;
}

function ServerList() {
    const [serverlistings, setserverlistings] = useState([]);
    const APIADDR = GetAPIAddr();

    useEffect(() => {
        // Collect server data to populate the server list
        fetch(`${APIADDR}/db/servers`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                setserverlistings(responseJSON);
            });
        });
    }, []);

    // populate with data
    return (
        <ul className="server_list" id="server_list">
            <CreateServerButton />
            {serverlistings.map((data) => {
                const serverID = data.server_ID;
                const serverName = data.server_name;
                const serverDirectory = data.server_directory;
                const serverIMG = `${APIADDR}/images/${data.server_icon_path}`;

                return <Server serverName={serverName} serverImg={serverIMG} />;
            })}
        </ul>
    );
}

export default ServerList;
