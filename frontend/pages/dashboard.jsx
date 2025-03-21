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
    //const [Network_Text, SetNetworkText] = useState("loading");
    //const [TPS_Text, SetTPSText] = useState("loading");

    const [CPU_Style, SetCPUStyle] = useState({});
    const [Memory_Style, SetMemoryStyle] = useState({});

    const initilised = useRef(false);

    // Setup progress cirlce variables
    var CPU_Circle = null;
    var MEMORY_Circle = null;
    var NETWORK_Circle = null;
    var TPS_Circle = null;

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

        NETWORK_Circle = document.getElementById("NETWORK-USSAGE");
        NETWORK_Circle.circumference =
            2 * Math.PI * NETWORK_Circle.r.baseVal.value;
        NETWORK_Circle.style.strokeDasharray = `${NETWORK_Circle.circumference} ${NETWORK_Circle.circumference}`;

        // maybe change to total players over all servers
        TPS_Circle = document.getElementById("TPS");
        TPS_Circle.circumference = 2 * Math.PI * TPS_Circle.r.baseVal.value;
        TPS_Circle.style.strokeDasharray = `${TPS_Circle.circumference} ${TPS_Circle.circumference}`;

        GetResources();
    }

    function GetStyle(circle, progress) {
        var color = "green";

        if(progress >= 60){
            color = "orange"
        }

        if(progress >= 95){
            color = "red"
        }

        const offset = (progress / 100) * circle.circumference;
        const empty = circle.circumference - offset;

        return {strokeDasharray: `${offset} ${empty}`, stroke:color}
    }

    function GetResources() {
        fetch(`${APIADDR}/api/get-resources`, { credentials: "include" }).then(
            (response) => {
                response.json().then((responseJSON) => {
                    // useState hooks
                    SetCPUText(`${responseJSON.cpu}%`);
                    SetMemoryText(
                        `${responseJSON.memory.freemem}GB / ${responseJSON.memory.totalmem}GB`
                    );

                    // Set the progression of the circle
                    SetCPUStyle(GetStyle(CPU_Circle, responseJSON.cpu))
                    SetMemoryStyle(GetStyle(MEMORY_Circle, (responseJSON.memory.freemem / responseJSON.memory.totalmem) * 100))

                    GetResources();
                });
            }
        );
    }

    return (
        <div>
            <Header />

            <div className="status_div">
                <ProgressCircle id="CPU-USSAGE" name="cpu" text={CPU_Text} strokeStyle={CPU_Style}/>

                <ProgressCircle
                    id="MEMORY-USSAGE"
                    name="memory"
                    text={Memory_Text}
                    strokeStyle={Memory_Style}
                />
                <ProgressCircle
                    id="NETWORK-USSAGE"
                    name="memory"
                    text={Memory_Text}
                />
                <ProgressCircle id="TPS" name="memory" text={Memory_Text} />
            </div>
            <ServerList />
        </div>
    );
}
