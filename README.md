# BIHE Course Filter

A Tampermonkey userscript to filter specific courses from the timeline and calendar on the BIHE learning platform (learning.bihe23.com).

## Features

- **Timeline Filtering**: Hides specified courses from the "Timeline" view.
- **Calendar Filtering**: Hides events for specified courses from the "Calendar" view.
- **Auto-Expansion**: Automatically clicks the "Show more activities" button to ensure all events are loaded and filtered.
- **Dynamic Updates**: Monitors the page for changes (e.g., when navigating months in the calendar) and re-applies filters.

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Create a new script in Tampermonkey.
3. Copy and paste the content of `BIHE Course Filter-1.0.user.js` into the editor.
4. Save the script.

## Configuration

To hide specific courses, edit the `hiddenCourses` array in the script:

```javascript
const hiddenCourses = [
    'Physical Chemistry II',
    // Add more course names here
];
```

## Usage

Navigate to `https://learning.bihe23.com/my/`. The script will automatically run and hide the configured courses from your dashboard views.
