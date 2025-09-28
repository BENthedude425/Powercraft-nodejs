import { React } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/dash-sidebar.css";
import { Logout } from "../assets/APIactions";

import appleIMG from        "../../src/images/apple.png";
import serversIMG from      "../../src/images/servers.png";
import createServerIMG from "../../src/images/create-server.png";
import playersIMG from      "../../src/images/players.png";
import permissionsIMG from  "../../src/images/permissions.png";
import codingIMG from       "../../src/images/coding.png";
import settingsIMG from     "../../src/images/settings.png";
import logoutIMG from       "../../src/images/logout.png";

export default function DashBoardSideBar() {
    const navigate = useNavigate();
    return (
        <div className="dashboard-sidebar">
            <div className="dashboard-sidebar-top">
                <img src={appleIMG} />
                <b>Powercraft</b>
            </div>

            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("../servers");
                }}
            >
                <img className="icon" src={serversIMG} />
                <a>Servers</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("../create-server");
                }}
            >
                <img className="icon" src={createServerIMG} />
                <a>Create a server</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("../players");
                }}
            >
                <img className="icon" src={playersIMG} />
                <a>Players</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("../users-and-permissions");
                }}
            >
                <img className="icon" src={permissionsIMG} />
                <a>Users and permissions</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("../programs");
                }}
            >
                <img className="icon" src={codingIMG} />
                <a>Programs</a>
            </div>

            <div className="dashboard-sidebar-bottom">
                <div
                    className="dashboard-sidebar-option"
                    onClick={() => {
                        navigate("../configurations");
                    }}
                >
                    <img className="icon" src={settingsIMG} />{" "}
                    <a className="dashboard-sidebar-bottom">Configurations</a>
                </div>
                <div className="dashboard-sidebar-option" onClick={() =>{
                    Logout()
                }}>
                    <img className="icon" src={logoutIMG} />
                    <a className="dashboard-sidebar-bottom">Logout</a>
                </div>
            </div>
        </div>
    );
}
