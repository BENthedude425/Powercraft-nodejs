import Cookies from "universal-cookie";

function GetAPIAddr() {
    //const addr = "http://test.powercraft.uk:8081";
    //const addr = "http://192.168.0.15:8081";
    //const addr = "http://176.24.124.59:8081"
    const addr = "http://localhost:8081";

    return addr;
}

// Log the user out and redirect to login page
function Logout() {
    // Check if the user wants to log out
    if (!window.confirm("Are you sure you want to log out ?")) {
        return;
    }
    const cookies = new Cookies();

    cookies.set("auth_token", null);
    document.location.href = "/login";
}

export{
    GetAPIAddr,
    Logout,
};
