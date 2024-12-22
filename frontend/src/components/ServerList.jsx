import { React, useState, useEffect } from "react";

import GetAPIAddr from "../assets/getAPIAddr";

import "../assets/main.css";

function Server(props) {
    return (
        <li
            className="server_listing"
            onClick={() => {
                Redirect(`server-dashboard/${props.serverID}`);
            }}
        >
            {props.serverName}
            <img src={props.serverImg} />
            <b style={{float: "right"}}>
                {props.serverStatus}
            </b>
        </li>
    );
}

function Redirect(url) {
    window.location = url;
}

function CreateServerButton() {
    return (
        <li
            className="create_server"
            onClick={() => {
                Redirect("/create-server");
            }}
        >
            Create server
        </li>
    );
}


function ServerList(currentHash) {
    function LongPollServerList(currentHash){
    // Collect server data to populate the server list
    fetch(`${APIADDR}/api/get-all-servers/${currentHash}`, {
        credentials: "include",
    }).then((response) => {
        response.json().then((responseJSON) => { 
            setserverlistings(responseJSON[1])
            LongPollServerList(responseJSON[0]);
        });
    });
    }


    const [serverlistings, setserverlistings] = useState([]);
    const APIADDR = GetAPIAddr();

    useEffect(() =>{
        LongPollServerList(0)
    }, [])

    // populate with data
    return (
        <ul className="server_list" id="server_list">
            <CreateServerButton />
            {serverlistings.map((data) => {
               const serverIMG = `${APIADDR}/images/${data.server_icon_path}`;

                return (
                    <Server
                        key={data.ID}
                        serverID={data.ID}
                        serverName={data.server_name}
                        serverStatus={data.server_status}


                        serverImg={serverIMG}
                    />
                );
            })}
        </ul>
    );
}

export default ServerList;