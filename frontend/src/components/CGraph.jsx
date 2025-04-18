import { React, Component } from "react";

import "../assets/graph.css";
import { GraphicEqSharp } from "@mui/icons-material";

export default class Graph extends Component {
    render() {
        // Init all props as variables
        const graphData = this.props.graphData;
        const graphWidth = this.props.graphWidth;
        const graphHeight = this.props.graphHeight;
        const graphAxis = this.props.graphAxis;
        const adaptive = this.props.adaptive;
        const lineClassName = this.props.lineClassName;
        var smallestx, largestx, smallesty, largesty;

        const TEXTOFFSETY = 15;
        const TEXTOFFSETX = -40;

        [smallestx, largestx, smallesty, largesty] = CalculateScale(
            graphData,
            adaptive
        );

        var GRAPHDOM = [];

        // Calculate shapes to create shadow below graph line
        function CalculateShadow(bottomVal, bottomVal2, leftVal, leftVal2) {
            var points;
            var rectw;
            var recty;
            var recth;

            // If line is on incline
            if (bottomVal > bottomVal2) {
                points = `${leftVal},${bottomVal} ${leftVal2},${bottomVal2} ${leftVal2},${bottomVal}`;
                rectw = leftVal2 - leftVal;
                recty = bottomVal;
                recth = graphHeight - bottomVal - graphAxis;
            }
            // If line is on decline
            else {
                points = `${leftVal},${bottomVal} ${leftVal2},${bottomVal2} ${leftVal},${bottomVal2}`;
                rectw = leftVal2 - leftVal;
                recty = bottomVal2;
                recth = graphHeight - bottomVal2 - graphAxis;
            }

            return (
                <>
                    <polygon className="underline" points={points} />
                    <rect
                        className="underline"
                        width={rectw}
                        height={recth}
                        x={leftVal}
                        y={recty}
                    />
                </>
            );
        }

        // Calculate how to scale graph based on maxium and minimum datapoints
        function CalculateScale(graphData, adaptive) {
            // Get values to scale the graph and if the data object is empty just set the values to 1
            if (graphData.length == 0) {
                largestx = 1;
                smallestx = 1;
            } else {
                if (adaptive) {
                    largesty = GetLargestYValue(graphData);
                } else {
                    largesty = 100;
                }

                smallesty = GetSmallestYValue(graphData);

                largestx = graphData[graphData.length - 1].time;
                smallestx = graphData[0].time;
            }

            return [smallestx, largestx, smallesty, largesty];
        }

        // Calculate points of each line
        function CalculatePoints(index, data1, data2) {
            // If last data value is the only value then return
            if (index == graphData.length - 1) {
                return [0, 0, 0, 0];
            }

            // Calculate values for the current data point
            const bottomVal =
                graphHeight -
                (data1.value / largesty) * (graphHeight - graphAxis) -
                graphAxis;
            const leftVal =
                ((data1.time - smallestx) / (largestx - smallestx)) *
                    (graphWidth - graphAxis) +
                graphAxis;

            // Calculate values for the next datapoint in order to draw a line
            const bottomVal2 =
                graphHeight -
                (data2.value / largesty) * (graphHeight - graphAxis) -
                graphAxis;
            const leftVal2 =
                ((data2.time - smallestx) / (largestx - smallestx)) *
                    (graphWidth - graphAxis) +
                graphAxis;

            return [bottomVal, bottomVal2, leftVal, leftVal2];
        }

        // Needed to auto-scale the graph to the largest value
        function GetLargestYValue(graphData) {
            if (graphData.length == 0) {
                return 1;
            }

            var largestValue = 1;

            graphData.forEach((data) => {
                if (data.value > largestValue) {
                    largestValue = data.value;
                }
            });

            return largestValue;
        }

        // Needed to calculate the shapes to shadow the underline
        function GetSmallestYValue(graphData) {
            if (graphData.length == 0) {
                return 100;
            }

            var smallestValue = null;

            graphData.forEach((data) => {
                if (smallestValue == null) {
                    smallestValue = data.value;
                    return;
                }

                if (data.value < smallestValue) {
                    smallestValue = data.value;
                }
            });

            return smallestValue;
        }

        // Iterate all the data and calculate relevant coordinates and generate DOM
        graphData.map((data1) => {
            // Get next data values
            const index = graphData.indexOf(data1);
            const data2 = graphData[index + 1];

            const [bottomVal, bottomVal2, leftVal, leftVal2] = CalculatePoints(
                index,
                data1,
                data2
            );

            GRAPHDOM.push(
                <>
                    <line
                        x1={leftVal}
                        y1={bottomVal}
                        x2={leftVal2}
                        y2={bottomVal2}
                        className={lineClassName}
                        key={data1.time}
                    />

                    {CalculateShadow(bottomVal, bottomVal2, leftVal, leftVal2)}
                </>
            );
        });

        // Return the DOM generated previously
        return (
            <div
                className="graph_holder"
                style={{
                    width: `${graphWidth}px`,
                    height: `${graphHeight}px`,
                }}
            >
                <svg
                    style={{
                        width: `${graphWidth}px`,
                        height: `${graphHeight}px`,
                    }}
                >
                    {GRAPHDOM}

                    <line
                        x1={graphAxis}
                        y1={graphHeight - graphAxis}
                        x2={graphWidth}
                        y2={graphHeight - graphAxis}
                        className="graph-axis"
                        key="X-Axis"
                    />

                    <line
                        x1={graphAxis}
                        y1={graphHeight - graphAxis}
                        x2={graphAxis}
                        y2={0}
                        className="graph-axis"
                        key="Y-Axis"
                    />

                    <text x={TEXTOFFSETX + graphAxis} y={TEXTOFFSETY + graphHeight - graphAxis} fill="black">
                        0%
                    </text>

                    <text x={TEXTOFFSETX + graphAxis} y={(TEXTOFFSETY + graphHeight - graphAxis) / 2} fill="black">
                        {Math.round(largesty / 2)}%
                    </text>

                    <text x={TEXTOFFSETX + graphAxis} y={TEXTOFFSETY} fill="black">
                        {Math.round(largesty)}%
                    </text>


                    <text x={graphAxis} y={TEXTOFFSETY + graphHeight - graphAxis} fill="black">
                        20
                    </text>

                    <text x={((graphWidth - graphAxis) / 2 ) + graphAxis} y={TEXTOFFSETY + graphHeight - graphAxis} fill="black">
                        10
                    </text>

                    <text x={graphWidth - 12} y={TEXTOFFSETY + graphHeight - graphAxis} fill="black">
                        0
                    </text>


                    <text x={(graphWidth / 2 ) + TEXTOFFSETX} y={graphHeight -3} fill="black">
                        Time Recorded (seconds)
                    </text>
                </svg>
            </div>
        );
    }
}

Graph.defaultProps = {
    graphData: [
        {
            time: 0,
            value: 0,
        },
    ],

    graphWidth: 500,
    graphHeight: 300,
    graphAxis: 40,
    lineClassName: "graph_line1",
    adaptive: false,
};
