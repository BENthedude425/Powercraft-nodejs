import {React} from "react";
import "./main.css";

function Pcreate_user() {
    return(
        <div className="page">
            <div className="container_1">
                <div className="container_header">
                    <div style={{display:"inline"}}><span><b>P</b>owercraft</span></div>
                    
                    <img src="../pictures/apple.png" className="logo"/>
                </div>
                
                <form method="POST" action="http://localhost:8080/api/create-user">
                    <label>Create an account for powercraft</label>
                    <label>Username</label>
                    <input type="text" name="username" placeholder="username"/>

                    <label>Password</label>
                    <input type="password" name="password" placeholder="password"/>

                    <input type="submit" value="Create Account" className="submit"/>

                    <div class="bottom"><a href="login">Login</a></div>
                </form>
            </div>
        </div>
    )
}

export default Pcreate_user;