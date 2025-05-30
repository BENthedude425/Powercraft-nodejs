import { React, useState, useRef, useEffect } from "react";


import Serverlist from "../src/components/CServerList";
import DashBoardSideBar from "../src/components/CDashSideBar";
import Header from "../src/components/CHeader";
import {Graph} from "../src/components/CGraphs";
import {GetAPIAddr} from "../src/assets/APIactions";

import "../src/assets/dashboard.css";

function PTest() {
    // Hooks for progress circle text updates
    const [CPU_Text, SetCPUText] = useState("loading");
    const [Memory_Text, SetMemoryText] = useState("loading");
    const [Disk_Text, SetDiskText] = useState("loading");
    const [Player_Text, SetPlayerText] = useState("loading");

    // Hooks for updating the progression of the circle via styling
    const [CPU_Style, SetCPUStyle] = useState({});
    const [Memory_Style, SetMemoryStyle] = useState({});
    const [Disk_Style, SetDiskStyle] = useState({});
    const [Player_Style, SetPlayerStyle] = useState({});

    const [CPUDATA, SETCPUDATA] = useState([]);
    const [MEMORYDATA, SETMEMORYDATA] = useState([]);
    const [PLAYERDATA, SETPLAYERDATA] = useState([]);
    const initilised = useRef(false);

    // Setup progress cirlce variables
    var CPU_Circle = null;
    var MEMORY_Circle = null;
    var Disk_Circle = null;
    var Player_Circle = null;

    const APIADDR = GetAPIAddr();

    // Init circle variables on load
    useEffect(() => {
        //if (!initilised.current) {
        //    initilised.current = true;
        //    InitProgressCircles();
        //}

        GetResources();
    }, []);

    function GetResources() {
        fetch(`${APIADDR}/api/get-resources`, { credentials: "include" }).then(
            (response) => {
                response.json().then((responseJSON) => {
                    SETMEMORYDATA([
                        ...AddGraphData(MEMORYDATA, {
                            time: Date.now(),
                            value: responseJSON.memory.currentmem,
                        }),
                    ]);

                    SETCPUDATA([
                        ...AddGraphData(CPUDATA, {
                            time: Date.now(),
                            value: responseJSON.cpu,
                        }),
                    ]);
                    
                    SETPLAYERDATA([...responseJSON.players])

                    GetResources()
                });
            }
        );
    }

    function AddGraphData(graphData, newData, limit = 10) {
        graphData.push({
            value: newData.value,
            time: newData.time,
        });

        if (graphData.length > limit) {
            graphData.shift();
        }

        return graphData;
    }

    return (
        <div className="page">
            <Header />

            <div className="main">
                <span className="server-list-button">
                    <img src="sidebar.png" />
                </span>
                <DashBoardSideBar />
                <div className="dashboard-container">
                    <div className="resource-grid">
                        <div style={{ gridArea: "CPU" }}>
                            <Graph graphData={CPUDATA} />
                        </div>

                        <div style={{ gridArea: "MEMORY" }}>
                            <Graph graphData={MEMORYDATA} />
                        </div>

                        <div style={{ gridArea: "DISK" }}>
                            <Graph graphData={CPUDATA} adaptive={true} />
                        </div>

                        <div style={{ gridArea: "PLAYERS" }}>
                            <Graph
                                graphWidth="1000"
                                graphHeight="650"
                                graphData={PLAYERDATA}
                            />
                        </div>

                        <div style={{ gridArea: "TEST1" }}>
                            <Graph graphData={[]} />
                        </div>

                        <div style={{ gridArea: "TEST2" }}>
                            <Graph graphData={[]} />
                        </div>

                        <div style={{ gridArea: "TEST3" }}>
                            <Graph graphData={[]} />
                        </div>
                    </div>

                    <h1 className="dashboard-heading">Servers</h1>
                    <div className="server-list-container">

                        
                        <Serverlist />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PTest;
