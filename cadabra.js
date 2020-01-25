const beepMap = {
    "Příchod": {first: true, last: false, opening: true},
    "Odchod": {first: false, last: true, opening: false},
    "Přestávka": {first: false, last: false, opening: false},
    "Služební cesta": {first: true, last: false, opening: true},
    "Dovolená": {first: true, last: true, opening: true},
    "Lékař": {first: true, last: true, opening: true},
    "Paragraf": {first: true, last: true, opening: true},
    "Nemoc": {first: true, last: true, opening: true},
    "Náhradní volno": {first: true, last: true, opening: true},
    "Neplacené volno": {first: true, last: true, opening: true},
    "Školení": {first: true, last: true, opening: true},
    "Placené volno": {first: true, last: true, opening: true},
    "OČR": {first: true, last: true, opening: true},
    "Sick Day": {first: true, last: true, opening: true},
    "Otcovská": {first: true, last: true, opening: true}
};

drill();

function drill() {
    const workDays = getWorkingDayRows().map(it => convertRowToModel(it));

    workDays.forEach(day => {
        const errors = checkDayIntegrity(day);

        if (errors.length > 0) {
            day.statusCell.style.backgroundColor = 'rgba(255,0,0,0.77)';
            const ul = document.createElement('ul');
            errors.forEach(error => ul.appendChild(createErrorListItem(error)));
            day.statusCell.appendChild(ul);
        }

    });
}

/**
 * The main data processing function that parses the HTML input and returns an array of javascript objects.
 * The javascript objects contain the <i>date</i> field - containing the string format of date of the
 * abacus entry in format dd.mm.yy.
 * Next it contains an array of strings under the field <i>beeps</i>.
 * @param tableRow
 * @param tableRow
 * @returns {{date: *, beeps: *, statusCell: *}}
 */
function convertRowToModel(tableRow) {
    const statusCell = extractStatusTableCell(tableRow);
    return {
        date: extractDateFromRow(statusCell),
        statusCell: statusCell,
        beeps: extractBeepsFromRow(tableRow)
    };
}

function extractDateFromRow(statusCell) {
    return statusCell.querySelector('strong').innerHTML;
}

function extractStatusTableCell(tableRow) {
    return tableRow.querySelector('td');
}

/**
 * This function consumes a HTML element and tries to extract
 * all values of time entries in order as they have been inserted.
 * @param tableRow: HTMLElement
 * @returns {string[]}
 */
function extractBeepsFromRow(tableRow) {
    const nodeList = tableRow.querySelectorAll('td:nth-child(3) span.ddTitleText span.ddTitleText').values();
    return Array.from(nodeList)
        .map(beep => beep.innerHTML)
        .filter(beep => beep);
}

/**
 * This function queries the document for all days that are not weekend days.<br>
 * This function returns an array of <b>raw</b> HTML elements.
 * The holidays are filtered by the presence of img with holiday in the name of the image :-).
 * @returns {Element[]}
 */
function getWorkingDayRows() {
    const nodeList = document.querySelectorAll('tr.day-week').values();
    return Array.from(nodeList).filter(it => {
        const hasHoliday = it.querySelector('img').outerHTML.includes('holiday');
        return !hasHoliday;
    });
}

function createErrorListItem(errorText) {
    const errorListItem = document.createElement('li');
    errorListItem.innerHTML = errorText;
    errorListItem.style.fontWeight = '500';
    errorListItem.style.fontSize = '.8rem';
    errorListItem.style.color = 'white';
    errorListItem.style.marginTop = '1rem';
    return errorListItem;
}

function checkDayIntegrity(dayInfo) {
    let lastBeep;
    const errors = [];
    dayInfo.beeps.forEach((it, index, allBeeps) => {
        const beepInfo = beepMap[it];

        checkFirstItemValidity(beepInfo, index, errors, it);
        checkLastItemValidity(beepInfo, index, errors, it, allBeeps);
        checkItemContinuity(beepInfo, index, errors, it, lastBeep);

        lastBeep = beepInfo;
        lastBeep['name'] = it;
    });
    return errors;
}

function checkFirstItemValidity(beep, index, errors, beepValue) {
    if (index === 0 && !beep.first) {
        errors.push(`First entry of the day cannot  be ${beepValue}`);
    }
}

function checkLastItemValidity(beep, index, errors, beepValue, allBeeps) {
    if (index === allBeeps.length - 1 && !beep.last) {
        errors.push(`Last entry of the day cannot  be ${beepValue}`);
    }
}

function checkItemContinuity(beep, index, errors, beepValue, previousBeep) {
    if (previousBeep && previousBeep.opening === beep.opening) {
        errors.push(`The entry ${previousBeep.name} cannot be followed by ${beepValue}`);
    }
}


