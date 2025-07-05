import { React, useState, useRef, useEffect, lazy } from "react";
import { Graph, IntegratedGraph } from "../src/components/CGraphs";

const Serverlist = lazy(() => import("../src/components/CServerList"));
const DashBoardSideBar = lazy(() => import("../src/components/CDashSideBar"));
const PlayerList = lazy(() => import("../src/components/CPlayerList"));
import { GetAPIAddr } from "../src/assets/APIactions";

import "../src/assets/dashboard.css";

export default function PDashboard() {
    const [GraphWidth, SetGraphWidth] = useState(300);
    const [IntegratedGraphWidth, SetIntegratedGraphWidth] = useState(300);

    const [GraphHeight, SetGraphHeight] = useState(100);
    const [IntegratedGraphHeight, SetIntegratedGraphHeight] = useState(100);

    // Graph data for integrated graph
    const [CPUGraphData, SetCPUGraphData] = useState([]);
    const [MemoryGraphData, SetMemoryGraphData] = useState([]);
    const [PlayerGraphData, SetPlayerGraphData] = useState([]);

    // Hooks for graph keys
    const [IntegratedGraphKeys, SetIntegratedGraphKeys] = useState({
        CPU: "blue",
        MEMORY: "red",
    });

    const IntegratedGraphData = {
        CPU: {
            lineClassName: "graph_line1",
            shadowClassName: "graph_shadow1",
            data: CPUGraphData,
        },
        MEMORY: {
            lineClassName: "graph_line2",
            shadowClassName: "graph_shadow2",
            data: MemoryGraphData,
        },
    };
    const initilised = useRef(false);

    const APIADDR = GetAPIAddr();

    useEffect(() => {
        if (!initilised.current) {
            initilised.current = true;
            CalculateGraphWidth(20);
            CalculateGraphHeight(100);
        }
        GetResources();
    }, []);

    window.addEventListener("resize", () => {
        CalculateGraphWidth(20);
        CalculateGraphHeight(100);
    });

    function GetResources() {
        fetch(`${APIADDR}/api/get-resources`, { credentials: "include" }).then(
            (response) => {
                response.json().then((responseJSON) => {
                    SetMemoryGraphData([
                        ...AddGraphData(MemoryGraphData, {
                            time: Date.now(),
                            value: responseJSON.memory.currentmem,
                        }),
                    ]);

                    SetCPUGraphData([
                        ...AddGraphData(CPUGraphData, {
                            time: Date.now(),
                            value: responseJSON.cpu,
                        }),
                    ]);

                    SetPlayerGraphData(responseJSON.players);

                    GetResources();
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

    function CalculateGraphWidth(gap) {
        const graphHolder = document.getElementById("graph-holder");
        const division = [50, 50];

        if (graphHolder == null) {
            return;
        }

        const width = graphHolder.offsetWidth;

        SetIntegratedGraphWidth(width * (division[0] / 100) - 0.5 * gap);
        SetGraphWidth(width * (division[1] / 100) - 0.5 * gap);
    }

    function CalculateGraphHeight(percentage) {
        const graphHolder = document.getElementById("graph-holder");

        if (graphHolder == null) {
            return;
        }

        const height = graphHolder.offsetHeight;
        const multiplier = percentage / 100;

        SetIntegratedGraphHeight(height * multiplier);
        SetGraphHeight(height * multiplier);
    }

    return (
        <div className="page">
            <div className="main">
                <span className="server-list-button">
                    <img src="sidebar.png" />
                </span>
                <DashBoardSideBar />
                <div className="dashboard-container">
                    <div className="dashboard-header">
                        <b></b>
                    </div>
                    <div className="dashboard-resource-container">
                        <div className="dashboard-heading">RESOURCES</div>

                        <div
                            id="dashboard-resource-grid"
                            className="dashboard-resource-grid"
                        >
                            <div
                                className="dashboard-graph-holder"
                                id="graph-holder"
                            >
                                <IntegratedGraph
                                    gridArea="GRAPH"
                                    graphWidth={IntegratedGraphWidth}
                                    graphHeight={IntegratedGraphHeight}
                                    graphData={IntegratedGraphData}
                                    graphKeys={IntegratedGraphKeys}
                                />

                                <Graph
                                    gridArea="PLAYERGRAPH"
                                    graphWidth={GraphWidth}
                                    graphHeight={GraphHeight}
                                    graphData={PlayerGraphData}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-list-container">
                        <div className="dashboard-list-container-content">
                            <div className="dashboard-list-container-content-div">
                                <h1 className="dashboard-heading">Servers</h1>
                                <Serverlist />
                            </div>
                            <div className="dashboard-list-container-content-div">
                                <h1 className="dashboard-heading">Players</h1>
                                <PlayerList gridArea="PLAYERLIST" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
