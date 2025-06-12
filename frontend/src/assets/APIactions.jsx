import Cookies from "universal-cookie";

function GetAPIAddr() {
    const addr = `${window.location.protocol}//${window.location.hostname}:8080`;
    console.log(addr)
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
