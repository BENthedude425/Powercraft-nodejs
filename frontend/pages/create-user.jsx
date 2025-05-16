import { React } from "react";
import "../src/assets/main.css";
import {GetAPIAddr} from "../src/assets/APIactions";
import SendForm from "../src/assets/sendForm"

function Pcreate_user() {
    const APIADDR = GetAPIAddr();
    return (
        <div className="page" style={{ display: "flex" }}>
            <div className="container_1">
                <div className="container_header">
                    <div style={{ display: "inline" }}>
                        <span>Send user request</span>
                    </div>

                    <img
                        src="../pictures/apple.png"
                        className="container-logo"
                    />
                </div>

                <form id="creation-form">
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
                        required
                    />

                    <input
                        type="password"
                        name="password2"
                        className="text_input"
                        placeholder="re-type password"
                        required
                    />

                    <input
                        type="button"
                        onClick={() => {
                            SendForm("creation-form", "/api/create-user")
                        }}
                        value="Create account"
                        className="create-submit"
                    />

                    <div>
                        <button
                            className="bottom"
                            type="button"
                            onClick={() => {
                                window.location = "/login";
                            }}
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Pcreate_user;