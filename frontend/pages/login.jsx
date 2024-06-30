import {React} from "react";
import "./main.css";

export default function Plogin(){
    return(
        <div className="page">
            <div className="container_1">
                <div className="container_header">
                    <div style={{display:"inline"}}><span><b>P</b>owercraft</span></div>
                    
                    <img src="../pictures/apple.png" className="logo"/>
                </div>
                
                <form method="POST" action="http://localhost:8080/api/login">
                    <label>Login to powercraft</label>
                    <label>Username</label>
                    <input type="text" name="username" placeholder="username"/>

                    <label>Password</label>
                    <input type="password" name="password" placeholder="password"/>

                    <input type="submit" value="Create Account" className="submit"/>

                    <div class="bottom"><a href="create-user">Create an account</a></div>
                </form>
            </div>
        </div>
    )
}