import DashBoardSideBar from "../src/components/CDashSideBar";
import { PlayerList } from "../src/components/CPlayerList";
import { DashboardHeader } from "./dashboard";

export default function PPlayers() {
    return (
        <div className="page">
            <div className="main">
                <DashBoardSideBar />
                <div className="dashboard-container">
                    <DashboardHeader />
                    <div
                        className="dashboard-resource-container"
                        style={{ height: "100%" }}
                    >
                        <PlayerList />
                    </div>
                </div>
            </div>
        </div>
    );
}
