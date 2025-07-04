import { React, useEffect, useState } from "react";
import "../src/assets/main.css";
import {useNavigate} from "react-router-dom";
import {GetAPIAddr} from "../src/assets/APIactions";
import CheckAuth from "../src/CheckAuth";

export default function Plogin() {
    const navigate = useNavigate()
    const APIADDR = GetAPIAddr();
    const [auth, setAuth] = useState(null)


    // If the user already has auth redirect to dashboard
    useEffect(() =>{
        const promise = CheckAuth()

        promise.then((value) =>{
            setAuth(value)
        })
    }, [])

    if(auth){
        return(
            navigate("/dashboard")
        )
    }

    return (
        <div className="page" style={{ display: "flex" }}>
            <div className="container_1">
                <div className="container_header">
                    <div>
                        <span>Login to powercraft</span>
                    </div>

                    <img
                        src="../src/images/apple.png"
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
