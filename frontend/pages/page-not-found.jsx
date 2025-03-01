import {React} from "react";

import "../src/assets/page-not-found.css";

export default function PageNotFound(){
    return(
        <div>
            <h1>
                We couldn't find the page you were looking for ;/
            </h1>

            
            <u onClick={() =>{
              window.location.href = "/dashboard"  
            }}>Redirect to dashboard here</u>
            
        </div>
    )
}