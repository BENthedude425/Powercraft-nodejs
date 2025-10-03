import DashBoardSideBar from "../src/components/CDashSideBar";
import { DashboardHeader } from "./dashboard";

export default function PPrograms(){
    return (
        <div className="page">
            <div className="main">
                <DashBoardSideBar />
                <div className="dashboard-container">
                    <DashboardHeader />
                    <div className="dashboard-resource-container">
                        <div className="dashboard-heading">Programs</div>
                    </div>
                </div>
            </div>
        </div>      
    )
}