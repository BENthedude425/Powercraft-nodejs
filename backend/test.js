import inquirer from "inquirer"

function x() {
  return inquirer.prompt([
    {
      type: "input",
      name: "first name",
      message: "Enter your first name"
    },
  ]);
}

async function y(){
  var c = await x()
  console.log(c)
}

y()
