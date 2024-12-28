import { React } from "react";

import { useState, useEffect } from "react";
import GetAPIAddr from "../assets/getAPIAddr";

const APIADDR = GetAPIAddr()

export default function ServerProperties() {
    const [serverProperties, setServerProperties] = useState([]);

    useEffect(() => {
        fetch(`${APIADDR}/api/get-server-properties`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                setServerProperties(responseJSON);
            });
        });
    }, []);

    return (
        <>
            {serverProperties.map((data) => {
                const key = Object.keys(data)[0];
                const options = data[key];

                return (
                    <ServerProperty key={key} setting={key} options={options} />
                );
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
            type = "selection";
            break;
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

    if (type == "selection") {
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
    } else {
        return (
            <div className="wrapper2">
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
}
