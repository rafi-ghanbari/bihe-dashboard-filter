// ==UserScript==
// @name         BIHE Course Filter
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Hide specific courses from timeline and calendar
// @author       Rafi-Ghanbari
// @match        https://learning.bihe23.com/my/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // List of course names to hide from the timeline and calendar
    const hiddenCourses = [
        'Physical Chemistry II',
    ];

    // Map to store event URLs that should be hidden (from timeline processing)
    const hiddenEventUrls = new Set();

    /**
     * Ensures the timeline filter is set to "All" and sort is set to "Sort by dates".
     */
    function setFiltersToDefault() {
        // Set day filter to "All"
        const filterButton = document.querySelector('[data-region="day-filter"] button[data-toggle="dropdown"]');
        const currentSelection = document.getElementById('timeline-day-filter-current-selection');
        
        if (filterButton && currentSelection) {
            const currentFilterText = currentSelection.textContent.trim();
            
            if (currentFilterText !== 'All') {
                console.log(`Current filter is "${currentFilterText}", changing to "All"`);
                
                if (!filterButton.classList.contains('show') && !filterButton.getAttribute('aria-expanded')) {
                    filterButton.click();
                    console.log('Opened filter dropdown');
                }
                
                setTimeout(() => {
                    const allFilterOption = document.querySelector('[data-region="day-filter"] a[data-filtername="all"]');
                    if (allFilterOption) {
                        allFilterOption.click();
                        console.log('Clicked "All" filter option');
                    } else {
                        console.log('All filter option not found');
                    }
                }, 200);
            } else {
                console.log('Filter already set to "All"');
            }
        } else {
            console.log('Day filter button not found');
        }

        // Set sort to "Sort by dates"
        setTimeout(() => {
            const sortButton = document.querySelector('[data-region="view-selector"] button[data-toggle="dropdown"]');
            const sortSelection = document.getElementById('timeline-view-selector-current-selection');
            
            if (sortButton && sortSelection) {
                const currentSortText = sortSelection.textContent.trim();
                
                if (currentSortText !== 'Sort by dates') {
                    console.log(`Current sort is "${currentSortText}", changing to "Sort by dates"`);
                    
                    if (!sortButton.classList.contains('show') && !sortButton.getAttribute('aria-expanded')) {
                        sortButton.click();
                        console.log('Opened sort dropdown');
                    }
                    
                    setTimeout(() => {
                        const sortByDatesOption = document.querySelector('[data-region="view-selector"] a[data-filtername="sortbydates"]');
                        if (sortByDatesOption) {
                            sortByDatesOption.click();
                            console.log('Clicked "Sort by dates" option - reloading page...');
                            
                            setTimeout(() => {
                                location.reload();
                            }, 500);
                        } else {
                            console.log('Sort by dates option not found');
                        }
                    }, 200);
                } else {
                    console.log('Sort already set to "Sort by dates"');
                }
            } else {
                console.log('Sort button not found');
            }
        }, 400);
    }

    /**
     * Clicks the "Show more activities" button to load all events.
     */
    async function clickShowMoreButton() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 20;
            const checkInterval = 500;

            const clickInterval = setInterval(() => {
                attempts++;

                const moreButton = document.querySelector('[data-region="more-events-button-container"] button[data-action="more-events"]');

                if (moreButton && moreButton.offsetParent !== null && !moreButton.disabled) {
                    moreButton.click();
                    console.log(`Clicked "Show more activities" button (attempt ${attempts})`);
                    
                    setTimeout(() => {
                        const stillExists = document.querySelector('[data-region="more-events-button-container"] button[data-action="more-events"]');
                        if (!stillExists || stillExists.offsetParent === null) {
                            clearInterval(clickInterval);
                            console.log('No more "Show more" button found - all events loaded');
                            resolve();
                        }
                    }, 1000);
                } else if (attempts >= maxAttempts) {
                    clearInterval(clickInterval);
                    console.log('Max attempts reached or button not found');
                    resolve();
                }
            }, checkInterval);
        });
    }

    /**
     * Normalize URL by removing protocol and trailing slashes for comparison
     */
    function normalizeUrl(url) {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    }

    /**
     * Processes the timeline events to hide specific courses.
     */
    function processTimelineEvents() {
        const eventWrapper = document.querySelector('[data-region="event-list-wrapper"]');
        if (!eventWrapper) return;

        const eventItems = eventWrapper.querySelectorAll('[data-region="event-list-item"]');

        eventItems.forEach(item => {
            const courseNameElement = item.querySelector('.event-name-container small');
            if (!courseNameElement) return;

            const courseText = courseNameElement.textContent.trim();

            // Check if the course name matches any in the hiddenCourses list
            const shouldHide = hiddenCourses.some(course => courseText.includes(course));

            if (shouldHide) {
                // Store the URL of this event for calendar filtering
                const link = item.querySelector('.event-name a');
                if (link) {
                    const url = normalizeUrl(link.getAttribute('href'));
                    hiddenEventUrls.add(url);
                    console.log(`Added to hidden URLs: ${url}`);
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

            while (nextElement && !nextElement.classList.contains('list-group')) {
                nextElement = nextElement.nextElementSibling;
            }

            if (nextElement && nextElement.classList.contains('list-group')) {
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
     * Processes the calendar view to hide events matching the hidden URLs.
     */
    function processCalendarEvents() {
        const calendarTables = document.querySelectorAll('table[id^="month-detailed-"]');

        calendarTables.forEach(table => {
            const weekRows = table.querySelectorAll('tr[data-region="month-view-week"]');

            weekRows.forEach(row => {
                const dayCells = row.querySelectorAll('td');

                dayCells.forEach(cell => {
                    const eventItems = cell.querySelectorAll('li[data-region="event-item"]');

                    eventItems.forEach(eventItem => {
                        const link = eventItem.querySelector('a[data-action="view-event"]');
                        
                        if (link) {
                            const url = normalizeUrl(link.getAttribute('href'));
                            
                            // Only hide if this exact URL was hidden in timeline
                            if (hiddenEventUrls.has(url)) {
                                eventItem.style.display = 'none';
                                console.log(`Hidden calendar event: ${link.getAttribute('title')} (${url})`);
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

        setFiltersToDefault();

        setTimeout(() => {
            let clickAttempts = 0;
            const maxClickAttempts = 10;

            const clickInterval = setInterval(() => {
                const clicked = clickShowMoreButton();
                clickAttempts++;

                if (!clicked || clickAttempts >= maxClickAttempts) {
                    clearInterval(clickInterval);
                    console.log('Finished clicking "Show more" button');

                    setTimeout(() => {
                        processTimelineEvents();

                        setTimeout(() => {
                            console.log(`Total hidden event URLs: ${hiddenEventUrls.size}`);
                            processCalendarEvents();
                        }, 500);
                    }, 500);
                }
            }, 1000);
        }, 1000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }

    const observer = new MutationObserver(() => {
        processTimelineEvents();
        processCalendarEvents();
    });

    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }, 2000);

})();