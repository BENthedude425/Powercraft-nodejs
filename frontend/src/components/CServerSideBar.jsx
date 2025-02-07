function ServerSideBar() {
    return (
        <list className="side_bar">
            <li>                    ServerName                  </li>
            <li className="white">  Chat                        </li>
            <li>                    Console                     </li>
            <li className="white">  Map                         </li>
            <li>                    Worlds                      </li>
            <li className="white">  Players                     </li>
            <li>                    Plugins                     </li>
            <li className="white">  Server settings             </li>
        </list>
    );
}

function ToggleServerSideBar(){
    const sideBar = document.getElementById("sidebar");

    if(sideBar.style.display == none){
        sideBar.style.display == flex;
        return;
    }

    sideBar.style.display = none;
}


export {
    ServerSideBar,
    ToggleServerSideBar
}