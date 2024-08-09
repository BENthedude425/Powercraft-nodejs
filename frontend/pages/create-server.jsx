import { useEffect, useState } from "react";
import Header from "../src/components/Header";
import GetAPIAddr from "../src/assets/getAPIAddr";

const APIADDR = GetAPIAddr();

export default function PCreateServer() {
    const [serverProperties, setServerProperties] = useState([]);

    useEffect(() => {
        fetch(`${APIADDR}/api/get-server-properties`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) =>{
                setServerProperties(responseJSON)
            });
        });
    }, []);

    return (
        <div>
            <Header />
            <form>
                <input
                    type="text"
                    name="server_name"
                    placeholder="server name"
                />

                <input type="img" name="server_img" />

                <select name="server_version">
                    <option>Minecraft 1.12.2</option>
                    <option>Forge 1.12.2</option>
                    <option>Spigot 1.12.2</option>
                </select>
            </form>


            <div>
                {serverProperties.map((data) =>{
                    const key = Object.keys(data)[0];
                    const options = JSON.stringify(data[key])
                    
                    return <p>{key} {options}</p>
                })}
            </div>

            
            <div style={{ marginTop: "100px" }}>
                server name serverDirectory server verison server owner / groups
                server properes ti eula agreement
            </div>
        </div>
    );
}
