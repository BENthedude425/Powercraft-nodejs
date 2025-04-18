import GetAPIAddr from "./getAPIAddr";

function GatherForm(formID) {
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
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(new URLSearchParams(formData));

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            const response = xhr.responseText;
            const responseJSON = JSON.parse(response);
            console.log(responseJSON);
            if (responseJSON[0]) {
                alert(responseJSON[1]);
                window.location = responseJSON[2];
                return;
            }

            alert(responseJSON[1]);
        }
    };
}

export default SendForm;
