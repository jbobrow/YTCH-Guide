/*
    TVCH-Guide
    ----------
    Populate a grid with the upcoming TVCH shows

*/


document.addEventListener("DOMContentLoaded", loadTVGuide());

function loadTVGuide() {
    // Fetch the JSON data
    fetch("https://ytch.xyz/list.json")
        .then(response => response.json())
        .then(data => {
            populateTimeSlots();
            populateTimeline(data);
        })
        .catch(error => console.error("Error loading JSON:", error));
};

const numHalfHourTimeSlots = 4; // 2 Hours of schedule seems like a good default

function populateTimeSlots() {
    const headerRow = document.querySelector(".header-row");
    const currentTime = new Date();

    // clear the contents
    headerRow.innerHTML = '';

    // Round current time to the nearest half-hour
    const currentMinutes = currentTime.getMinutes();
    currentTime.setMinutes(currentMinutes < 30 ? 0 : 30, 0, 0);

    // Create a slot for the current time
    headerRow.innerHTML = "<div id='current-time' class='time-slot-current'>--:--</div>";
    updateTime();

    // Populate the next few time slots (e.g., 2 hours worth, adjust as needed)
    for (let i = 0; i < numHalfHourTimeSlots; i++) {
        const timeSlot = document.createElement("div");
        timeSlot.classList.add("time-slot");

        const timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timeSlot.textContent = timeString;
        headerRow.appendChild(timeSlot);

        // Move to the next 30-minute slot
        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
}

function populateTimeline(data) {
    const currentTime = Math.floor(Date.now() / 1000); // Get the current time in seconds
    const guideElement = document.querySelector(".channel-rows");
    
    // clear the contents
    guideElement.innerHTML = '';


    // for the starting window
    const currentTimeDate = new Date();
    const currentTimeDateMinutes = currentTimeDate.getMinutes();
    currentTimeDate.setMinutes(currentTimeDateMinutes < 30 ? 0 : 30, 0, 0);
    const currentTimeNearest = Math.floor(currentTimeDate / 1000); // Get the current time in seconds to the closest window

    // Iterate through each channel
    for (const [channelNumber, channelData] of Object.entries(data)) {
        // Create the channel row
        const channelRow = document.createElement("div");
        channelRow.classList.add("channel-row");

        // Create the channel name element
        const channelName = document.createElement("div");
        channelName.classList.add("channel-name");
        channelName.innerHTML = `Channel ${channelNumber}` + "<br><span class='channel-title'>" + getChannelName(channelNumber) + "</span>";
        channelRow.appendChild(channelName);


        // Iterate through each video in the channel
        for (const videoKey in channelData) {
            const video = channelData[videoKey];
            var startTime = new Date(1970, 0, 1);   // Initialize
            startTime.setSeconds(video.playAt); // Get the start time in seconds
            // TODO: Figure out the correct way to use the timezone offset
            const offsetHours = new Date().getTimezoneOffset() / 60;
            startTime = subtractTimeFromDate(startTime, offsetHours);
            const startTimeSeconds = startTime.getTime()/1000;
            const endTime = startTimeSeconds + video.duration; // Calculate the end time in seconds
            const endWindowTime = currentTimeNearest + numHalfHourTimeSlots/2 * 60 * 60;

            // Check if the video in the visible window of 2 hrs
            if ( currentTimeNearest < endTime && startTimeSeconds < endWindowTime) {
                const videoSlot = document.createElement("div");
                videoSlot.classList.add("video-slot");

                // Calculate the width based on the duration (e.g., 100px per 30 minutes)
                let visibleDuration = video.duration;
                if( startTimeSeconds < currentTimeNearest ) {  // if this video starts before the starting window
                    visibleDuration = visibleDuration - (currentTimeNearest - startTimeSeconds);
                }
                if( endTime > endWindowTime) {  // if this video ends after the end of the window
                    visibleDuration = endWindowTime - startTimeSeconds;
                } 
                // NOTE: Since the width of the slot is flexible, we use a VERY LARGE
                // initial px width to make sure they all scale with the time
                const width = (visibleDuration * 10000) / 1800; // 1800 seconds = 30 minutes
                //console.log("width: " + width);
                videoSlot.style.width = `${width}px`;
                // TODO: Figure out the correct way to use the timezone offset
                // TODO: Replace this with the title of the video
                // Currently displays the ID, the start time, and the run time... useful for debugging
                getYoutubeVideoTitle(video.id).then(title => {
                    // console.log("Video Title:", title);
                    // Display the video title
                    videoSlot.innerHTML = title + "<br><span class='duration'>" + Math.round(video.duration/60) + "m</span>";
                    // Add accessible label to the div
                    const labelString = title + "\nYoutubeID: " + video.id + "\nPlaying at: " + startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + "\nRuntime: " + Math.round(video.duration/60) + " min";
                    videoSlot.ariaLabel = labelString; 
                    videoSlot.setAttribute('title', labelString);
                });
                channelRow.appendChild(videoSlot);
            }
        }

        guideElement.appendChild(channelRow);
    }
}

function getChannelName(channel) {
    let name = "...";
    switch(channel) {
        case "1": name = "Sci & Tech"; break;
        case "2": name = "Travel"; break;
        case "3": name = "Food"; break;
        case "4": name = "Architecture"; break;
        case "5": name = "Film"; break;
        case "6": name = "Documentaries"; break;
        case "7": name = "Comedy"; break;
        case "8": name = "Music"; break;
        case "9": name = "Autos"; break;
        case "10": name = "News"; break;
        case "11": name = "UFC"; break;
        case "12": name = "Podcasts"; break;
        case "13": name = "Gaming"; break;
        case "14": name = "Literature"; break;
        case "15": name = "Cooking"; break;
        case "16": name = "Short Films"; break;
        case "17": name = "Game Shows"; break;
        case "18": name = "Cartoons"; break;
        case "19": name = "Baseball"; break;
        case "20": name = "Product Reviews"; break;
    }
    return name;
}

function updateTime() {
    // Update the current time in the top left
    const currentTime = new Date();
    const currentTimeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeElement = document.getElementById("current-time");
    timeElement.innerHTML = currentTimeString;
}

function updateSchedule() {
    const currentTime = new Date();
    
    // If the time is :00 or :30, update the timeline as well
    if(currentTime.getSeconds() == 0 && (currentTime.getMinutes() == 0 || currentTime.getMinutes() == 30)) {
        loadTVGuide();
    }
}

function updateTimeAndSchedule() {
    updateTime();
    updateSchedule();
}

function subtractTimeFromDate(objDate, intHours) {
    var numberOfMillis = objDate;
    var addMillis = (intHours * 60) * 60 * 1000;
    var newDateObj = new Date(numberOfMillis - addMillis);
    // console.log("old time: " + objDate);
    // console.log("new time: " + newDateObj);
    return newDateObj;
}

function toggleDrawer() {
    const guideElement = document.querySelector(".tv-guide");
    if( guideElement.style.height != '0%') {
        guideElement.style.height = '0%';
    }
    else {
        guideElement.style.height = '50%';
    }
}

async function getYoutubeVideoTitle(videoID) {
    const apiUrl = `https://us-central1-ytch-guide.cloudfunctions.net/getDataFromAPI?videoId=${videoID}`;
    console.log('request: ' + apiUrl);

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        // Check if title is present
        if (data.title) {
            return data.title;
        } else {
            console.error('No title found for the given videoId.');
            return "--";
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
        return "--";
    }
}

// Regularly check to update time
let timeInterval = setInterval(updateTimeAndSchedule, 1000);   // update every 10 seconds
