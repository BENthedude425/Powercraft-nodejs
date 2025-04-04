import { React, Component } from "react";

import "../assets/graph.css";

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

export default class Graph extends Component {
    render() {
        // {time: timestamp. value: x}
        const graphData = this.props.graphData;
        const width = this.props.width;
        const height = this.props.height;
        const circleRadius = this.props.circleRadius;

        const dataPointClassName = this.props.dataPointClassName;
        const lineClassName = this.props.lineClassName;

        const enableDataPoints = this.props.dataPoints;

        var largestx;
        var smallestx;
        var largesty;

        // Get values to scale the graph and if the data object is empty just set the values to 1
        if (graphData.length == 0) {
            largestx = 1;
            smallestx = 1;
        } else {
            largesty = GetLargestYValue(graphData);
            largestx = graphData[graphData.length - 1].time;
            smallestx = graphData[0].time;
        }

        return (
            <svg width={width} height={height} className="graph_holder">
                {graphData.map((data1) => {
                    // Get next data values
                    const index = graphData.indexOf(data1);
                    const data2 = graphData[index + 1];

                    // Calculate values for the current data point
                    const bottomVal =
                        height - (data1.value / largesty) * height;
                    const leftVal =
                        ((data1.time - smallestx) / (largestx - smallestx)) *
                        width;

                    // If last data value = only return data point
                    if (index == graphData.length - 1) {
                        if (enableDataPoints) {
                            return (
                                <circle
                                    r={circleRadius}
                                    cx={leftVal}
                                    cy={bottomVal}
                                    className={dataPointClassName}
                                    key={data1.time}
                                />
                            );
                        }

                        return;
                    }

                    // Calculate values for the next datapoint in order to draw a line
                    const bottomVal2 =
                        height - (data2.value / largesty) * height;
                    const leftVal2 =
                        ((data2.time - smallestx) / (largestx - smallestx)) *
                        width;

                    // Return data point and line
                    if (enableDataPoints) {
                        return (
                            <>
                                <line
                                    x1={leftVal}
                                    y1={bottomVal}
                                    x2={leftVal2}
                                    y2={bottomVal2}
                                    className={lineClassName}
                                    key={data1.time}
                                />
                                <circle
                                    r={circleRadius}
                                    cx={leftVal}
                                    cy={bottomVal}
                                    className={dataPointClassName}
                                />
                            </>
                        );
                    }

                    return (
                        <line
                            x1={leftVal}
                            y1={bottomVal}
                            x2={leftVal2}
                            y2={bottomVal2}
                            className={lineClassName}
                            key={data1.time}
                        />
                    );
                })}

                <text x="0" y="15" fill="black">
                    {largesty}%
                </text>
            </svg>
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

    circleRadius: 6,
    width: 500,
    height: 300,
    dataPointClassName: "data_point1",
    lineClassName: "graph_line1",
};
