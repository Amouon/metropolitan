const e = require('express');
const fetch = require('node-fetch');
const connection = require('../dabatase');

async function processTUZTimeBlock(block, day, processedNode) {
    block = block.replaceAll(/(<b>)|(<\/b>)|(<p>)|(<\/p>)|(<\/sup>)|(-)/ig, '');
    block = block.replaceAll('<sup>', ':');
    if (block.includes("Nu circula")) {
        processedNode.checks[0]++;
        processedNode.checks[1]++;
        processedNode.checks[2]++;
        return;
    }
    let timeBlockNodes = block.split(/\r?\n/).map(e => e.split(' ')).shift();
    for (const timeBlock of timeBlockNodes) {
        if (timeBlock.includes("Luni")) {
            processedNode.checks[0]++;
            if (processedNode.checks[0] == 0) day.type = "lv";
            else day.type = "lvr" 
        }
        else if (timeBlock.includes("Sambata") || timeBlock.includes("Sâmbăta")) {
            processedNode.checks[1]++;
            if (processedNode.checks[1] == 0) day.type = "s";
            else day.type = "sr" 
        }
        else if (timeBlock.includes("Duminica") || timeBlock.includes("Duminică")) {
            processedNode.checks[2]++;
            if (processedNode.checks[2] == 0) 
                day.type = "d";
            else 
                day.type = "dr" 
        }
        else if (/\d/.test(timeBlock) && timeBlock.includes(':') && day.type == "noDay") processedNode.checks[3]++;
        if (timeBlock.includes(':') && timeBlock.length <= 5 && timeBlock.length > 3)
            processSchedule(day, timeBlock, processedNode)
        if (timeBlock.length > 5) {
            if (timeBlock.includes(':')) {
                let block = timeBlock.split(/\r?\n/).map(e => e.split(',')).shift();
                for (let subBlock of block) {
                    if (subBlock.includes(':') && (noVowels(subBlock) || subBlock.includes('(elevi)'))) {
                        subBlock = subBlock.trim().slice(0, 5);
                        processSchedule(day, subBlock, processedNode)
                    }
                }
            }
        }
    }
}

async function processSchedule(day, block, processedNode) {
    switch(day.type) {
        case "lv":
            processedNode.weekday.departureTime.push(block.replace(/\;|\,|\./, ''));
            break;
        case "lvr":
            processedNode.weekday.returnTime.push(block.replace(/\;|\,|\./, ''));
            break;
        case "s":
            processedNode.saturday.departureTime.push(block.replace(/\;|\,|\./, ''));
            break;
        case "sr":
            processedNode.saturday.returnTime.push(block.replace(/\;|\,|\./, ''));
            break;
        case "d":
            processedNode.sunday.departureTime.push(block.replace(/\;|\,|\./, ''));
            break;
        case "dr":
            processedNode.sunday.returnTime.push(block.replace(/\;|\,|\./, ''));
            break;
        case "noDay":
            if (processedNode.checks[3] == 0) 
                processedNode.weekday.departureTime.push(block.replace(/\;|\,|\./, ''));
            else 
                processedNode.weekday.returnTime.push(block.replace(/\;|\,|\./, ''));
            break;
    }
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