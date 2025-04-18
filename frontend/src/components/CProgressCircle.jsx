import "../assets/progress.css";

function ProgressCircle(props) {
    return (
        <svg style={{ position: "absolute"}} width={250} height={250}>
            <circle cx="125" cy="125" r="115" className="empty_circle" />

            <circle
                id={props.id}
                cx="125"
                cy="125"
                r="115"
                className="progress_circle"
                style={props.strokeStyle}
            />

            <text x="50%" y="50%" textAnchor="middle" fill="black">
                {props.name}
            </text>
            <text x="50%" y="60%" textAnchor="middle" fill="black">
                {props.text}
            </text>
        </svg>
    );
}

function GetStyle(circle, progress) {
    var color = "green";

    if (progress >= 60) {
        color = "orange";
    }

    if (progress >= 95) {
        color = "red";
    }

    if (progress == 0) {
        color = "red";
    }

    const offset = (progress / 100) * circle.circumference;
    const empty = circle.circumference - offset;

    return { strokeDasharray: `${offset} ${empty}`, stroke: color };
}

export { ProgressCircle, GetStyle };
