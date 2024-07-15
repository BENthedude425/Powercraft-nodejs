import { React } from "react";
import { useSpring, animated } from "react-spring";
import "../assets/sidebar.css";

export default function SideBar() {
  return (
    <div className="sidebar">
      <span href="/login">Chat</span>
      <span href="/login">Console</span>
      <span href="/login">Players</span>
      <span href="/login">Config Files</span>
      <span href="/login">Plugins</span>
      <span href="/login">Backup</span>
      <span href="/login">Quick commands</span>
      <span href="/login">Scheduled commands</span>

      <span className="sidebar-dropdown">
        <span>Advanced</span>
        <div className="sidebar-content">
          <span>Powercraft users</span>
          <span>Powercraft settings</span>
        </div>
      </span>
      <span href="/login">Scheduled commands</span>
    </div>
  );
}
