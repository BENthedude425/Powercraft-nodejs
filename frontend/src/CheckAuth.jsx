import Cookies from "universal-cookie";
import {GetAPIAddr} from "../src/assets/APIactions";

export default async function CheckAuth() {
    const APIADDR = GetAPIAddr();
    return new Promise(function (resolve, reject) {
        const cookies = new Cookies();
        const cookie = cookies.get("auth_token");

        fetch(`${APIADDR}/api/authenticate/${cookie}`, {
            credentials: "include",
        }).then(function (response) {
            response.json().then(function (text) {
                resolve(text[0]);
            });
        });
    });
}
