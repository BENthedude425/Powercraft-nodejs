import GetAPIAddr from "./getAPIAddr";

function GatherForm(formID){
    const form = new FormData();
    const formElement = document.getElementById(formID);
    const children = formElement.children;
    
    for (const child of formElement.children) {
        if (child.tagName == "INPUT") {
            const name = child.name;
            const value = child.value;
            form.append(name, value);
        }
    }
    
    return form;
}

function SendForm(formID, formPath) {
    const APIADDR = GetAPIAddr();
    const formData = GatherForm(formID);
    const xhr = new XMLHttpRequest();
    console.log(`${APIADDR}${formPath}`);

    xhr.open("POST", `${APIADDR}${formPath}`);
    xhr.send(formData)

    xhr.onreadystatechange = function(){
        if(xhr.readyState == 4){
            const response = xhr.responseText;
            alert(response);
        }
    }
}

export default SendForm;
