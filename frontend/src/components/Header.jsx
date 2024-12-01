import {useNavigate} from "react-router-dom";
import { React } from "react";
import Cookies from "universal-cookie";

export default function Header(props) { 
  return (
    <div className="dashboard-header">
      <img src="../pictures/apple.png" href="/"/>
    
    </div>
  );
}

function LogOut(){
  const cookies = new Cookies()
  const navigate = useNavigate()

  cookies.set("auth_token", null);
}
