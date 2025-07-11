import { useEffect, useState } from "react";

import { GetAPIAddr } from "../assets/APIactions";
import "../assets/player-list.css";

const APIADDR = GetAPIAddr();

var initialised = false;

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
    let mins = seconds / 60;
    let hours = mins / 60;
    let days = Math.floor(hours / 24);

    hours = Math.floor(hours % 24);
    mins = Math.floor(mins % 60);
    seconds = Math.floor(seconds % 60);

    return `D:${days}, h:${hours}, m:${mins}, s:${seconds}`;
}

function FormatLastPlayed(date) {
    var lastPlayedDate = new Date(date.split("T")[0]);
    return (
        ("0" + lastPlayedDate.getDate()).slice(-2) +
        "-" +
        ("0" + (lastPlayedDate.getMonth() + 1)).slice(-2) +
        "-" +
        lastPlayedDate.getFullYear()
    );
}

function PlayerListing(props) {
    const data = props.data;

    if (data == null) {
        return (
            <div className="player-listing">
                <span>No players have played yet</span>
            </div>
        );
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

function OnlinePlayerListing(props) {
    var data = props.playerData;

    if (data == null) {
        return (
            <div className="player-listing">
                <span>There are no players online</span>
            </div>
        );
    }

    if (data.last_played == null) {
        data.last_played = "Has not played yet..";
    }

    return (
        <div className="player-listing">
            <span>{data.player_name}</span>
            <span>{FormatLastPlayed(data.last_played)}</span>
            <span>{FormatTimePlayed(data.time_played)}</span>
            <span>Playing on: {data.serverName}</span>
            <span>
                <img src={data.player_head_img_path} />
            </span>
        </div>
    );
}

function PlayerList(props) {
    const [PLAYERSLIST, SETPLAYERSLIST] = useState([]);

    function LongPollPlayerList(checkSum) {
        fetch(`${APIADDR}/api/LP-get-player-list/${checkSum}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                if (responseJSON[1].length == 0) {
                    SETPLAYERSLIST([null]);
                } else {
                    SETPLAYERSLIST(responseJSON[1]);
                }

                LongPollPlayerList(responseJSON[0]);
            });
        });
    }

    // Start long polling
    useEffect(() => {
        LongPollPlayerList(0);
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

function OnlinePlayerList(props) {
    const [ONLINEPLAYERSLIST, SETONLINEPLAYERSLIST] = useState([]);

    function LongPollOnlinePlayerList(checkSum) {
        fetch(`${APIADDR}/api/LP-get-online-player-list/null/${checkSum}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                if (responseJSON[1].length == 0) {
                    SETONLINEPLAYERSLIST([null]);
                } else {
                    SETONLINEPLAYERSLIST(responseJSON[1]);
                }

                LongPollOnlinePlayerList(responseJSON[0]);
            });
        });
    }

    // Start long polling
    useEffect(() => {
        if (!initialised) {
            LongPollOnlinePlayerList("online-player-list");
            initialised = true;
        }
    }, []);

    return (
        <div className="player-list" style={{ gridArea: `${props.gridArea}` }}>
            <PlayerListHeader />

            <div className="player-list-scroll">
                {Object.keys(ONLINEPLAYERSLIST).map((key) => {
                    var players = ONLINEPLAYERSLIST[key];

                    return players.map((player) => {
                        player.serverName = key;

                        return <OnlinePlayerListing playerData={player} />;
                    });
                })}
            </div>
        </div>
    );
}

export { PlayerList, OnlinePlayerList };
