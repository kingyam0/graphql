import * as querydata from "./sendingdata.js"

let everyProject;
let everyTransaction;
let projectMap = new Map();
let profileTotalXpOutput = document.querySelectorAll(".profileTotalXpOutput");

const fetchQuery = () => {
    fetch(
        `https://learn.01founders.co/api/graphql-engine/v1/graphql`,
        querydata.importingQuery
    )
        .then((res) => res.json())
        .then(({ data, data: { userinfo, usersProgress, userTransactions } }) => {
            // console.log("Query Data: ", data);
            everyTransaction = userTransactions

            /* PROFILE INFORMATION */
            let usernameData = document.getElementById("profileusername")
            let profileInfo = document.getElementById("profile");
            let userid = document.createElement("p");
            let username = document.createElement("p");
            // let login = document.createElement("p");
            let lastProj = document.createElement("p");
            let projectGrade = document.createElement("p");

            username.innerHTML = `<h1><span> ${userinfo[0].login} - </span> GraphQL </h1> `
            // login.innerHTML = `Username: ${userinfo[0].login}`
            userid.innerHTML = `ID: ${userinfo[0].id}`
            lastProj.innerHTML = `Last Project: ${usersProgress.at(-1).object.name}`
            projectGrade.innerHTML = `Project Grade: ${usersProgress[0].grade.toFixed(2)}`

            usernameData.appendChild(username)
            // profileInfo.appendChild(login);
            profileInfo.appendChild(userid);
            profileInfo.appendChild(lastProj);
            profileInfo.appendChild(projectGrade);

            /* PROJECT INFORMATION */

            const userProjects = document.querySelector("#completed-projects");
            userProjects.innerHTML += callProjects(usersProgress)

            /* XP PER PROJECT INFORMATION */

            const xpByProject = document.querySelector("#projects-by-xp");

            everyProject = userTransactions.filter((value, index, self) => {
                return index === self.findIndex((t) => {
                    let isDone = false
                    for (let i = 0; i < usersProgress.length; i++) {
                        if (usersProgress[i].object.name === t.object.name && t.amount / 1000 > 1) {
                            isDone = true;
                            break
                        } else {
                            isDone = false;
                        }
                    }
                    return t.object.name === value.object.name && isDone
                })
            })
            xpByProject.innerHTML = `<h2> Projects XP </h2> -  <h2 class="projectName"></h2>  -  <h2 class="projectXP"></h2>`;
            generatePieChart(everyProject);
            createLineChart(everyProject);
        });
};

function createLineChart(userTransactions) {
    let totalAmount = 0;
    userTransactions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    userTransactions.forEach((transaction, index) => {
        const projectName = transaction.object.name;
        const amount = transaction.amount;
        const createdAt = transaction.createdAt;

        if (projectMap.has(projectName)) {
            const [existingAmount, lastCreatedAt] = projectMap.get(projectName);
            if (lastCreatedAt < createdAt) {
                projectMap.set(projectName, [existingAmount + amount, createdAt]);
            } else {
                console.log(`Ignoring older transaction with date ${createdAt} for project ${projectName}`);
            }
        } else {
            projectMap.set(projectName, [amount, createdAt]);
        }

        // sum up the total amount of all transactions
        totalAmount += amount;
    });

    let lineChart = document.getElementById("lineChart");
    let circle = document.getElementById("circle");
    let prevAmount = 0;
    let pathCommands = [];

    projectMap.forEach((transaction, projectName) => {
        const [amount, createdAt] = transaction;

        // get the total amount of all previous transactions for this project
        const projectAmount = prevAmount + amount;

        // create a new data point circle and add it to the chart
        const time = Date.parse(createdAt);
        const x = (time / (1000 * 60 * 60 * 24 * 7) - 2703) * 6;
        const y = (320 - (projectAmount / 1000) / 2);
        const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        let text1 = document.createElementNS('http://www.w3.org/2000/svg', "text");
        let text2 = document.createElementNS('http://www.w3.org/2000/svg', "text");

        text1.setAttribute("dy", ".35em")
        text1.setAttribute("x", "10")
        text1.setAttribute("y", "10")
        text1.style.display = "none"

        text2.setAttribute("dy", ".35em")
        text2.setAttribute("x", "10")
        text2.setAttribute("y", "35")
        text2.style.display = "none"

        point.setAttribute("cx", x);
        point.setAttribute("cy", y);
        point.setAttribute("r", 8);
        circle.append(point);
        circle.append(text1);
        circle.append(text2);

        // add the current point's coordinates to the pathCommands array
        if (pathCommands.length == 0) {
            pathCommands.push(`M${x},${y}`);
        } else {
            pathCommands.push(`L${x},${y}`);
        }

        point.onmouseover = function () {
            console.log("mouseover triggered");
            console.log("profileTotalXpData:", prevAmount);
            console.log("createdAt:", createdAt);
            console.log("projectName:", projectName);

            text1.style.display = "block";
            text2.style.display = "block";
            text1.textContent = `XP: ${projectAmount / 1000 + "kb "}`;

            let date = new Date(Date.parse(createdAt));
            let day = date.getDate();
            let month = date.getMonth() + 1;
            let year = date.getFullYear();
            text2.textContent = `DATE: ${day + "/" + month + "/" + year}`;
        }

        point.onmouseleave = function () {
            text1.style.display = "none";
            text2.style.display = "none";
        }
        // update the previous amount for this project
        prevAmount = projectAmount;
    });

    // create a new path element and set its "d" attribute to the path commands
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathCommands.join(" "));
    path.setAttribute("stroke", "black");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("fill", "none");
    lineChart.append(path);

    // display the total amount of all transactions
    profileTotalXpOutput[0].textContent += totalAmount / 1000 + "kb";
}

const generatePieChart = (everyProject) => {
    const radius = 150;
    const total = everyProject.reduce((acc, val) => acc + val.amount, 0);
    let currentAngle = 0;

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "400");
    svg.setAttribute("height", "400");
    svg.setAttribute("viewBox", "50 50 400 400");
    svg.style.backgroundColor = "rgb(255, 244, 244)";
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.margin = " auto";
    svg.style.borderRadius = "25px";
    svg.style.border = "solid"
    svg.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";

    const project = document.createElement("h3");

    for (let i = 0; i < everyProject.length; i++) {
        const transaction = everyProject[i];
        const angle = (transaction.amount / total) * 360;
        const startX = 250;
        const startY = 250;
        const endX = startX + radius * Math.cos(((currentAngle + angle) * Math.PI) / 180);
        const endY = startY + radius * Math.sin(((currentAngle + angle) * Math.PI) / 180);
        const largeArcFlag = 0;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute(
            "d",
            `M ${startX} ${startY} L ${startX + radius * Math.cos((currentAngle * Math.PI) / 180)} ${startY + radius * Math.sin((currentAngle * Math.PI) / 180)
            } A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
        );
        path.setAttribute("fill", randomColors());
        path.setAttribute("class", `${transaction.object.name}`);
        svg.appendChild(path);

        path.addEventListener("mouseover", () => {
            document.querySelector("#projects-by-xp > h2.projectName").innerText = transaction.object.name;
            document.querySelector("#projects-by-xp > h2.projectXP").innerText = `${transaction.amount} xp`;
        });
        path.addEventListener("mouseout", () => (project.innerText = ""));
        currentAngle += angle;
    }

    // Add the border
    const borderPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    borderPath.setAttribute(
        "d",
        `M ${250 - radius} ${250} A ${radius} ${radius} 0 1 0 ${250 + radius} ${250} A ${radius} ${radius} 0 1 0 ${250 - radius} ${250} Z`
    );
    borderPath.setAttribute("fill", "none");
    borderPath.setAttribute("stroke", "black");
    borderPath.setAttribute("stroke-width", "1");
    svg.appendChild(borderPath);

    const xpByProject = document.querySelector("#xp");
    xpByProject.appendChild(svg);
    project.classList.add("project");
    xpByProject.appendChild(project);
};

function randomColors() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

const callProjects = (usersProgress) => {
    return usersProgress.reduce((acc, curr, i) => {
        const newAcc = `<h5>${i + 1}. ${curr.object.name}</h5>`;
        return (acc += newAcc);
    }, "");
};

export { fetchQuery }

/*
REFERENCE: https://javascript.info/import-export

*/
