// ==UserScript==
// @name         BIHE Course Filter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hide specific courses from timeline and calendar
// @author       Rafi_Ghanbari
// @match        https://learning.bihe23.com/my/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // List of course names to hide from the timeline and calendar
    const hiddenCourses = [
        'Physical Chemistry II',
    ];

    // Array to store the IDs of hidden courses, dynamically populated
    const hiddenIds = [];

    /**
     * Clicks the "Show more activities" button to load all events.
     * Returns true if the button was found and clicked, false otherwise.
     */
    function clickShowMoreButton() {
        const moreButton = document.querySelector('[data-region="more-events-button-container"] button[data-action="more-events"]');
        if (moreButton && moreButton.offsetParent !== null) {
            moreButton.click();
            console.log('Clicked "Show more activities" button');
            return true;
        }
        return false;
    }

    /**
     * Processes the timeline events to hide specific courses.
     * Also extracts the IDs of hidden courses to use for calendar filtering.
     */
    function processTimelineEvents() {
        const eventWrapper = document.querySelector('[data-region="event-list-wrapper"]');
        if (!eventWrapper) return;

        const eventItems = eventWrapper.querySelectorAll('[data-region="event-list-item"]');

        eventItems.forEach(item => {
            const courseNameElement = item.querySelector('.event-name-container small');
            if (!courseNameElement) return;

            const courseText = courseNameElement.textContent;

            // Check if the course name matches any in the hiddenCourses list
            const shouldHide = hiddenCourses.some(course => courseText.includes(course));

            if (shouldHide) {
                // Extract the course ID from the link to hide it in the calendar view as well
                const link = item.querySelector('.event-name a');
                if (link) {
                    const url = link.getAttribute('href');
                    const idMatch = url.match(/[?&]id=(\d+)/);

                    if (idMatch) {
                        const id = idMatch[1];
                        if (!hiddenIds.includes(id)) {
                            hiddenIds.push(id);
                            console.log(`Hidden ID added: ${id} from course: ${courseText}`);
                        }
                    }
                }

                // Hide the timeline event item
                item.style.display = 'none';
                console.log(`Hidden timeline event: ${courseText}`);
            }
        });

        // Clean up empty date headers after hiding events
        hideEmptyDateHeaders();
    }

    /**
     * Hides date headers that have no visible events under them.
     */
    function hideEmptyDateHeaders() {
        const eventWrapper = document.querySelector('[data-region="event-list-wrapper"]');
        if (!eventWrapper) return;

        const dateHeaders = eventWrapper.querySelectorAll('[data-region="event-list-content-date"]');

        dateHeaders.forEach(dateHeader => {
            let nextElement = dateHeader.nextElementSibling;

            // Find the next list group containing events
            while (nextElement && !nextElement.classList.contains('list-group')) {
                nextElement = nextElement.nextElementSibling;
            }

            if (nextElement && nextElement.classList.contains('list-group')) {
                // Check if there are any visible events in the group
                const visibleEvents = Array.from(nextElement.querySelectorAll('[data-region="event-list-item"]'))
                    .filter(item => item.style.display !== 'none' && item.offsetParent !== null);

                if (visibleEvents.length === 0) {
                    dateHeader.style.display = 'none';
                    console.log(`Hidden empty date header: ${dateHeader.textContent.trim()}`);
                } else {
                    dateHeader.style.display = '';
                }
            }
        });
    }

    /**
     * Processes the calendar view to hide events matching the hidden IDs.
     */
    function processCalendarEvents() {
        const calendarTables = document.querySelectorAll('table[id^="month-detailed-"]');

        calendarTables.forEach(table => {
            const weekRows = table.querySelectorAll('tr[data-region="month-view-week"]');

            weekRows.forEach(row => {
                const dayCells = row.querySelectorAll('td');

                dayCells.forEach(cell => {
                    const eventLinks = cell.querySelectorAll('a[href*="id="]');

                    eventLinks.forEach(link => {
                        const url = link.getAttribute('href');
                        const idMatch = url.match(/[?&]id=(\d+)/);

                        if (idMatch) {
                            const id = idMatch[1];

                            // Hide the event if its ID is in the hiddenIds list
                            if (hiddenIds.includes(id)) {
                                let parentDiv = link.closest('div');
                                if (parentDiv) {
                                    parentDiv.style.display = 'none';
                                    console.log(`Hidden calendar event with ID: ${id}`);
                                }
                            }
                        }
                    });
                });
            });
        });
    }

    /**
     * Main function to initialize the script.
     */
    function main() {
        console.log('BIHE Course Filter started');

        let clickAttempts = 0;
        const maxClickAttempts = 10;

        // Try to click "Show more" button repeatedly until successful or max attempts reached
        const clickInterval = setInterval(() => {
            const clicked = clickShowMoreButton();
            clickAttempts++;

            if (!clicked || clickAttempts >= maxClickAttempts) {
                clearInterval(clickInterval);
                console.log('Finished clicking "Show more" button');

                // Initial processing after clicking is done
                setTimeout(() => {
                    processTimelineEvents();

                    // Delay calendar processing slightly to ensure DOM is ready
                    setTimeout(() => {
                        processCalendarEvents();
                    }, 500);
                }, 500);
            }
        }, 1000);
    }

    // Run main function when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

    // Observe DOM changes to handle dynamic content loading (e.g., calendar navigation)
    const observer = new MutationObserver(() => {
        processTimelineEvents();
        processCalendarEvents();
    });

    // Start observing after a short delay
    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 2000);

})();