import { React, Component } from "react";

import "../assets/graph.css";

// Calculate shapes to create shadow below graph line
function CalculateShadow(
    object,
    bottomVal,
    bottomVal2,
    leftVal,
    leftVal2,
    shadowClassName
) {
    if (!object.enableShadow) {
        return;
    }

    var points;
    var rectw;
    var recty;
    var recth;

    // If line is on incline
    if (bottomVal > bottomVal2) {
        points = `${leftVal},${bottomVal} ${leftVal2},${bottomVal2} ${leftVal2},${bottomVal}`;
        rectw = leftVal2 - leftVal;
        recty = bottomVal;
        recth = object.graphHeight - bottomVal - object.graphAxis;
    }
    // If line is on decline
    else {
        points = `${leftVal},${bottomVal} ${leftVal2},${bottomVal2} ${leftVal},${bottomVal2}`;
        rectw = leftVal2 - leftVal;
        recty = bottomVal2;
        recth = object.graphHeight - bottomVal2 - object.graphAxis;
    }

    return (
        <>
            <polygon className={shadowClassName} points={points} />
            <rect
                className={shadowClassName}
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
    var smallestx, largestx, smallesty, largesty;
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

        largestx = graphData[graphData.length - 1].time;
        smallestx = graphData[0].time;
    }

    return [smallestx, largestx, null, largesty];
}

// Calculate points of each line
function CalculatePoints(object, index, data1, data2) {
    // If last data value is the only value then return
    if (index == object.graphData.length - 1) {
        return [0, 0, 0, 0];
    }

    // Calculate values for` t`he current data point
    const bottomVal =
        object.graphHeight -
        (data1.value / object.largesty) *
            (object.graphHeight - object.graphAxis) -
        object.graphAxis;
    const leftVal =
        ((data1.time - object.smallestx) /
            (object.largestx - object.smallestx)) *
            (object.graphWidth - object.graphAxis) +
        object.graphAxis;

    // Calculate values for the next datapoint in order to draw a line
    const bottomVal2 =
        object.graphHeight -
        (data2.value / object.largesty) *
            (object.graphHeight - object.graphAxis) -
        object.graphAxis;
    const leftVal2 =
        ((data2.time - object.smallestx) /
            (object.largestx - object.smallestx)) *
            (object.graphWidth - object.graphAxis) +
        object.graphAxis;

    return [bottomVal, bottomVal2, leftVal, leftVal2];
}

// Needed to auto-scale the graph to the largest value
function GetLargestYValue(graphData) {
    if (graphData.length == 0) {
        return 1;
    }

    var largestValue = 1;

    if (graphData[0].total != null) {
        return graphData[0].total;
    }

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

class Graph extends Component {
    render() {
        // Init all props as variables
        this.graphData = this.props.graphData;
        this.graphWidth = this.props.graphWidth;
        this.graphHeight = this.props.graphHeight;
        this.graphAxis = this.props.graphAxis;
        this.gridArea = this.props.gridArea;
        this.adaptive = this.props.adaptive;
        this.lineClassName = this.props.lineClassName;
        this.shadowClassName = this.props.shadowClassName;
        this.enableShadow = this.props.enableShadow;
        [this.smallestx, this.largestx, this.smallesty, this.largesty];

        this.TEXTOFFSETY = 15;
        this.TEXTOFFSETX = -40;

        [this.smallestx, this.largestx, this.smallesty, this.largesty] =
            CalculateScale(this.graphData, this.adaptive);

        var GRAPHDOM = [];

        // Iterate all the data and calculate relevant coordinates and generate DOM
        this.graphData.map((data1) => {
            // Get next data values
            const index = this.graphData.indexOf(data1);
            const data2 = this.graphData[index + 1];

            const [bottomVal, bottomVal2, leftVal, leftVal2] = CalculatePoints(
                this,
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
                        className={this.lineClassName}
                        key={data1.time}
                    />

                    {CalculateShadow(
                        this,
                        bottomVal,
                        bottomVal2,
                        leftVal,
                        leftVal2,
                        this.shadowClassName
                    )}
                </>
            );
        });

        // Return the DOM generated previously
        return (
            <div
                className="graph_holder"
                style={{
                    width: `${this.graphWidth}px`,
                    height: `${this.graphHeight}px`,
                    gridArea: `${this.gridArea}`,
                }}
            >
                <svg
                    style={{
                        width: `${this.graphWidth}px`,
                        height: `${this.graphHeight}px`,
                    }}
                >
                    {GRAPHDOM}

                    <line
                        x1={this.graphAxis}
                        y1={this.graphHeight - this.graphAxis}
                        x2={this.graphWidth}
                        y2={this.graphHeight - this.graphAxis}
                        className="graph-axis"
                        key="X-Axis"
                    />

                    <line
                        x1={this.graphAxis}
                        y1={this.graphHeight - this.graphAxis}
                        x2={this.graphAxis}
                        y2={0}
                        className="graph-axis"
                        key="Y-Axis"
                    />

                    <text
                        x={this.TEXTOFFSETX + this.graphAxis}
                        y={this.TEXTOFFSETY + this.graphHeight - this.graphAxis}
                        fill="black"
                    >
                        0%
                    </text>

                    <text
                        x={this.TEXTOFFSETX + this.graphAxis}
                        y={
                            (this.TEXTOFFSETY +
                                this.graphHeight -
                                this.graphAxis) /
                            2
                        }
                        fill="black"
                    >
                        {Math.round(this.largesty / 2)}%
                    </text>

                    <text
                        x={this.TEXTOFFSETX + this.graphAxis}
                        y={this.TEXTOFFSETY}
                        fill="black"
                    >
                        {Math.round(this.largesty)}%
                    </text>

                    <text
                        x={this.graphAxis}
                        y={this.TEXTOFFSETY + this.graphHeight - this.graphAxis}
                        fill="black"
                    >
                        20
                    </text>

                    <text
                        x={
                            (this.graphWidth - this.graphAxis) / 2 +
                            this.graphAxis
                        }
                        y={this.TEXTOFFSETY + this.graphHeight - this.graphAxis}
                        fill="black"
                    >
                        10
                    </text>

                    <text
                        x={this.graphWidth - 12}
                        y={this.TEXTOFFSETY + this.graphHeight - this.graphAxis}
                        fill="black"
                    >
                        0
                    </text>

                    <text
                        x={this.graphWidth / 2 + this.TEXTOFFSETX}
                        y={this.graphHeight - 3}
                        fill="black"
                    >
                        Time Recorded (seconds)
                    </text>
                </svg>
            </div>
        );
    }
}

class IntegratedGraph extends Component {
    render() {
        function GetGraphGrid(object) {
            var DOM = [];
            const gridNumber = 5;
            const spacing = 1 / gridNumber;

            for (let x = 0; x < gridNumber; x++) {
                DOM.push(
                    <line
                        x1={
                            object.graphAxis +
                            x *
                                (object.graphWidth - object.graphAxis) *
                                spacing +
                            (object.graphWidth - object.graphAxis) * spacing
                        }
                        y1={0}
                        x2={
                            object.graphAxis +
                            x *
                                (object.graphWidth - object.graphAxis) *
                                spacing +
                            (object.graphWidth - object.graphAxis) * spacing
                        }
                        y2={object.graphHeight - object.graphAxis}
                        className="graph_grid"
                        key={`grid ${x + 1} 0`}
                    />
                );
            }

            var position;

            for (let y = 0; y < gridNumber; y++) {
                position =
                    y * (object.graphHeight - object.graphAxis) * spacing +
                    (object.graphHeight - object.graphAxis) * spacing;

                DOM.push(
                    <>
                        <line
                            x1={object.graphAxis}
                            y1={position}
                            x2={object.graphWidth}
                            y2={position}
                            className="graph_grid"
                            key={`grid 0 ${y + 1}`}
                        />

                        <text x={"5px"} y={position} fill="black">
                            {80 - y * 20}%
                        </text>
                    </>
                );
            }
            
            DOM.push(
                <>
                    <text
                        x={object.graphAxis}
                        y={
                            object.TEXTOFFSETY +
                            object.graphHeight -
                            object.graphAxis
                        }
                        fill="black"
                    >
                        20
                    </text>

                    <text
                        x={
                            (object.graphWidth - object.graphAxis) / 2 +
                            object.graphAxis
                        }
                        y={
                            object.TEXTOFFSETY +
                            object.graphHeight -
                            object.graphAxis
                        }
                        fill="black"
                    >
                        10
                    </text>

                    <text
                        x={object.graphWidth - 12}
                        y={
                            object.TEXTOFFSETY +
                            object.graphHeight -
                            object.graphAxis
                        }
                        fill="black"
                    >
                        0
                    </text>

                    <text
                        x={object.graphWidth / 2 + object.TEXTOFFSETX}
                        y={object.graphHeight - 3}
                        fill="black"
                    >
                        Time Recorded (seconds)
                    </text>
                </>
            );

            return DOM;
        }

        // Init all props as variables
        this.graphData = this.props.graphData;
        this.graphWidth = this.props.graphWidth;
        this.graphHeight = this.props.graphHeight;
        this.graphAxis = this.props.graphAxis;
        this.graphKeys = this.props.graphKeys;
        this.gridArea = this.props.gridArea;
        this.adaptive = false;
        this.lineClassName = this.props.lineClassName;
        this.enableShadow = this.props.enableShadow;
        [this.smallestx, this.largestx, this.smallesty, this.largesty];
        this.TEXTOFFSETY = 15;
        this.TEXTOFFSETX = -40;
        this.graphGridDOM = GetGraphGrid(this);


        const graphLines = Object.keys(this.graphData);

        [this.smallestx, this.largestx, this.smallesty, this.largesty] =
            CalculateScale(this.graphData[graphLines[0]].data, this.adaptive);

        var GRAPHDOM = [];

        // Iterate all the data and calculate relevant coordinates and generate DOM
        graphLines.map((lineName) => {
            const line = this.graphData[lineName];
            const lineData = line.data;

            lineData.map((data1) => {
                // Get next data values
                const index = lineData.indexOf(data1);
                const data2 = lineData[index + 1];

                if (data2 == undefined) {
                    return;
                }

                const [bottomVal, bottomVal2, leftVal, leftVal2] =
                    CalculatePoints(this, index, data1, data2);

                GRAPHDOM.push(
                    <>
                        <line
                            x1={leftVal}
                            y1={bottomVal}
                            x2={leftVal2}
                            y2={bottomVal2}
                            className={line.lineClassName}
                            key={data1.time}
                        />

                        {CalculateShadow(
                            this,
                            bottomVal,
                            bottomVal2,
                            leftVal,
                            leftVal2,
                            line.shadowClassName
                        )}
                    </>
                );
            });
        });
        
        // Return the DOM generated previously
        return (
            <div
                className="graph_holder"
                style={{
                    width: `${this.graphWidth}px`,
                    height: `${this.graphHeight}px`,
                    gridArea: `${this.gridArea}`,
                }}
            >
                <svg
                    style={{
                        width: `${this.graphWidth}px`,
                        height: `${this.graphHeight}px`,
                    }}
                >
                    {GRAPHDOM}

                    <line
                        x1={this.graphAxis}
                        y1={this.graphHeight - this.graphAxis}
                        x2={this.graphWidth}
                        y2={this.graphHeight - this.graphAxis}
                        className="graph-axis"
                        key="X-Axis"
                    />

                    <line
                        x1={this.graphAxis}
                        y1={this.graphHeight - this.graphAxis}
                        x2={this.graphAxis}
                        y2={0}
                        className="graph-axis"
                        key="Y-Axis"
                    />

                    {Object.keys(this.graphKeys).map((key) => {
                        const keys = Object.keys(this.graphKeys);
                        const index = keys.indexOf(key);
                        const y = this.graphHeight - this.graphAxis + 8;
                        const x = this.graphAxis + 32;

                        return (
                            <>
                                <rect
                                    height={16}
                                    width={16}
                                    x={x + index * 75}
                                    y={y}
                                    fill={this.graphKeys[key]}
                                />
                                <text
                                    x={x + index * 75}
                                    y={y + 30}
                                    fill={this.graphKeys[key]}
                                >
                                    {key}
                                </text>
                            </>
                        );
                    })}

                    {this.graphGridDOM.map((line) => {
                        return line;
                    })}
                </svg>
            </div>
        );
    }
}

IntegratedGraph.defaultProps = {
    graphData: {
        line1: {
            lineClassName: "string",
            data: [
                {
                    time: 0,
                    value: 0,
                },
                {
                    time: 100,
                    value: 100,
                },
            ],
        },

        line2: {
            lineClassName: "string",
            data: [
                {
                    time: 0,
                    value: 0,
                },
                {
                    time: 100,
                    value: 100,
                },
            ],
        },
    },

    graphWidth: 500,
    graphHeight: 300,
    graphAxis: 40,
    graphKeys: [],
    gridArea: "none",
    lineClassName: "graph_line1",
    enableShadow: true,
    TEXTOFFSETY : 15,
    TEXTOFFSETX : -40,
};

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
    gridArea: "none",
    lineClassName: "graph_line1",
    shadowClassName: "graph_shadow1",
    enableShadow: true,

    // Specific to regular graphs
    adaptive: false,
};

export { Graph, IntegratedGraph };
