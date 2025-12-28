import { useState, useEffect } from "react";
import { GetAPIAddr } from "../assets/APIactions";
import "../assets/server-properties.css";

const APIADDR = GetAPIAddr();

export default function ServerProperties(props) {
    const [serverProperties, setServerProperties] = useState([]);
    let URL = `${APIADDR}/api/get-server-properties`;

    if (props.serverID != null) {
        URL += `/${props.serverID}`;
    }
    console.log(URL);

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
        <div className="server-properties-container">
            {Object.keys(serverProperties).map((category) => {
                return (
                    <CategoryTitle
                        props={{
                            title: category,
                            properties: serverProperties[category],
                        }}
                        key={category}
                    />
                );
            })}
        </div>
    );
}

function ServerProperty(props) {
    const propertyName = props.setting;
    const propertyOptions = props.data.options;
    const propertyDescription = props.data.description;
    var type = "";

    switch (typeof propertyOptions) {
        case "object":
            // Check if it's an array
            // {gamemode: {options: ["survival", "creative", "adventure"], description: ""}}
            if (Array.isArray(propertyOptions)) {
                return (
                    <div className="server-property">
                        <div>
                            {propertyName.charAt(0).toUpperCase() +
                                propertyName.slice(1)}

                            <select
                                className="server-property-item"
                                name={`property:${propertyName}`}
                            >
                                {propertyOptions.map((propertyOption) => {
                                    return (
                                        <option key={propertyOption}>
                                            {String(propertyOption)
                                                .charAt(0)
                                                .toUpperCase() +
                                                String(propertyOption).slice(1)}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                        <div>
                            <small className="server-property-description">
                                {propertyDescription}
                            </small>
                        </div>
                    </div>
                );
            }
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

    return (
        <div className="server-property">
            <div>
                {propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}
                <input
                    className="server-property-item"
                    name={`property:${propertyName}`}
                    type={type}
                    placeholder={propertyOptions}
                    defaultValue={propertyOptions}
                />
            </div>
            <div>
                <small className="server-property-description">
                    {propertyDescription}
                </small>
            </div>
        </div>
    );
}

function CloseCategory(event, categoryID) {
    const element = document.getElementById(categoryID);
    const buttonElement = event.currentTarget;

    if (element === null) {
        return;
    }

    if (element.style.maxHeight === "0px") {
        element.style.maxHeight = "1000px";

        buttonElement.style = "display: inline-block; transform: rotate(90deg)";
        return;
    }
    buttonElement.style = "display: inline-block; transform: rotate(0deg)";
    element.style.maxHeight = "0px";
}

function CategoryTitle({ props }) {
    return (
        <div className="category-title">
            <h2>
                {props.title}
                <span
                    onClick={(e) => CloseCategory(e, props.title)}
                >{`>`}</span>
            </h2>

            <div id={props.title} className="server-property-container">
                {Object.keys(props.properties).map((propertyName) => {
                    return (
                        <ServerProperty
                            setting={propertyName}
                            data={props.properties[propertyName]}
                            key={propertyName}
                        />
                    );
                })}
            </div>
        </div>
    );
}
