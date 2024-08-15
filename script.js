document.addEventListener("DOMContentLoaded", function () {
    // Fetch the JSON data
    fetch("https://ytch.xyz/list.json")
        .then(response => response.json())
        .then(data => {
            populateTimeSlots();
            populateTimeline(data);
        })
        .catch(error => console.error("Error loading JSON:", error));
});

const numHalfHourTimeSlots = 4; // 2 Hours of schedule seems like a good default

function populateTimeSlots() {
    const headerRow = document.querySelector(".header-row");
    const currentTime = new Date();

    // Update the time in the top left
    updateTime();

    // Round current time to the nearest half-hour
    const currentMinutes = currentTime.getMinutes();
    currentTime.setMinutes(currentMinutes < 30 ? 0 : 30, 0, 0);

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
    const guideElement = document.querySelector(".tv-guide");

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
        channelName.innerHTML = `YTCH ${channelNumber}` + "<br>" + getChannelName(channelNumber);;
        channelRow.appendChild(channelName);


        // Iterate through each video in the channel
        for (const videoKey in channelData) {
            const video = channelData[videoKey];
            let startTime = video.playAt; // Get the start time in seconds
            let startTimeDate = new Date(1970, 0, 1); 
            startTime = startTime - startTimeDate.getTimezoneOffset()*60; // Correct for the offset         
            const endTime = startTime + video.duration; // Calculate the end time in seconds
            const endWindowTime = currentTimeNearest + numHalfHourTimeSlots/2 * 60 * 60;

            // Check if the video in the visible window of 2 hrs
            if ( currentTime < endTime && startTime < endWindowTime) {
                const videoSlot = document.createElement("div");
                videoSlot.classList.add("video-slot");

                // Calculate the width based on the duration (e.g., 100px per 30 minutes)
                let visibleDuration = video.duration;
                if( startTime < currentTimeNearest ) {  // if this video starts before the starting window
                    visibleDuration -= currentTimeNearest - startTime;
                }
                if( endTime > endWindowTime) {  // if this video ends after the end of the window
                    visibleDuration = endWindowTime - startTime;
                } 
                const width = (visibleDuration / (1800) * 100); // 1800 seconds = 30 minutes
                // console.log("width: " + width);
                videoSlot.style.width = `${width}px`;

                startTimeDate.setSeconds(startTime-startTimeDate.getTimezoneOffset()*60);
                // TODO: Replace this with the title of the video
                // Currently displays the ID, the start time, and the run time... useful for debugging
                videoSlot.innerHTML = video.id + "<br>" + startTimeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " -- Runtime: " + Math.round(video.duration/60) + " min"; // Display the video ID or any other relevant info
                channelRow.appendChild(videoSlot);
            }
        }

        guideElement.appendChild(channelRow);
    }
}

function getChannelName(channel) {
    let name = "...";
    switch(channel) {
        case "1": name = "SCI/TECH"; break;
        case "2": name = "TripTease"; break;
        case "3": name = "TasteBuds"; break;
        case "4": name = "BlueprintTV"; break;
        case "5": name = "CineMin"; break;
        case "6": name = "DocUniverse"; break;
        case "7": name = "GiggleBox"; break;
        case "8": name = "Rhythm&Views"; break;
        case "9": name = "RPM"; break;
        case "10": name = "PolitixNow"; break;
        case "11": name = "KO-TV"; break;
        case "12": name = "PodPulse"; break;
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

setInterval(updateTime, 1000);