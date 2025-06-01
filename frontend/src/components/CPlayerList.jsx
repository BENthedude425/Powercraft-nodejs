import { useEffect, useState } from "react";

import { GetAPIAddr } from "../assets/APIactions";
import "../assets/player-list.css";

const APIADDR = GetAPIAddr();

function PlayerListHeader() {
    return (
        <div className="player-list-header">
            <span>Player</span>
            <span>Last played</span>
            <span>Time Played</span>
            <span>Head</span>
        </div>
    );
}

function FormatTimePlayed(seconds) {
    var mins = seconds / 60;
    var hours = mins / 60;
    var days = Math.floor(hours / 24);

    hours = Math.floor(hours % 24);
    mins = Math.floor(mins % 60);
    seconds = Math.floor(seconds % 60);

    return `D:${days}, h:${hours}, m:${mins}, s:${seconds}`;
}

function FormatLastPlayed(date){
    var lastPlayedDate =  new Date(date.split("T")[0]);
    return ("0" + (lastPlayedDate.getDate())).slice(-2) + "-" +  ("0" + (lastPlayedDate.getMonth() + 1)).slice(-2) + "-" + lastPlayedDate.getFullYear()
    
}

function PlayerListing(props) {
    const data = props.data;

    if(data == null){
        return(
            <div className="player-listing">
                <span>No players have played yet</span>
            </div>
        )
    }

    if (data.last_played == null) {
        data.last_played = "Has not played yet..";
    }

    return (
        <div className="player-listing">
            <span>{data.player_name}</span>
            <span>{FormatLastPlayed(data.last_played)}</span>
            <span>{FormatTimePlayed(data.time_played)}</span>
            <span>
                <img src={data.player_head_img_path} />
            </span>
        </div>
    );
}

export default function PlayerList(props) {
    const [PLAYERSLIST, SETPLAYERSLIST] = useState([]);

    useEffect(() => {
        fetch(`${APIADDR}/api/get-player-list`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                if(responseJSON.length == 0){
                    SETPLAYERSLIST([null])
                    return;
                }


                SETPLAYERSLIST(responseJSON);
            });
        });
    }, []);

    return (
        <div className="player-list" style={{ gridArea: `${props.gridArea}` }}>
            <PlayerListHeader />

            <div className="player-list-scroll">
                {PLAYERSLIST.map((data) => {
                    return <PlayerListing data={data} />;
                })}
            </div>
        </div>
    );
}
