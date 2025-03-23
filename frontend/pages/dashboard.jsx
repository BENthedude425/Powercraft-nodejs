import { React, useEffect, useState, useRef } from "react";

import Header from "../src/components/CHeader";
import ServerList from "../src/components/CServerList";
import GetAPIAddr from "../src/assets/getAPIAddr";

import "../src/assets/dashboard.css";
import "../src/assets/main.css";
var CPU_Text = "loading";
export default function PDashboard() {
    // Hooks for progress circle text updates
    const [CPU_Text, SetCPUText] = useState("loading");
    const [Memory_Text, SetMemoryText] = useState("loading");
    const [Disk_Text, SetDiskText] = useState("loading");
    const [Player_Text, SetPlayerText] = useState("loading");

    const [CPU_Style, SetCPUStyle] = useState({});
    const [Memory_Style, SetMemoryStyle] = useState({});
    const [Disk_Style, SetDiskStyle] = useState({});
    const [Player_Style, SetPlayerStyle] = useState({});

    const initilised = useRef(false);

    // Setup progress cirlce variables
    var CPU_Circle = null;
    var MEMORY_Circle = null;
    var Disk_Circle = null;
    var Player_Circle = null;

    const APIADDR = GetAPIAddr();

    function removeservers() {
        fetch(`${APIADDR}/api/REMOVESERVERS`, { credentials: "include" });
    }

    // Credit to https://www.30secondsofcode.org/css/s/circular-progress-bar/ for progress bars

    function ProgressCircle(props) {
        useEffect(() => {
            if (!initilised.current) {
                initilised.current = true;
                InitProgressCircles();
            }
        }, []);

        return (
            <div className="stat_display">
                <div className="stat_container">
                    <svg className="circle_svg" width={250} height={250}>
                        <circle
                            id={props.id}
                            cx="125"
                            cy="125"
                            r="115"
                            className="progress_circle"
                            style={props.strokeStyle}
                        />
                    </svg>

                    <div>
                        {props.name}
                        <br />
                        {props.text}
                    </div>
                </div>
            </div>
        );
    }

    function InitProgressCircles() {
        // c = 2 * PI * R

        // init all circles
        CPU_Circle = document.getElementById("CPU-USSAGE");
        CPU_Circle.circumference = 2 * Math.PI * CPU_Circle.r.baseVal.value;
        CPU_Circle.style.strokeDasharray = `${CPU_Circle.circumference} ${CPU_Circle.circumference}`;

        MEMORY_Circle = document.getElementById("MEMORY-USSAGE");
        MEMORY_Circle.circumference =
            2 * Math.PI * MEMORY_Circle.r.baseVal.value;
        MEMORY_Circle.style.strokeDasharray = `${MEMORY_Circle.circumference} ${MEMORY_Circle.circumference}`;

        Disk_Circle = document.getElementById("DISK-USSAGE");
        Disk_Circle.circumference = 2 * Math.PI * Disk_Circle.r.baseVal.value;
        Disk_Circle.style.strokeDasharray = `${Disk_Circle.circumference} ${Disk_Circle.circumference}`;

        // maybe change to total players over all servers
        Player_Circle = document.getElementById("Players");
        Player_Circle.circumference = 2 * Math.PI * Player_Circle.r.baseVal.value;
        Player_Circle.style.strokeDasharray = `${Player_Circle.circumference} ${Player_Circle.circumference}`;

        setInterval(() => {
            GetResources();
        }, 1000);
    }

    function GetStyle(circle, progress) {
        var color = "green";

        if (progress >= 60) {
            color = "orange";
        }

        if (progress >= 95) {
            color = "red";
        }

        const offset = (progress / 100) * circle.circumference;
        const empty = circle.circumference - offset;

        return { strokeDasharray: `${offset} ${empty}`, stroke: color };
    }

    function GetResources() {
        fetch(`${APIADDR}/api/get-resources`, { credentials: "include" }).then(
            (response) => {
                response.json().then((responseJSON) => {
                    // useState hooks to set the text
                    SetCPUText(`${responseJSON.cpu}%`);
                    SetMemoryText(
                        `${responseJSON.memory.freemem}GB / ${responseJSON.memory.totalmem}GB`
                    );
                    SetDiskText(`${responseJSON.disk.free}GB / ${responseJSON.disk.total}GB`)
                    SetPlayerText(`${responseJSON.players.current} / ${responseJSON.players.total}`)

                    // Set the progression of the circle
                    SetCPUStyle(GetStyle(CPU_Circle, responseJSON.cpu));
                    SetMemoryStyle(
                        GetStyle(
                            MEMORY_Circle,
                            (responseJSON.memory.freemem /
                                responseJSON.memory.totalmem) *
                                100
                        )
                    );
                    SetDiskStyle(GetStyle(Disk_Circle, (responseJSON.disk.free / responseJSON.disk.total) * 100));
                    SetPlayerStyle(GetStyle(Player_Circle, responseJSON.players))
                });
            }
        );
    }

    return (
        <div>
            <Header />

            <div className="status_div">
                <ProgressCircle
                    id="CPU-USSAGE"
                    name="cpu"
                    text={CPU_Text}
                    strokeStyle={CPU_Style}
                />

                <ProgressCircle
                    id="MEMORY-USSAGE"
                    name="memory"
                    text={Memory_Text}
                    strokeStyle={Memory_Style}
                />
                <ProgressCircle
                    id="DISK-USSAGE"
                    name="Disk"
                    text={Disk_Text}
                    strokeStyle={Disk_Style}
                />
                <ProgressCircle
                    id="Players"
                    name="Player Count"
                    text={Player_Text}
                    strokeStyle={Player_Style}
                />
            </div>
            <ServerList />
        </div>
    );
}
