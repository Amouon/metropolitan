const fetch = require('node-fetch');

const SCHEDULE_TYPES = {
    WEEKDAY: 'lv',
    SATURDAY: 's',
    SUNDAY: 'd'
}

async function getCsvSchedule(lineNo, scheduleType) {
    const response = await fetch(`https://ctpcj.ro/orare/csv/orar_${lineNo.toUpperCase()}_${scheduleType}.csv`, {
        headers: {
            "Referer": "https://ctpcj.ro",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:99.0) Gecko/20100101 Firefox/99.0"
        }
    });

    return sanitizeCsv(await response.text());
}

function sanitizeCsv(csv) {
    let array = csv.split(/\r?\n/).map(e => e.split(','));
    return array.slice(5);
}

module.exports = {
    getCsvSchedule,
    SCHEDULE_TYPES
};

//GetCompatibleCategoryRecommendationWeightsByCategoryId