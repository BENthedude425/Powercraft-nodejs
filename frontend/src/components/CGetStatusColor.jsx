// Returns the status light color based on the status
export default function GetStatusColor(serverStatus) {
    switch (serverStatus) {
        case "Running":
            return { backgroundColor: "green" };
        case "Ready":
            return { backgroundColor: "orange" };
        case "Installing":
            return { backgroundColor: "yellow" };
        case "Downloading":
            return { backgroundColor: "yellow" };
        default:
            return { backgroundColor: "red" };
    }
}