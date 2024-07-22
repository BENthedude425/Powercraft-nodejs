import { React, useState, useEffect } from "react";

import GetAPIAddr from "../assets/getAPIAddr";

import "../assets/main.css";

function Server() {
    return <div className="server_listing">asdfsadf</div>;
}

function ServerList() {
    const [serverlistings, setserverlistings] = useState(<b>loading</b>);
    const APIADDR = GetAPIAddr();

    useEffect(() => {
        // Collect server data to populate the server list
        fetch(`${APIADDR}/db/servers`, {
            credentials: "include",
            
        }).then((response) => {
            response.json().then((responseJSON) => {
                setserverlistings(<b>{JSON.stringify(responseJSON)}</b>);
            });
        });
    }, []);

    return <div className="server_list">{serverlistings}</div>;
}

export default ServerList;
