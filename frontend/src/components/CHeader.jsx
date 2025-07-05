import { Logout } from "../assets/APIactions";

import "../assets/dashboard.css";
import appleIMG from "../../src/images/apple.png";

export default function Header() {
  return (
    <div className="dashboard-header">
      <img src={appleIMG} href="/" onClick={Home} style={{width: "64px", height: "64px"}}/>
      <b>Powercraft</b>
      <div className="options">
        <span
          onClick={() => {
            Redirect("dashboard");
          }}
        >
          {" "}
          Servers
        </span>
        <span
          onClick={() => {
            Redirect("players");
          }}
        >
          Players
        </span>

        <span
          onClick={() => {
            Redirect("users");
          }}
        >
          Users and permissions
        </span>
        <span
          onClick={() => {
            Redirect("programs");
          }}
        >
          Programs
        </span>
        <span
          onClick={() => {
            Redirect("configurations");
          }}
        >
          Configurations
        </span>
        <span onClick={Logout}>Logout</span>
      </div>
    </div>
  );
}

function Redirect(path) {
  document.location.href = path;
}

// Redirect home
function Home() {
  document.location.href = "/dashboard";
}
