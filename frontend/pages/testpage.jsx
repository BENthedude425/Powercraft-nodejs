import React from "react";

import "../src/assets/servercontent.css";

import Header from "../src/components/Header";
import ServerContent from "../src/components/ServerContent";
import {ServerSideBar, ToggleServerSideBar} from "../src/components/ServerSideBar";

export default function PTest() {
    return (
        <div>
            <Header id="sidebar"/>
            <div className="container">
                <ServerSideBar />

                <ServerContent />

            </div>
        </div>
    );
}
