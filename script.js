document.addEventListener('DOMContentLoaded', () => {
    // --- State & Constants ---
    const NASA_API_KEY = '2eL4J1Di9kR4fD5bGCK25MgW4HdKkS3dV0Zrfyts';
    const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

    let is24HourFormat = true;
    let lastCalculatedSunTimes = null;
    let lastCalculatedMoonTimes = null;

    const elements = {
        // Core
        modalOverlay: document.getElementById('modal-overlay'),
        apodModal: document.getElementById('apod-modal'),
        modalCloseButton: document.getElementById('modal-close-button'),
        showApodInfoButton: document.getElementById('show-apod-info-button'),
        apodTitle: document.getElementById('apod-title'),
        apodDate: document.getElementById('apod-date'),
        apodExplanation: document.getElementById('apod-explanation'),
        apodCopyright: document.getElementById('apod-copyright'),
        loadingSpinner: document.getElementById('loading-spinner'),
        dashboard: document.getElementById('dashboard'),
        body: document.body,

        // Header Controls
        toggleBlurButton: document.getElementById('toggle-blur-button'),
        timeFormatButton: document.getElementById('toggle-time-format-button'),
        setLocationButton: document.getElementById('set-location-button'),

        // Main Panel Elements
        moonVisual: document.getElementById('moon-visual'),
        moonShadow: document.getElementById('moon-shadow'),
        phaseName: document.getElementById('phase-name'),
        illumination: document.getElementById('illumination'),
        moonAge: document.getElementById('moon-age'),
        distanceValue: document.getElementById('distance-value'),
        distanceIndicator: document.getElementById('distance-indicator'),

        // Data Group Containers
        positionData: document.getElementById('position-data'),
        locationData: document.getElementById('location-data'),
        timingData: document.getElementById('timing-data'),
        nextPhaseData: document.getElementById('next-phase-data'),
        orbitalData: document.getElementById('orbital-data'),

        // Footer
        upcomingPhasesCard: document.getElementById('upcoming-phases-card'),
        apodCountdown: document.getElementById('apod-countdown'),
    };

    const updateDashboardWithSunCalc = (coords) => {
        try {
            const { latitude, longitude } = coords;
            const now = new Date();
            const moonIllumination = SunCalc.getMoonIllumination(now);
            const moonPosition = SunCalc.getMoonPosition(now, latitude, longitude);

            lastCalculatedSunTimes = SunCalc.getTimes(now, latitude, longitude);
            lastCalculatedMoonTimes = SunCalc.getMoonTimes(now, latitude, longitude);

            // Update all dashboard components
            updateMainPanel(moonIllumination, moonPosition);
            updateDetailsColumns(moonPosition, lastCalculatedSunTimes, lastCalculatedMoonTimes, coords);
            updateUpcomingPhases(now);

            elements.loadingSpinner.style.display = 'none';
            elements.dashboard.style.display = 'block'; // Changed to block for the new layout
        } catch (error) {
            console.error("Failed to update dashboard:", error);
        }
    };

    // --- Update Functions for the new Layout ---

    const updateMainPanel = (illuminationData, positionData) => {
        // Phase Name, Illumination, Age
        const phaseValue = illuminationData.phase;
        elements.phaseName.textContent = getPhaseName(phaseValue);
        elements.illumination.textContent = `Illumination: ${(illuminationData.fraction * 100).toFixed(2)}%`;
        elements.moonAge.textContent = `Age: ≈${(phaseValue * 29.53).toFixed(1)} days`;

        // Moon Visual
        const isWaning = phaseValue > 0.5;
        const transformValue = (phaseValue - 0.5) * 2;
        elements.moonShadow.style.transform = `translateX(${transformValue * -50}%) scaleX(${Math.abs(transformValue)})`;
        elements.moonShadow.style.backgroundColor = isWaning ? '#fff' : '#1a1c3b';
        elements.moonVisual.style.backgroundColor = isWaning ? '#1a1c3b' : '#fff';

        // Distance
        const perigee = 363300, apogee = 405500;
        elements.distanceValue.textContent = `${Math.round(positionData.distance).toLocaleString()} km`;
        const percentage = Math.max(0, Math.min(100, ((positionData.distance - perigee) / (apogee - perigee)) * 100));
        elements.distanceIndicator.style.width = `${percentage}%`;
    };

    const updateDetailsColumns = (positionData, sunData, moonTimes, coords) => {
        const toDegrees = (rad) => (rad * 180 / Math.PI).toFixed(2);
        const isVisible = positionData.altitude > 0;

        // Column 1: Position & View
        elements.positionData.innerHTML = `
            <div class="data-item"><span class="label">Altitude</span><span class="value">${toDegrees(positionData.altitude)}°</span></div>
            <div class="data-item"><span class="label">Azimuth</span><span class="value">${toDegrees(positionData.azimuth)}°</span></div>
            <div class="data-item"><span class="label">Visibility</span><span class="value" style="color: ${isVisible ? '#86efac' : '#fca5a5'};">${isVisible ? 'Above Horizon' : 'Below Horizon'}</span></div>
        `;
        updateLocationCard(coords); // Location is part of this column

        // Column 2: Timing & Events
        elements.timingData.innerHTML = `
            <div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(moonTimes.rise)}</span></div>
            <div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(sunData.solarNoon)}</span></div>
            <div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(moonTimes.set)}</span></div>
        `;

        // Column 3: Orbital Details
        const angularDiameter = (3474 / positionData.distance * 180 / Math.PI * 3600).toFixed(1);
        elements.orbitalData.innerHTML = `
            <div class="data-item"><span class="label">Parallactic Angle</span><span class="value">${toDegrees(positionData.parallacticAngle)}°</span></div>
            <div class="data-item"><span class="label">Angular Diameter</span><span class="value">${angularDiameter}"</span></div>
            <div class="data-item"><span class="label">Avg. Perigee</span><span class="value">363,300 km</span></div>
            <div class="data-item"><span class="label">Avg. Apogee</span><span class="value">405,500 km</span></div>
        `;
    };

    const updateLocationCard = async (coords) => {
        const { latitude, longitude } = coords;
        let content = '';
        if (latitude === 52.5200 && longitude === 13.4050) { // Berlin fallback
            content = `<div class="data-item"><span class="label">Location</span><span class="value">Berlin, DE</span></div>`;
        } else {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (!response.ok) throw new Error('Reverse geocoding failed');
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.village || 'Unknown Area';
                const country = data.address.country || '';
                content = `<div class="data-item"><span class="label">Location</span><span class="value">${city}, ${country}</span></div>`;
            } catch (error) {
                content = `<div class="data-item"><span class="label">Location</span><span class="value">${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°</span></div>`;
            }
        }
        elements.locationData.innerHTML = content;
    };

    const updateNextPhaseCard = (nextPhase) => {
        const now = new Date();
        const msUntil = nextPhase.date.getTime() - now.getTime();
        const days = Math.floor(msUntil / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        elements.nextPhaseData.innerHTML = `
             <div class="data-item"><span class="label">Next Major Phase</span><span class="value">${nextPhase.name}</span></div>
             <div class="data-item"><span class="label">Countdown</span><span class="value">≈ ${days}d ${hours}h</span></div>
        `;
    };

    // --- All other functions and listeners remain the same ---
    const getPhaseName = (phase) => { if (phase <= 0.03 || phase >= 0.97) return 'New Moon'; if (phase > 0.03 && phase < 0.22) return 'Waxing Crescent'; if (phase >= 0.22 && phase <= 0.28) return 'First Quarter'; if (phase > 0.28 && phase < 0.47) return 'Waxing Gibbous'; if (phase >= 0.47 && phase <= 0.53) return 'Full Moon'; if (phase > 0.53 && phase < 0.72) return 'Waning Gibbous'; if (phase >= 0.72 && phase <= 0.78) return 'Third Quarter'; return 'Waning Crescent'; };
    const formatTime = (date) => { if (!date || isNaN(date)) return 'N/A'; return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: !is24HourFormat }); };
    const init = async () => { await fetchApodData(); const userCoords = await getUserLocation(); updateDashboardWithSunCalc(userCoords); startApodCountdown(); setTimeout(showHelperNotification, 7000); };
    // Paste other functions here... (full code block provided below for safety)

    // Full, safe copy-paste block for all remaining functions and listeners
    const rerenderTimes = () => { if(lastCalculatedSunTimes && lastCalculatedMoonTimes) { elements.timingData.innerHTML = `<div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(lastCalculatedMoonTimes.rise)}</span></div><div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(lastCalculatedSunTimes.solarNoon)}</span></div><div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(lastCalculatedMoonTimes.set)}</span></div>`; } };
    const updateUpcomingPhases = (startDate) => {try {const phases = [{ name: 'New Moon', value: 0 }, { name: 'First Quarter', value: 0.25 },{ name: 'Full Moon', value: 0.5 }, { name: 'Third Quarter', value: 0.75 }];let upcoming = [];let date = new Date(startDate);for (let i = 0; i < 70 * 24; i++) {date.setHours(date.getHours() + 1);const illumination = SunCalc.getMoonIllumination(date);for (const phase of phases) {const prevDate = new Date(date);prevDate.setHours(prevDate.getHours() - 1);const prevIllumination = SunCalc.getMoonIllumination(prevDate);const justCrossed = (prevIllumination.phase < phase.value && illumination.phase >= phase.value) ||(phase.value === 0 && prevIllumination.phase > 0.95 && illumination.phase < 0.05);if (justCrossed && !upcoming.some(p => p.name === phase.name)) {upcoming.push({ name: phase.name, date: new Date(date) });}}if (upcoming.length >= 4) break;}upcoming.sort((a, b) => a.date - b.date);const getPhaseIconClass = (phaseName) => phaseName.toLowerCase().replace(' ', '-');elements.upcomingPhasesCard.innerHTML = `<h3 style="margin: 0 0 1.5rem 0; font-family: 'Orbitron', sans-serif;">Upcoming Phases</h3><div class="upcoming-phases-grid">${upcoming.slice(0, 4).map(p => `<div class="upcoming-phase-item"><div class="phase-icon ${getPhaseIconClass(p.name)}"></div><p class="label">${p.name}</p><p class="value" style="font-size: 1.1rem; margin-top: 0.25rem;">${p.date.toLocaleDateString([], {month: 'short', day: 'numeric'})}</p></div>`).join('')}</div>`;if (upcoming.length > 0) {updateNextPhaseCard(upcoming[0]);}} catch (error) { console.error("Could not calculate upcoming phases:", error); }};
    const showHelperNotification = () => {const notification = document.createElement('div');notification.id = 'helper-notification';Object.assign(notification.style, {position: 'fixed',top: '-100px',left: '50%',transform: 'translateX(-50%)',padding: '1rem 1.5rem',backgroundColor: 'rgba(26, 28, 59, 0.8)',color: '#e0e7ff',borderRadius: '1rem',border: '1px solid rgba(165, 180, 252, 0.3)',boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',backdropFilter: 'blur(10px)',webkitBackdropFilter: 'blur(10px)',zIndex: '10000',transition: 'top 0.5s ease-in-out',display: 'flex',alignItems: 'center',gap: '1rem',});notification.innerHTML = `<span>If something is not loading (e.g., the background), try reloading the page.</span><button class="close-btn" style="background:none; border:none; color:#e0e7ff; font-size:1.5rem; cursor:pointer; line-height:1;">&times;</button>`;document.body.appendChild(notification);const dismiss = () => {notification.style.top = '-100px';notification.addEventListener('transitionend', () => notification.remove());};setTimeout(() => {notification.style.top = '20px';}, 50);const autoDismissTimeout = setTimeout(dismiss, 15000);notification.querySelector('.close-btn').addEventListener('click', () => {clearTimeout(autoDismissTimeout);dismiss();});};
    const startApodCountdown = () => {const countdownElement = elements.apodCountdown; const updateTimer = () => { const now = new Date(); let nextUpdate = new Date(); nextUpdate.setHours(6, 0, 0, 0); if (now.getHours() >= 6) { nextUpdate.setDate(nextUpdate.getDate() + 1); } const diff = nextUpdate.getTime() - now.getTime(); if (diff <= 0) { countdownElement.textContent = "New picture available now!"; return; } const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'); const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0'); const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0'); countdownElement.textContent = `Next picture in: ${hours}:${minutes}:${seconds}`; }; setInterval(updateTimer, 1000); updateTimer(); };
    getUserLocation = () => {return new Promise((resolve) => {const fallback = { latitude: 52.5200, longitude: 13.4050 };if (!navigator.geolocation) { console.warn("Geolocation not supported, using fallback."); return resolve(fallback); }const timeoutId = setTimeout(() => {console.warn("Geolocation timed out, using fallback.");resolve(fallback);}, 8000);navigator.geolocation.getCurrentPosition((position) => { clearTimeout(timeoutId); resolve(position.coords); },(error) => { console.warn(`Geolocation error (${error.code}): ${error.message}. Using fallback.`); clearTimeout(timeoutId); resolve(fallback); });});};
    fetchApodData = async () => {try {const response = await fetch(APOD_URL);if (!response.ok) throw new Error(`NASA API Error: ${response.status}`);const apodData = await response.json();updateBackgroundAndModal(apodData);if (apodData.media_type === 'image') {updateThemeFromImage(apodData.hdurl || apodData.url);}} catch (error) {console.error("Error fetching APOD data:", error);}};
    updateThemeFromImage = (imageUrl) => {const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;const img = new Image();img.crossOrigin = 'Anonymous';img.src = proxiedUrl;img.onload = () => {try {const colorThief = new ColorThief();const dominantColor = colorThief.getColor(img);const palette = colorThief.getPalette(img, 5);const accentColor = palette[1] || dominantColor;const root = document.documentElement;root.style.setProperty('--card-color', `rgba(${dominantColor.join(',')}, 0.5)`);root.style.setProperty('--border-color', `rgba(${accentColor.join(',')}, 0.3)`);root.style.setProperty('--glow-color', `rgba(${accentColor.join(',')}, 0.1)`);root.style.setProperty('--text-primary', getContrastingTextColor(dominantColor));root.style.setProperty('--text-secondary', `rgba(${accentColor.join(',')}, 1)`);root.style.setProperty('--accent-primary', `rgba(${palette[2] ? palette[2].join(',') : accentColor.join(',')}, 1)`);root.style.setProperty('--accent-secondary', `rgba(${accentColor.join(',')}, 1)`);root.style.setProperty('--distance-bar-color', `linear-gradient(to right, rgba(${accentColor.join(',')}, 0.7), rgba(${dominantColor.join(',')}, 1))`);} catch(e) { console.error("Could not apply theme from image.", e); }};img.onerror = (err) => { console.error("Could not load image for theming: ", err); };};
    getContrastingTextColor = (rgb) => {const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;return luminance > 0.5 ? '#000000' : '#FFFFFF';};
    updateBackgroundAndModal = (data) => {if(data.media_type==="image"){elements.body.style.backgroundImage=`url(${data.hdurl||data.url})`}else{elements.body.style.backgroundColor="#0c0a1f"}elements.apodTitle.textContent=data.title;elements.apodDate.textContent=(new Date(data.date)).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});elements.apodExplanation.textContent=data.explanation;const copyright=data.copyright?data.copyright.trim():"";if(copyright&&copyright.toLowerCase()!=="public domain"){elements.apodCopyright.textContent=`Copyright: ${copyright}`}else{elements.apodCopyright.textContent="Public Domain"}};
    toggleModal = () => {elements.modalOverlay.classList.toggle('visible');elements.apodModal.classList.toggle('visible');};
    handleSetLocation = async ()=>{const e=prompt("Enter a city name to get its lunar data:");if(!e||""===e.trim())return;elements.dashboard.style.display="none",elements.loadingSpinner.style.display="flex";try{const t=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e)}&format=json&limit=1`);if(!t.ok)throw new Error("Geocoding API failed");const o=await t.json();o&&o.length>0?updateDashboardWithSunCalc({latitude:parseFloat(o[0].lat),longitude:parseFloat(o[0].lon)}):(alert("Could not find location. Please be more specific."),elements.loadingSpinner.style.display="none",elements.dashboard.style.display="grid")}catch(e){console.error("Failed to set new location:",e),alert("An error occurred while fetching the new location."),elements.loadingSpinner.style.display="none",elements.dashboard.style.display="grid"}};
    elements.showApodInfoButton.addEventListener('click', toggleModal);
    elements.modalCloseButton.addEventListener('click', toggleModal);
    elements.modalOverlay.addEventListener('click', toggleModal);
    elements.toggleBlurButton.addEventListener('click', () => { elements.body.classList.toggle('blur-off'); elements.toggleBlurButton.textContent = elements.body.classList.contains('blur-off') ? 'Add Blur' : 'Remove Blur'; });
    elements.timeFormatButton.addEventListener('click', () => { is24HourFormat = !is24HourFormat; rerenderTimes(); elements.timeFormatButton.textContent = is24HourFormat ? 'Use 12H Time' : 'Use 24H Time'; });
    elements.setLocationButton.addEventListener('click', handleSetLocation);

    init();
});