import { React } from "react";
import "../src/assets/main.css";
import GetAPIAddr from "../src/assets/getAPIAddr";

export default function Plogin() {
    const APIADDR = GetAPIAddr();

    return (
        <div className="page" style={{ display: "flex" }}>
            <div className="container_1">
                <div className="container_header">
                    <div style={{ display: "inline" }}>
                        <span>Login to powercraft</span>
                    </div>

                    <img
                        src="../pictures/apple.png"
                        className="container-logo"
                    />
                </div>

                <form method="POST" action={`${APIADDR}/api/login`}>
                    <input
                        type="text"
                        name="username"
                        className="text_input"
                        placeholder="username"
                    />

                    <input
                        type="password"
                        name="password"
                        className="text_input"
                        placeholder="password"
                    />

                    <input type="submit" value="Login" className="login-submit" />

                    <div>
                        <button
                            className="bottom"
                            type="button"
                            onClick={() =>{window.location="/create-user"}}
                        >
                            Create an account
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
