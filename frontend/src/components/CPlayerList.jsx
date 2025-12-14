import { useEffect, useRef, useState } from "react";

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
        // data.last_played = "Has not played yet..";
    }

    return (
        <div className="player-listing">
            <span>{data.player_name}</span>
            <span>{FormatLastPlayed(data.last_played)}</span>
            <span>{FormatTimePlayed(data.time_played)}</span>
            <span>{data.status}</span>
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
        //data.last_played = "Has not played yet..";
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
    const [pollchecksum, setchecksum] = useState(0);
    const PollReady = useRef(true);
    const TimerReady = useRef(true);

    const init = useRef(false);

    function UpdatePlayerListStats() {
        var UpdatedPlayerslist = [];
        for (var key in PLAYERSLIST) {
            var playerData = PLAYERSLIST[key];

            if (playerData.status == "playing") {
                playerData.time_played = parseFloat(playerData.time_played) + 1;
            }

            UpdatedPlayerslist.push(playerData);
        }
        SETPLAYERSLIST(UpdatedPlayerslist);
    }

    // Update time played
    useEffect(() => {
        LongPollPlayerList();
    }, [PLAYERSLIST]);

    function LongPollPlayerList() {
        var checkSum = pollchecksum;

        if (PLAYERSLIST.length > 0 && TimerReady.current == true) {
            // Adjust for the time played in current session
            for (let key in PLAYERSLIST) {
                let playerData = PLAYERSLIST[key];
                if (playerData.status == "playing") {
                    let lastPlayedTime = new Date(playerData.last_played);
                    let timeDifference = Date.now() - lastPlayedTime.getTime();
                    playerData.time_played =
                        parseFloat(playerData.time_played) +
                        timeDifference / 1000;
                }
            }

            var timer = setInterval(() => {
                UpdatePlayerListStats();
            }, 1000);
            TimerReady.current = false;
        }

        if (PollReady.current == true) {
            PollReady.current = false;
            fetch(`${APIADDR}/api/LP-get-player-list/${checkSum}`, {
                credentials: "include",
            }).then((response) => {
                response.json().then((responseJSON) => {
                    // Cancel timers
                    clearInterval(timer);
                    TimerReady.current = true;

                    if (responseJSON[1].length == 0) {
                        SETPLAYERSLIST([]);
                    } else {
                        SETPLAYERSLIST(responseJSON[1]);
                    }
                    setchecksum(responseJSON[0]);
                    PollReady.current = true;
                });
            });
        }
    }

    // Start long polling
    useEffect(() => {
        if (PLAYERSLIST.length == 0) {
            return;
        }

        if (init.current == true) {
            return;
        }

        LongPollPlayerList(0);

        init.current = true;
    });

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
    const [pollchecksum, setchecksum] = useState(0);
    const PollReady = useRef(true);
    const TimerReady = useRef(true);

    function UpdateOnlinePlayerListStats() {
        var UpdatedPlayerslist = {};
        let keys = Object.keys(ONLINEPLAYERSLIST);
        for (let key of keys) {
            let selectedServer = ONLINEPLAYERSLIST[key];
            UpdatedPlayerslist[key] = [];
            for (var playerDataKey in selectedServer) {
                var playerData = selectedServer[playerDataKey];

                if (playerData.status == "playing") {
                    playerData.time_played =
                        parseFloat(playerData.time_played) + 1;
                }

                UpdatedPlayerslist[key].push(playerData);
            }
        }

        SETONLINEPLAYERSLIST(UpdatedPlayerslist);
    }

    // Update time played
    useEffect(() => {
        LongPollOnlinePlayerList();
    }, [ONLINEPLAYERSLIST]);

    function LongPollOnlinePlayerList() {
        let checkSum = pollchecksum;
        if (
            Object.keys(ONLINEPLAYERSLIST).length > 0 &&
            TimerReady.current == true
        ) {
            // Adjust for the time played in current session
            let keys = Object.keys(ONLINEPLAYERSLIST);
            keys.map((key) => {
                let selectedServer = ONLINEPLAYERSLIST[key];
                selectedServer.map((playerData) => {
                    if (playerData.status == "playing") {
                        let lastPlayedTime = new Date(playerData.last_played);
                        let timeDifference =
                            Date.now() - lastPlayedTime.getTime();
                        playerData.time_played =
                            parseFloat(playerData.time_played) +
                            timeDifference / 1000;
                    }
                });
            });

            console.log("setting timer");
            var timer = setInterval(() => {
                UpdateOnlinePlayerListStats();
            }, 1000);
            TimerReady.current = false;
        }
        // Fetch the players list (filtering for only players online)
        if (PollReady.current == true) {
            PollReady.current = false;
            fetch(`${APIADDR}/api/LP-get-online-player-list/null/${checkSum}`, {
                credentials: "include",
            }).then((response) => {
                response.json().then((responseJSON) => {
                    // Cancel timers
                    clearInterval(timer);
                    TimerReady.current = true;

                    // If no one is online return null
                    if (responseJSON[1].length == 0) {
                        SETONLINEPLAYERSLIST([null]);
                    }
                    // Return online players
                    else {
                        SETONLINEPLAYERSLIST(responseJSON[1]);
                    }

                    // Restart the poll request
                    setchecksum(responseJSON[0]);
                    PollReady.current = true;
                });
            });
        }
    }

    // Start long polling
    useEffect(() => {
        if (!initialised) {
            LongPollOnlinePlayerList(0);
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
