import { execSync } from "child_process";
import fs from "fs"
import {v4 as uuidv4} from 'uuid';

const json = fs.readFileSync("./.git/config", { encoding: 'utf8' });


const dataArr = json.split("[remote ")[1].split("\n")

let version_control = ""
let remote = ""

for(let i of dataArr){

    console.log(i.includes("github.com"));
    if(i.includes("github.com")){
        version_control = "Github"
    }
    if(i.includes("remote = ")){
        console.log(i.split(" = ")[1]);
        remote = i.split(" = ")[1]
    }
}

if(version_control === "Github"){
    execSync("git pull")

    const myuuid = uuidv4();
    const branchName = `[upgrade-version]${myuuid}`
    execSync(`git checkout -b ${branchName}`)

    execSync(`git add package.json`)

    execSync(`git commit -m "Updated node modules versions"`)

    execSync(`git push ${remote} ${branchName}`)
}