import { React, useState, useEffect } from "react";

import GetAPIAddr from "../assets/getAPIAddr";
import GetStatusColor from "./CGetStatusColor";
import { useMediaQuery } from "@mui/material";

import "../assets/serverlist.css";

function Server(props) {
    const statusStyle = GetStatusColor(props.serverStatus);

    return (
        <div
            className="server-listing"
            onClick={() => {
                Redirect(`server-dashboard/${props.serverID}`);
            }}
        >
            <div>
                <span className="status-light" style={statusStyle}></span>
                {props.serverName}
                <img src={props.serverImg} />
            </div>

            <div>
                <i>
                    {props.serverLauncher} {props.serverVersion}
                </i>
            </div>

            {props.serverStatus}
        </div>
    );
}

function Redirect(url) {
    window.location = url;
}

function CreateServerButton() {
    return (
        <div
            className="create-server"
            onClick={() => {
                Redirect("/create-server");
            }}
        >
            Create server
        </div>
    );
}

function ServerList() {
    function LongPollServerList(checkSum) {
        // Collect server data to populate the server list
        fetch(`${APIADDR}/api/get-all-servers/${checkSum}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                setserverlistings(responseJSON[1]);
                LongPollServerList(responseJSON[0]);
            });
        });
    }

    const MOBILE = useMediaQuery("(max-width:  480px)");
    const [serverlistings, setserverlistings] = useState([]);
    const [ServerListStyle, SetServerListStyle] = useState({});
    const [IsServerListOpen, SetIsServerListOpen] = useState("false");
    const APIADDR = GetAPIAddr();

    function OpenServerList() {
        if (IsServerListOpen) {
            SetServerListStyle({
                width: "0%",
            });
        } else {
            SetServerListStyle({
                width: "75%",
            });
        }

        SetIsServerListOpen(!IsServerListOpen);
    }

    function ServerListButton() {
        return (
            <span className="server-list-button" onClick={OpenServerList}>
                <img src="sidebar.png" />
            </span>
        );
    }

    useEffect(() => {
        if (MOBILE) {
            SetServerListStyle({
                width: "0%",
            });
        }

        LongPollServerList(0);
    }, []);

    // populate with data
    return (
        <div className="server-list" id="server_list" style={ServerListStyle}>
            <ServerListButton />
            <div className="server-list-options">
                <CreateServerButton />
                {serverlistings.map((data) => {
                    const serverIMG = `${APIADDR}/images/${data.server_icon_path}`;
                    return (
                        <Server
                            key={data.ID}
                            serverID={data.ID}
                            serverName={data.server_name}
                            serverStatus={data.server_status}
                            serverLauncher={data.server_launcher_type}
                            serverVersion={data.server_version}
                            serverImg={serverIMG}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default ServerList;
