import { useEffect, useState } from "react";

import Header from "../src/components/CHeader";
import {GetAPIAddr} from "../src/assets/APIactions";
import ServerProperties from "../src/components/CServerProperties";
import "../src/assets/create-server.css";
import "../src/assets/dashboard.css";

import DEFAULTSERVERIMAGE from "../src/images/pic1.png";

const APIADDR = GetAPIAddr();

export default function PCreateServer() {
    const [serverIMGSrc, setServerIMG] = useState(DEFAULTSERVERIMAGE);
    const [serverVersionsData, setServerVersionsData] = useState([]);
    const [launcherVersions, setLauncherVersions] = useState([]);
    const [forgeReleases, setForgeReleases] = useState([]);

    const onImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            setServerIMG(URL.createObjectURL(event.target.files[0]));
        }
    };

    useEffect(() => {
        fetch(`${APIADDR}/api/get-server-versions`, {
            credentials: "include",
        }).then((response) => {
            response.json().then((responseJSON) => {
                setServerVersionsData(responseJSON);
            });
        });
    }, []);

    function handleLauncherChange(event) {
        const key = event.target.value;
        const versions = Object.keys(serverVersionsData[key]);
        setLauncherVersions(versions);
    }

    function handleVersionChange(event) {
        const launcherTypeSelectDOM =
            document.getElementById("launcherTypeSelect");
        const forgeReleaseSelectDOM =
            document.getElementById("forgeReleaseSelect");
        const type = launcherTypeSelectDOM.value;
        const version = event.target.value;
        alert(type);
        if (type != "Forge") {
            forgeReleaseSelectDOM.style.visibility = "hidden";
            alert("hidden");
            return;
        }

        forgeReleaseSelectDOM.style.visibility = "visible";
        setForgeReleases(serverVersionsData["Forge"][version]);
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-right">
                <Header />

                <form
                    action={`${APIADDR}/api/create-server`}
                    method="POST"
                    encType="multipart/form-data"
                    className="create_server_form"
                >
                    <input
                        type="text"
                        name="server_name"
                        placeholder="server name"
                    />

                    <img
                        src={serverIMGSrc}
                        style={{ width: "300px", height: "300px" }}
                        alt="preview image"
                    />
                    <input
                        type="file"
                        name="server_img"
                        onChange={onImageChange}
                    />

                    <select
                        name="launcherTypeSelect"
                        id="launcherTypeSelect"
                        onChange={handleLauncherChange}
                    >
                        {Object.keys(serverVersionsData).map((launcherType) => {
                            return (
                                <option key={launcherType}>
                                    {launcherType}
                                </option>
                            );
                        })}
                    </select>

                    <select
                        name="versionSelect"
                        id="versionSelect"
                        onChange={handleVersionChange}
                    >
                        {launcherVersions.map((version) => {
                            return <option key={version}>{version}</option>;
                        })}
                    </select>

                    <select
                        name="forgeReleaseSelect"
                        id="forgeReleaseSelect"
                        style={{ visibility: "Hidden" }}
                    >
                        {forgeReleases.map((release) => {
                            return <option>{release.file}</option>;
                        })}
                    </select>

                    <div className="option-grid">
                        <ServerProperties />
                    </div>

                    <input type="submit" />
                </form>
            </div>
        </div>
    );
}

function temp() {
    return (
        <div>
            <Header />
            <form
                action={`${APIADDR}/api/create-server`}
                method="POST"
                encType="multipart/form-data"
            >
                <input
                    type="text"
                    name="server_name"
                    placeholder="server name"
                />

                <img
                    src={serverIMGSrc}
                    style={{ width: "300px", height: "300px" }}
                    alt="preview image"
                />
                <input type="file" name="server_img" onChange={onImageChange} />

                <select
                    name="launcherTypeSelect"
                    id="launcherTypeSelect"
                    onChange={handleLauncherChange}
                >
                    {Object.keys(serverVersionsData).map((launcherType) => {
                        return (
                            <option key={launcherType}>{launcherType}</option>
                        );
                    })}
                </select>

                <select
                    name="versionSelect"
                    id="versionSelect"
                    onChange={handleVersionChange}
                >
                    {launcherVersions.map((version) => {
                        return <option key={version}>{version}</option>;
                    })}
                </select>

                <select
                    name="forgeReleaseSelect"
                    id="forgeReleaseSelect"
                    style={{ visibility: "Hidden" }}
                >
                    {forgeReleases.map((release) => {
                        return <option>{release.file}</option>;
                    })}
                </select>

                <input type="submit" />
            </form>

            <div style={{ marginTop: "100px" }}>
                server name serverDirectory server verison server owner / groups
                server properes ti eula agreement
            </div>
        </div>
    );
}
