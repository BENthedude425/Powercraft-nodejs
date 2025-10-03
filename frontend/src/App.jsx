import { React } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./assets/app.css";

// IMPORT PROTECTED ROUTE COMPONENT \\
import { ProtectedRoute } from "./ProtectedRoute";

// IMPORT PAGES \\
import PIndex from "../pages/index";
import Pcreate_user from "../pages/create-user";
import Plogin from "../pages/login";
import { PDashboard } from "../pages/dashboard";
import PCreateServer from "../pages/create-server.jsx";
import PServerDashboard from "../pages/server-dashboard.jsx";
import PServerProperties from "../pages/server-properties.jsx";
import PageNotFound from "../pages/page-not-found.jsx";
import PPlayers from "../pages/players.jsx";
import PPrograms from "../pages/programs.jsx";
import PUsersandpermissions from "../pages/users-and-permissions.jsx";
import PServers from "../pages/servers.jsx";

import PTest from "../pages/testpage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<PageNotFound />} />
                <Route path="/" element={<PIndex />} />
                <Route path="login" element={<Plogin />} />
                <Route path="create-user" element={<Pcreate_user />} />

                <Route path="test" element={<PTest />} />

                <Route element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<PDashboard />} />

                    <Route path="create-server" element={<PCreateServer />} />
                    <Route
                        path="server-dashboard*"
                        element={<PServerDashboard />}
                    />
                    <Route
                        path="server-properties*"
                        element={<PServerProperties />}
                    />

                    <Route path="players" element={<PPlayers />} />
                    <Route path="programs" element={<PPrograms />} />
                    <Route
                        path="users-and-permissions"
                        element={<PUsersandpermissions />}
                    />
                    <Route path="servers" element={<PServers />}/>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
