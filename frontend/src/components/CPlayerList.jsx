import { React, useEffect, useState } from "react";

import GetAPIAddr from "../assets/getAPIAddr";
import "../assets/player-list.css";

const APIADDR = GetAPIAddr();


function PlayerListing(props){
    const data = props.data;
    
    if(data.last_played == null){
        data.last_played = "Has not played yet.."
    }
    
    return(
        <div className="player_listing">
            {data.player_name}
            {data.last_played}
            <img src={data.player_head_img_path} />
        </div>
        
    )
}

export default function PlayerList(props) {
    const [PLAYERSLIST, SETPLAYERSLIST] = useState([]);

    useEffect(() => {
        fetch(`${APIADDR}/api/get-player-list`, {credentials: "include"}).then((response) => {
            response.json().then((responseJSON) =>{
                SETPLAYERSLIST(responseJSON)
            })
        });
    }, []);

    return (
        <div className="PlayerList" style={{ gridArea: `${props.gridArea}` }}>
            {PLAYERSLIST.map((data) =>{
                return(
                    <PlayerListing data={data}/>
                )
            })}
        </div>
    );
}
