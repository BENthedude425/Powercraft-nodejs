import {React} from "react";
import "../src/assets/main.css";

export default function Plogin(){
    return(
        <div className="page" style={{display:"flex"}}>
            <div className="container_1">
                <div className="container_header">
                    <div style={{display:"inline"}}><span><b>P</b>owercraft</span></div>
                    
                    <img src="../pictures/apple.png" className="container-logo"/>
                </div>
                
                <form method="POST" action="http://192.168.0.62:8080/api/login">
                    <label>Login to powercraft</label>
                    <label>Username</label>
                    <input type="text" name="username" placeholder="username"/>

                    <label>Password</label>
                    <input type="password" name="password" placeholder="password"/>

                    <input type="submit" value="Login" className="submit"/>

                    <div class="bottom"><a href="create-user">Create an account</a></div>
                </form>
            </div>
        </div>
    )
}