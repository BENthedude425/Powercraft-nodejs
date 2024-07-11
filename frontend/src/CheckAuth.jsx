import Cookies from "universal-cookie";

export default function CheckAuth() {
  return new Promise(function(resolve, reject){
    const cookies = new Cookies();
    const cookie = cookies.get("auth_token");
  
    fetch(
      `http://localhost:8080/api/authenticate/${cookie}`
    ).then(function(response){
      response.json().then(function(text){
        resolve(text[0]);
      });
    })
  })
}
