import { React } from "react";
import { useNavigate } from "react-router-dom";
import "../assets/dash-sidebar.css";

export default function DashBoardSideBar() {
    const navigate = useNavigate();
    return (
        <div className="dashboard-sidebar">
            <div className="dashboard-sidebar-top">
                <img src="../apple.png" />
                <b>Powercraft</b>
            </div>

            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("servers");
                }}
            >
                <img className="icon" src="../servers.png" />
                <a>Servers</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("players");
                }}
            >
                <img className="icon" src="../players.png" />
                <a>Players</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("users-and-permissions");
                }}
            >
                <img className="icon" src="../permissions.png" />
                <a>Users and permissions</a>
            </div>
            <div
                className="dashboard-sidebar-option"
                onClick={() => {
                    navigate("programs");
                }}
            >
                <img className="icon" src="../coding.png" />
                <a>Programs</a>
            </div>

            <div className="dashboard-sidebar-bottom">
                <div
                    className="dashboard-sidebar-option"
                    onClick={() => {
                        navigate("configurations");
                    }}
                >
                    <img className="icon" src="../settings.png" />{" "}
                    <a className="dashboard-sidebar-bottom">Configurations</a>
                </div>
                <div className="dashboard-sidebar-option">
                    <img className="icon" src="../logout.png" />
                    <a className="dashboard-sidebar-bottom">Logout</a>
                </div>
            </div>
        </div>
    );
}
