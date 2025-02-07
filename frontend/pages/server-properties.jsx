import { React, useState, useEffect } from "react";
import GetAPIAddr from "../src/assets/getAPIAddr";

import ServerProperties from "../src/components/CServerProperties";
import Header from "../src/components/CHeader";

const APIADDR = GetAPIAddr();

export default function PServerProperties() {
    const splitURL = window.location.href.split("/");
    const serverID = splitURL[splitURL.length - 1];

    const [xr, y] = useState([""]);

    useEffect(() => {
        fetch(`${APIADDR}/api/get-server-properties/${serverID}`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseText) => {
                y(responseText);
            });
        });
    }, []);

    return (
        <div>
            <Header />
            <form
                action={`${APIADDR}/api/set-server-properties/${serverID}`}
                method="POST"
                encType="multipart/form-data"
            >
                <div className="option-grid">
                    <ServerProperties serverID={serverID} />
                </div>

                <input type="submit" />
            </form>
        </div>
    );
}
