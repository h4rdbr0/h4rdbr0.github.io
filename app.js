// Waiting for loading DOM
document.addEventListener('DOMContentLoaded', async() => {

    // Adding hours fields to header row
    const totalHours = 24;
    let $headerRow = document.querySelector('.header-row');
    for (let i = 0; i < totalHours; i += 1) {
        let $timeBlock = createDivWithClass(`employee-time time-${i}`);
        $timeBlock.innerHTML = `${addZeroes(i)}:00`;
        $headerRow.append($timeBlock);
    }

    // Making a request for loading JSON-data
    let response = await fetch('./employee.json');
    let employeeData = await response.json();

    // Drawing legend panel
    drawLegend();

    // Checking the correctness of input data
    checkingScheduleCorrectness(employeeData);

    // Get dates for filtering and drawing a full schedule
    getAvailableDates(employeeData);
    drawSchedule(employeeData);
    
});

/**
 * A function for checking the correctness of input data
 * 
 * @param {object} inputSchedule - Input schedule
 */
function checkingScheduleCorrectness(inputSchedule) {

    // Virutal field
    if (!inputSchedule.hasOwnProperty('virtual')) {
        throw new Error('There is no virtual schedule! Please use a valid data!');
    }

    // Actual field
    if (!inputSchedule.hasOwnProperty('actual')) {
        throw new Error('There is no actual schedule! Please use a valid data!');
    }

    let virtualSchedule = inputSchedule.virtual;
    let actualSchedule = inputSchedule.actual;

    // Checking the schedule filling
    if (virtualSchedule.length === 0 || actualSchedule.length === 0) {
        throw new Error('A virtual or actual schedule is empty!');
    }

    // Checking schedules equality
    if (virtualSchedule.length !== actualSchedule.length) {
        throw new Error('Virtual and actual schedule mismatch!');
    }

    /**
     * A function for checking date equality for time start and time end working
     * 
     * @param {object} scheduleArray - Input schedule array (virtual or actual)
     */
    function datesEquality(scheduleArray) {
        scheduleArray.forEach(employee => {
            let msecStart = Date.parse(employee[3]);
            let msecEnd = Date.parse(employee[4]);
            if (!isNaN(msecStart) && !isNaN(msecEnd)) {
                let formattedDateStart = getFormattedDate(msecStart);
                let formattedDateEnd = getFormattedDate(msecEnd);
                if (formattedDateStart !== formattedDateEnd) {
                    throw new Error('The day of start working and end working must be equal!');
                }
            }
        });
    }

    // Checking dates equality
    datesEquality(virtualSchedule);
    datesEquality(actualSchedule);

}

/**
 * A function for getting available dates in schedule
 * 
 * @param {object} inputSchedule - Full schedule
 */
function getAvailableDates(inputSchedule) {

    // Making a new Set for saving uniques dates
    let dateSet = new Set();

    // Parsing dates in a schedule and adding to Set in format DD-MM-YYYY
    inputSchedule.virtual.forEach(item => {
        let dateStart = item[3];
        let timeInMsec = Date.parse(dateStart);
        if (!isNaN(timeInMsec)) {
            let formattedDate = getFormattedDate(timeInMsec);
            dateSet.add(formattedDate);
        }
    });

    // Sorting dates
    let sortedDates = sortingDates(dateSet);

    // List of dates for filtering
    let $datesList = document.querySelector('.dates-list');

    // Sorting through Set - making new elements and adding click listeners
    for (let date of sortedDates) {
        let $date = document.createElement('div');
        $date.innerText = date;
        $date.addEventListener('click', chooseDateOnClick.bind(null, inputSchedule, date));
        $datesList.append($date);
    }

    // Adding click listener to get a full schedule
    $datesList.querySelector('.full-schedule').addEventListener(
        'click', drawSchedule.bind(null, inputSchedule)
    );

}

/**
 * A function for filtering dates
 * 
 * @param {object} inputSchedule - Input schedule
 * @param {string} date - Date in format DD-MM-YYYY 
 */
function chooseDateOnClick(inputSchedule, date) {

    // Making a filtered schedule
    let filteredSchedule = {};
    filteredSchedule.actual = [];

    // Filtering virtual schedule, based on required date
    filteredSchedule.virtual = inputSchedule.virtual.filter((employee, index) => {
        let employeeDateStart = employee[3];
        let msec = Date.parse(employeeDateStart);
        if (!isNaN(msec)) {
            let formattedDate = getFormattedDate(msec);
            if (formattedDate === date) {
                filteredSchedule.actual.push(inputSchedule.actual[index]);
                return true;
            }
        }
    });

    // Drawing new filtered schedule
    drawSchedule(filteredSchedule);

}

/**
 * A function for drawing full schedule
 * 
 * @param {object} inputSchedule - Input schedule
 */
function drawSchedule(inputSchedule) {

    // Clearing previous schedule, if it exists
    let employeesRows = [...document.querySelectorAll('.employee-row')];
    if (employeesRows.length !== 0) {
        employeesRows.forEach($row => $row.remove());
    }

    // At the start handling with virtual schedule
    inputSchedule.virtual.forEach((item, index) => {

        // Making a new row based on header row
        let $newEmployeeRow = document.querySelector('.header-row').cloneNode(true);
        $newEmployeeRow.className = `employee-row employee-${index}`;
        $newEmployeeRow.setAttribute('is-virtual', true);

        // Adding Name and Place/Role
        $newEmployeeRow.querySelector('.employee-name').innerText = item[0];
        $newEmployeeRow.querySelector('.employee-role').innerText = `${item[1]} / ${item[2]}`;

        // Adding click listener - changing working hours
        $newEmployeeRow.addEventListener('click', changeWorkingHours.bind(null, inputSchedule, $newEmployeeRow, index));

        // Appending to the main container
        document.querySelector('.schedule-container').append($newEmployeeRow);

        // Drawing working hours for each employee
        drawWorkingHours(inputSchedule, 'virtual', $newEmployeeRow, index);

    });

}

/**
 * A function for drawing working hours
 * 
 * @param {object} inputSchedule - Input schedule
 * @param {string} required - Required woking hours (actual/virtual)
 * @param {object} $row - Row HTML-element of current employee
 * @param {number} index - Row number (current employee)
 */
function drawWorkingHours(inputSchedule, required, $row, index) {

    // Getting start and end of working time for employee
    let currentEmployee = inputSchedule[required][index];
    let hoursStart = getHours(currentEmployee[3]);
    let hoursEnd = getHours(currentEmployee[4]);

    // Clearing previous filling
    let workingHoursArray = [...$row.querySelectorAll('.employee-time')];
    workingHoursArray.forEach(item => {
        item.innerText = '';
        let $workingHours = item.firstElementChild;
        if ($workingHours !== null) {
            $workingHours.remove();
        }
    });

    // If time is valid - adding blocks to fill working time
    if (hoursStart !== -1 && hoursEnd !== -1) {

        // Getting working minutes
        let minutesStart = getMinutes(currentEmployee[3]);
        let minutesEnd = getMinutes(currentEmployee[4]);
        
        // The end time, like 19:45 - having addintional minutes
        if (minutesEnd > 0) {
            let $timeBlockEnd = $row.querySelector('.time-' + hoursEnd);
            let $requredBlock = (required === 'virtual') 
                ? createDivWithClass('virtual-hours')
                : createDivWithClass('actual-hours');

            // Getting the percents of minutes (100% === 60 mins)
            let minutesProgress = minutesEnd * (100 / 60);

            // Filling a part of block
            $requredBlock.style.width = `${minutesProgress}%`;
            $timeBlockEnd.append($requredBlock);
        }

        // The start time, like 08:15 - having addintional minutes
        if (minutesStart > 0) {
            let $timeBlockStart = $row.querySelector('.time-' + hoursStart);
            let $requredBlock = (required === 'virtual') 
                ? createDivWithClass('virtual-hours')
                : createDivWithClass('actual-hours');

            // Getting the percents of minute
            let minutesProgress = (60 - minutesStart) * (100 / 60);

            // Filling a part of block
            $requredBlock.style.width = `${minutesProgress}%`;
            $requredBlock.style.cssFloat = 'right';
            $timeBlockStart.append($requredBlock);

            // Marking that the 1st block is already filled
            hoursStart += 1;
        }

        // Now filling full hours worked
        for (let i = hoursStart; i < hoursEnd; i += 1) {
            let $timeBlock = $row.querySelector('.time-' + i);
            let $requredBlock = (required === 'virtual') 
                ? createDivWithClass('virtual-hours')
                : createDivWithClass('actual-hours');
            $timeBlock.append($requredBlock);
        }
    }

}

/**
 * A function for changing working hours (actual/virtual)
 * 
 * @param {object} inputSchedule - Input schedule
 * @param {object} $row - row HTML-element of current employee
 * @param {number} index - Row number (current employee) 
 */
function changeWorkingHours(inputSchedule, $row, index) {
    
    // Defining current working hours - true -> virtual, false -> actual;
    let currentWorkingHours = ($row.getAttribute('is-virtual') === 'true');

    // Reverse current working hours and setting new value of attribute
    let nextWorkingHours = !currentWorkingHours;
    $row.setAttribute('is-virtual', nextWorkingHours);

    // Drawing new working hours
    nextWorkingHours 
        ? drawWorkingHours(inputSchedule, 'virtual', $row, index) 
        : drawWorkingHours(inputSchedule, 'actual', $row, index);

}

/**
 * A function for drawing legend panel
 */
function drawLegend() {

    // Adding a virtual hint
    let $legendVirtual = document.querySelector('.legend-virtual');
    $legendVirtual.prepend(createDivWithClass('virtual-hours'));

    // Adding a actual hint
    let $legendActual = document.querySelector('.legend-actual');
    $legendActual.prepend(createDivWithClass('actual-hours'));

}

/**
 * A function for making a formatted date
 * 
 * @param {number} msec - Date in msec
 * @return {string} Date in format DD-MM-YYYY
 */
function getFormattedDate(msec) {
    let date = new Date(msec);
    return `${addZeroes(date.getDate())}-${addZeroes(date.getMonth() + 1)}-${date.getFullYear()}`;
}

/**
 * A function for making number in format - 01, 02, etc.
 * 
 * @param {number} number - Input number
 * @return {string} Number in format 01, 09, 12, 20
 */
function addZeroes(number) {
    return (number < 10) ? `0${number}` : `${number}`;
}

/**
 * A function for sorting dates in ascending order
 * 
 * @param {object} dateSet - Set of Dates in format DD-MM-YYYY
 * @return {string[]} Sorted array with formatted dates
 */
function sortingDates(dateSet) {

    // Reversing dates to YYYY-MM-DD (for success parsing)
    let dateArray = [];
    for (let date of dateSet) {
        dateArray.push(date.split('-').reverse().join('-'));
    }
    
    // Parsing dates to msec for simplified sorting
    let msecArray = dateArray.map(date => Date.parse(date));
    let sortedMsec = msecArray.sort((a, b) => b - a).reverse();

    // Geting dates from msec in format DD-MM-YYYY
    return sortedMsec.map(msec => getFormattedDate(msec));
}

/**
 * A function for getting Hours in a input date
 * 
 * @param {string} date - Date in ISO format
 * @return {number} Required hours or -1, if date can't be parsed
 */
function getHours(date) {
    let msec = Date.parse(date);
    if (isNaN(msec)) {
        return -1;
    }
    return new Date(msec).getUTCHours();
}

/**
 * A function for getting Minutes in a input date
 * 
 * @param {string} date - Date in ISO format
 * @return {number} Required minutes or -1, if date can't be parsed
 */
function getMinutes(date) {
    let msec = Date.parse(date);
    if (isNaN(msec)) {
        return -1;
    }
    return new Date(msec).getMinutes();
}

/**
 * A function for create a new div with class name
 * 
 * @param {string} name - className string
 * @return {HTMLDivElement} A newly created div
 */
function createDivWithClass(name) {
    let $div = document.createElement('div');
    $div.className = name;
    return $div;
}