import { React } from "react";

import { useState, useEffect } from "react";
import GetAPIAddr from "../assets/getAPIAddr";

const APIADDR = GetAPIAddr();

export default function ServerProperties(props) {
    const [serverProperties, setServerProperties] = useState([]);
    let URL = `${APIADDR}/api/get-server-properties`;

    if(props.serverID != null){
        URL += `/${props.serverID}`
    }


    useEffect(() => {
        fetch(URL, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                setServerProperties(responseJSON);
            });
        });
    }, []);

    return (
        <> 
        {Object.keys(serverProperties).map((key) =>{
            return(
                <ServerProperty key={key} setting={key} options={serverProperties[key]} />
            )
        })}
        </>
    );
}

function ServerProperty(props) {
    const setting = props.setting;
    const options = props.options;
    var type = "";

    switch (typeof options) {
        case "object":
            return (
                <div className="wrapper">
                    {setting}
                    <select className="item" name={`property:${setting}`}>
                        {options.map((data) => {
                            return <option key={data}>{String(data)}</option>;
                        })}
                    </select>
                </div>
            );
        case "string":
            type = "text";
            break;
        case "number":
            type = "number";
            break;
        default:
            type = "text";
            break;
    }

    return (
        <div className="wrapper">
            {setting}
            <input
                className="item"
                name={`property:${setting}`}
                type={type}
                placeholder={options}
                defaultValue={options}
            />
        </div>
    );
}
