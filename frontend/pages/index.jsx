import CheckAuth from "../src/CheckAuth";
import { useEffect } from "react";
import {useNavigate} from "react-router-dom";


// Check whether the user is already containing a correct token to decide to navigate to the main page or login page
export default function PIndex() {
  const navigate = useNavigate();
  
    useEffect(() => {
    CheckAuth().then(function (auth) {
    // if authenticated navigate to the main page
      if (auth) {
        navigate("/dashboard")
      }
      // else navigate to login page
      navigate("/login")
    });
  });
}
