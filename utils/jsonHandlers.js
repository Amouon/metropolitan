const e = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const connection = require('../dabatase');

async function processTUZTimeBlock(block, day) {
    // Prepare for the blocs for processing
    while (block.includes("</p>") || block.includes(";")) block = block.replace("</p>", '').replace(";", '');
    while (block.includes("<b>")) block = block.replace("<b>", '').replace("</b>", '')
    while (block.includes(",")) block = block.replace(",", '');
    while (block.includes("–") || block.includes("-")) block = block.replace("–", '').replace("-", '');
    while (block.includes("<sup>")) block = block.replace("<sup>", ':').replace("</sup>", '');
    while (block.includes("Elevi")) block = block.replace("Elevi", '').replace("elevi", '');
    while (block.includes("(") || block.includes(")")) block = block.replace("(", '').replace(")", '');
    block = block.replace("Luni", "Weekday").replace("Vineri", '');
    //console.log(block);
    let timeBlockNodes = block.split(/\r?\n/).map(e => e.split(' ')).shift();
    //console.log(timeBlockNodes);
    if (timeBlockNodes[0] == "Weekday") day.type++;
    else if (timeBlockNodes[0] == "Sambata" || timeBlockNodes[0] == "Sâmbăta") day.type++;
    else if (timeBlockNodes[0].trim() == "Duminica") day.type++;
    //else if (timeBlockNodes[0].trim() == "Nu" && day.type < 0) day.type = -2;
    else return;
    console.log(day.type);
    for (const timeBlock of timeBlockNodes) {
        if (timeBlock.length > 1 && timeBlock.length <= 5 && noVowels(timeBlock)) console.log(timeBlock); //processSchedule(lineId, day, timeBlock.trim(), dir);
    }
}

async function processSchedule(lineId, day, time, dir) {
    const db = await connection;
    //await db.query('DELETE FROM sjtimes WHERE lineNo = ? AND type = ?', [lineId, scheduleTypeId])
    /*if (time === "undefined") {
        if (workingDayHours[0][0] == "Nu circula") workingDayHours[0][0] = "";
        if (workingDayHours[0][1] == "Nu circula") workingDayHours[0][1] = "";
    } */
    //await db.query('INSERT INTO sjtimes(lineNo, departure, dir, type) VALUES (?, ?, ?, ?)', [lineId, time, dir, day]);
} 

function noVowels(string) {
    /*  
        This function will be checking a string if it contains any vowels. If it contains any, it returns false, else it returns true
        Input: A string
        Output: True or false depending if the string contains any vowels.
    */
    if (string.includes("i") || string.includes("e") || string.includes("o") || string.includes("a")) return false;
    return true;
}
module.exports = {
    processTUZTimeBlock
};