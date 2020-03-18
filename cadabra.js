const beepMap = {
    "Příchod": {first: true, last: false, opening: true},
    "Odchod": {first: false, last: true, opening: false},
    "Přestávka": {first: false, last: false, opening: false},
    "Služební cesta": {first: true, last: false, opening: true},
    "Dovolená": {first: true, last: true, opening: false},
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
    test();
    const workDays = getWorkingDayRows().map(it => convertRowToModel(it));

    const globalOverview = [];
    const currDateString = getCurrentDateString();

    workDays.forEach(day => {
        const errors = checkDayIntegrity(day);

        if (currDateString === day.date) {
            day.statusCell.parentElement.style.backgroundColor = 'rgba(12,144,45,0.57)';
            appendWarningsToDay(day, errors, ['Today'])
        } else if (errors.length > 0) {
            globalOverview.push({day: day.date, errorCount: errors.length});
            day.statusCell.parentElement.style.backgroundColor = 'rgba(255,0,0,0.77)';
            appendWarningsToDay(day, errors);
        }

    });

    createGlobalStatusBar(globalOverview);

}

function test() {

    const result = Array.from(
        document.querySelectorAll('.log > strong'))
        .map(it => it.childNodes)
        .map(it => Array.from(it).map(that => that['wholeText']).filter(it => it !== undefined).filter(it => /Pr.ce.*/.test(it)))
        .map(it => it[0].split(' ')[1])
        .map(it => {
            return {hrs: parseInt(it.split(':')[0]), mins: parseInt(it.split(':')[1])};
        })
        .filter(it => (it.hrs + it.mins) !== 0);

    const workDays = getWorkingDayRows().length - result.length;

    const minutesIntermediate = result.map(it => it.mins).reduce((a, b) => a + b);
    let hoursTotal = result.map(it => it.hrs).reduce((a, b) => a + b) + Math.floor(minutesIntermediate / 60);
    let minutesTotal = minutesIntermediate % 60;

    const hoursToWorkInAllMonth = getWorkingDayRows().length * 8;

    const minutesToWorkInAllMonth = hoursToWorkInAllMonth * 60;
    const minutesWorkedInAllMonth = hoursTotal * 60 + minutesTotal;
    const minutesRemainingInAllMonth = minutesToWorkInAllMonth - minutesWorkedInAllMonth;

    const toWorkDaily = minutesRemainingInAllMonth / workDays;

    console.log(`Worked for ${minutesWorkedInAllMonth} minutes from total of ${minutesToWorkInAllMonth} minutes monthly - remaining to work for ${minutesRemainingInAllMonth} - for the remaining ${workDays} days it is ${Math.floor(toWorkDaily / 60)}:${toWorkDaily % 60} per day`);


    Array.from(document.querySelectorAll('.day-week .log')).filter(it => it.children.length == 0).forEach(it => {
        const note = document.createElement('span');
        note.innerText = `You should work ${Math.floor(toWorkDaily / 60)} hours and ${Math.floor(toWorkDaily % 60)} minutes`;
        it.appendChild(note);
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
 * @returns {[string, string, string, HTMLInputElement][]}
 */
function extractBeepsFromRow(tableRow) {
    const nodeList = tableRow.querySelectorAll('td:nth-child(3) span.ddTitleText span.ddTitleText').values();
    return Array.from(nodeList)
        .map(beep => {
            const beepTime = beep.parentElement.parentElement.parentElement.parentElement.querySelector('input:nth-child(2)').value;
            const dateInputElement = beep.parentElement.parentElement.parentElement.parentElement.querySelector('input:nth-child(1)');
            const beepDate = dateInputElement.value;
            return [beep.innerHTML, beepTime, beepDate, dateInputElement];
        })
        .filter(beep => beep[0]);
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
        const beepInfo = beepMap[it[0]];

        checkFirstItemValidity(beepInfo, index, errors, it[0]);
        checkLastItemValidity(beepInfo, index, errors, it[0], allBeeps);
        checkItemContinuity(beepInfo, index, errors, it[0], lastBeep, it[1]);
        checkDateIntegrity(dayInfo.date, it, errors);

        lastBeep = beepInfo;
        lastBeep['name'] = it[0];
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

function checkItemContinuity(beep, index, errors, beepValue, previousBeep, beepTime) {
    if (previousBeep && previousBeep.opening === beep.opening) {
        errors.push(`The entry <u>${previousBeep.name}</u> cannot be followed by <u>${beepValue}</u> at the time ${beepTime}`);
    }
}

function checkDateIntegrity(dayDate, beepInfo, errors) {
    if (!dayDate.startsWith(beepInfo[2])) {
        errors.push(`The entry with time ${beepInfo[1]} has incorrect date value - ${beepInfo[2]}`);
    }
}

function createGlobalStatusBar(globalOverview) {
    if (globalOverview.length > 0) {
        const info = document.createElement('div');
        info.style.marginTop = '1rem';
        let text = '<h3 style="margin-bottom: 1rem">Some issues with your presence were found:</h3>' +
            '<ul style="padding-left: 1rem">';
        globalOverview.forEach(key => {
            text = text.concat(`<li>${key.day} - ${key.errorCount} errors</li>`);
        });
        text = text.concat('</ul>');
        info.innerHTML = text;
        document.querySelector('#sidebar').append(info);
    }
}

function appendWarningsToDay(day, errors, optionalMessages) {
    const ul = document.createElement('ul');
    if (optionalMessages) {
        optionalMessages.forEach(message => ul.appendChild(createErrorListItem(message)));
    }
    errors.forEach(error => ul.appendChild(createErrorListItem(error)));
    day.statusCell.appendChild(ul);
}

function zeroPad(num, places) {
    return String(num).padStart(places, '0');
}

function getCurrentDateString() {
    const currDate = new Date();
    return `${zeroPad(currDate.getDate(), 2)}.${zeroPad(currDate.getMonth() + 1, 2)}.${currDate.getFullYear().toString().substr(2)}`;
}


