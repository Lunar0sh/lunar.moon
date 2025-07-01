document.addEventListener('DOMContentLoaded', () => {
    // --- State, Constants & Data ---
    const NASA_API_KEY = '2eL4J1Di9kR4fD5bGCK25MgW4HdKkS3dV0Zrfyts';
    const N2YO_API_KEY = '9YPELN-D6JB9J-837AGU-5IQC'; // <-- IMPORTANT: REPLACE WITH YOUR KEY
    const N2YO_API_URL = 'https://api.n2yo.com/rest/v1/satellite';
    const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;

    let is24HourFormat = true;
    let lastCalculatedSunTimes = null;
    let lastCalculatedMoonTimes = null;
    let userCoords = { latitude: 51.5074, longitude: -0.1278 }; // Default to London

    const ZODIAC_DATA = {
        aries: { name: 'Aries', dates: 'Mar 21 - Apr 19', svg: '<path d="M12 2v10m0 0a4 4 0 0 0 4-4H8a4 4 0 0 0 4 4z"/>', description: 'Represents courage and passion. It is the first sign of the zodiac and is ruled by Mars. Aries are known for being energetic and determined leaders.' },
        taurus: { name: 'Taurus', dates: 'Apr 20 - May 20', svg: '<path d="M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0-12a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/>', description: 'Represents stability and comfort. Ruled by Venus, Taureans are known for their practicality, loyalty, and appreciation for the finer things in life.' },
        gemini: { name: 'Gemini', dates: 'May 21 - Jun 20', svg: '<path d="M4 4v16M20 4v16M4 12h16"/>', description: 'Represents communication and curiosity. Ruled by Mercury, Geminis are adaptable, intellectual, and sociable individuals.' },
        cancer: { name: 'Cancer', dates: 'Jun 21 - Jul 22', svg: '<path d="M6 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0zm12 0a4 4 0 1 0 8 0 4 4 0 1 0-8 0z"/>', description: 'Represents emotion and nurturing. Ruled by the Moon, Cancers are known for their intuitive and protective nature, deeply connected to home and family.' },
        leo: { name: 'Leo', dates: 'Jul 23 - Aug 22', svg: '<path d="M12 2a10 10 0 0 0-9 10m18 0a9 9 0 1 1-18 0"/>', description: 'Represents creativity and leadership. Ruled by the Sun, Leos are confident, generous, and charismatic individuals who enjoy being in the spotlight.' },
        virgo: { name: 'Virgo', dates: 'Aug 23 - Sep 22', svg: '<path d="M4 4v16m4-16v16m4-16v16m4 4l-4-4 4-4"/>', description: 'Represents precision and service. Ruled by Mercury, Virgos are meticulous, analytical, and practical, with a strong sense of duty.' },
        libra: { name: 'Libra', dates: 'Sep 23 - Oct 22', svg: '<path d="M4 18h16M4 14h16a4 4 0 0 0 0-8H4"/>', description: 'Represents balance and harmony. Ruled by Venus, Libras are diplomatic, fair-minded, and social, seeking beauty and partnership.' },
        scorpio: { name: 'Scorpio', dates: 'Oct 23 - Nov 21', svg: '<path d="M4 4v12m4-12v12m4-12v12m4 4l-4-4-4 4"/>', description: 'Represents transformation and intensity. Ruled by Pluto and Mars, Scorpios are passionate, resourceful, and determined individuals.' },
        sagittarius: { name: 'Sagittarius', dates: 'Nov 22 - Dec 21', svg: '<path d="M4 20L20 4m-7 0h7v7"/>', description: 'Represents exploration and wisdom. Ruled by Jupiter, Sagittarians are optimistic, adventurous, and have a love for freedom and knowledge.' },
        capricorn: { name: 'Capricorn', dates: 'Dec 22 - Jan 19', svg: '<path d="M4 4v10l6 6 6-6V4"/>', description: 'Represents time and responsibility. It is ruled by Saturn. Those born under this sign are said to be practical and ambitious.' },
        aquarius: { name: 'Aquarius', dates: 'Jan 20 - Feb 18', svg: '<path d="M4 8l4 4 4-4m-8 6l4 4 4-4"/>', description: 'Represents innovation and humanitarianism. It is ruled by Uranus and Saturn. Aquarians are often seen as original and independent.' },
        pisces: { name: 'Pisces', dates: 'Feb 19 - Mar 20', svg: '<path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8zm4 0v8"/>', description: 'Represents dreams and healing. It is ruled by Neptune and Jupiter. Pisces are known for their empathy and artistic sensibilities.' },
    };

    const elements = {
        // Modals & Overlays
        modalOverlay: document.getElementById('modal-overlay'),
        apodModal: document.getElementById('apod-modal'),
        zodiacModalOverlay: document.getElementById('zodiac-modal-overlay'),
        zodiacModal: document.getElementById('zodiac-modal'),
        satelliteModalOverlay: document.getElementById('satellite-modal-overlay'),
        satelliteModal: document.getElementById('satellite-modal'),

        // Modal Controls
        modalCloseButton: document.getElementById('modal-close-button'),
        zodiacModalCloseButton: document.getElementById('zodiac-modal-close-button'),
        satelliteModalCloseButton: document.getElementById('satellite-modal-close-button'),

        // Modal Content
        apodTitle: document.getElementById('apod-title'),
        apodDate: document.getElementById('apod-date'),
        apodExplanation: document.getElementById('apod-explanation'),
        apodCopyright: document.getElementById('apod-copyright'),
        zodiacModalTitle: document.getElementById('zodiac-modal-title'),
        zodiacModalDates: document.getElementById('zodiac-modal-dates'),
        zodiacModalDescription: document.getElementById('zodiac-modal-description'),
        satelliteModalTitle: document.getElementById('satellite-modal-title'),
        satelliteModalContent: document.getElementById('satellite-modal-content'),

        // Core UI
        loadingSpinner: document.getElementById('loading-spinner'),
        dashboard: document.getElementById('dashboard'),
        body: document.body,
        showApodInfoButton: document.getElementById('show-apod-info-button'),
        toggleBlurButton: document.getElementById('toggle-blur-button'),
        timeFormatButton: document.getElementById('toggle-time-format-button'),
        setLocationButton: document.getElementById('set-location-button'),

        // Main Panel
        moonVisual: document.getElementById('moon-visual'),
        moonShadow: document.getElementById('moon-shadow'),
        phaseName: document.getElementById('phase-name'),
        illumination: document.getElementById('illumination'),
        moonAge: document.getElementById('moon-age'),
        distanceValue: document.getElementById('distance-value'),
        distanceIndicator: document.getElementById('distance-indicator'),

        // Data Cards
        positionData: document.getElementById('position-data'),
        locationData: document.getElementById('location-data'),
        timingData: document.getElementById('timing-data'),
        nextPhaseData: document.getElementById('next-phase-data'),
        orbitalData: document.getElementById('orbital-data'),
        satelliteCard: document.getElementById('satellite-card'),
        satelliteData: document.getElementById('satellite-data'),
        zodiacData: document.getElementById('zodiac-data'),
        upcomingPhasesCard: document.getElementById('upcoming-phases-card'),
        apodCountdown: document.getElementById('apod-countdown'),
    };

    const updateDashboardWithSunCalc = (coords) => {
        try {
            userCoords = coords; // Store user coordinates for later use
            const now = new Date();
            const moonIllumination = SunCalc.getMoonIllumination(now);
            const moonPosition = SunCalc.getMoonPosition(now, userCoords.latitude, userCoords.longitude);

            lastCalculatedSunTimes = SunCalc.getTimes(now, userCoords.latitude, userCoords.longitude);
            lastCalculatedMoonTimes = SunCalc.getMoonTimes(now, userCoords.latitude, userCoords.longitude);

            updateMainPanel(moonIllumination, moonPosition);
            updateDetailsColumns(moonPosition, lastCalculatedSunTimes, lastCalculatedMoonTimes, coords);
            updateUpcomingPhases(now);
            updateZodiacCard(now);

            elements.loadingSpinner.style.display = 'none';
            elements.dashboard.style.display = 'block';
        } catch (error) {
            console.error("Failed to update dashboard:", error);
        }
    };

    // --- UI Update Functions ---
    const updateMainPanel = (illuminationData, positionData) => {
        const phaseValue = illuminationData.phase;
        elements.phaseName.textContent = getPhaseName(phaseValue);
        elements.illumination.textContent = `Illumination: ${(illuminationData.fraction * 100).toFixed(2)}%`;
        elements.moonAge.textContent = `Age: ≈${(phaseValue * 29.53).toFixed(1)} days`;
        const isWaning = phaseValue > 0.5;
        const transformValue = (phaseValue - 0.5) * 2;
        elements.moonShadow.style.transform = `translateX(${transformValue * -50}%) scaleX(${Math.abs(transformValue)})`;
        elements.moonShadow.style.backgroundColor = isWaning ? '#fff' : '#1a1c3b';
        elements.moonVisual.style.backgroundColor = isWaning ? '#1a1c3b' : '#fff';
        const perigee = 363300, apogee = 405500;
        elements.distanceValue.textContent = `${Math.round(positionData.distance).toLocaleString()} km`;
        const percentage = Math.max(0, Math.min(100, ((positionData.distance - perigee) / (apogee - perigee)) * 100));
        elements.distanceIndicator.style.width = `${percentage}%`;
    };

    const updateDetailsColumns = (positionData, sunData, moonTimes, coords) => {
        const toDegrees = (rad) => (rad * 180 / Math.PI).toFixed(2);
        const isVisible = positionData.altitude > 0;
        elements.positionData.innerHTML = `<div class="data-item"><span class="label">Altitude</span><span class="value">${toDegrees(positionData.altitude)}°</span></div><div class="data-item"><span class="label">Azimuth</span><span class="value">${toDegrees(positionData.azimuth)}°</span></div><div class="data-item"><span class="label">Visibility</span><span class="value" style="color: ${isVisible ? '#86efac' : '#fca5a5'};">${isVisible ? 'Above Horizon' : 'Below Horizon'}</span></div>`;
        updateLocationCard(coords);
        elements.timingData.innerHTML = `<div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(moonTimes.rise)}</span></div><div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(sunData.solarNoon)}</span></div><div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(moonTimes.set)}</span></div>`;
        const angularDiameter = (3474 / positionData.distance * 180 / Math.PI * 3600).toFixed(1);
        elements.orbitalData.innerHTML = `<div class="data-item"><span class="label">Parallactic Angle</span><span class="value">${toDegrees(positionData.parallacticAngle)}°</span></div><div class="data-item"><span class="label">Angular Diameter</span><span class="value">${angularDiameter}"</span></div><div class="data-item"><span class="label">Avg. Perigee</span><span class="value">363,300 km</span></div><div class="data-item"><span class="label">Avg. Apogee</span><span class="value">405,500 km</span></div>`;
    };

    const getZodiacSignKey = (date) => {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        if ((month == 1 && day <= 19) || (month == 12 && day >= 22)) return 'capricorn';
        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'aquarius';
        if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'pisces';
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'aries';
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'taurus';
        if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'gemini';
        if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'cancer';
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'leo';
        if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'virgo';
        if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'libra';
        if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'scorpio';
        if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'sagittarius';
    };

    const updateZodiacCard = (now) => {
        const currentSignKey = getZodiacSignKey(now);
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + 30);
        const nextSignKey = getZodiacSignKey(nextDate);

        const createZodiacHTML = (signKey, label) => {
            const zodiacInfo = ZODIAC_DATA[signKey];
            return `
                <div class="zodiac-item-container">
                    <span class="label">${label}</span>
                    <div class="zodiac-clickable-area" data-zodiac="${signKey}">
                        <div class="zodiac-icon"><svg viewBox="0 0 24 24">${zodiacInfo.svg}</svg></div>
                        <div class="zodiac-name">${zodiacInfo.name}</div>
                    </div>
                </div>`;
        };

        elements.zodiacData.innerHTML = createZodiacHTML(currentSignKey, 'Current Sign') + createZodiacHTML(nextSignKey, 'Next Sign');

        document.querySelectorAll('.zodiac-clickable-area').forEach(el => {
            el.addEventListener('click', (e) => showZodiacInfo(e.currentTarget.dataset.zodiac));
        });
    };

    // --- Modal & API Handlers ---
    const showZodiacInfo = (signKey) => {
        const zodiacInfo = ZODIAC_DATA[signKey];
        elements.zodiacModalTitle.textContent = zodiacInfo.name;
        elements.zodiacModalDates.textContent = `(${zodiacInfo.dates})`;
        elements.zodiacModalDescription.textContent = zodiacInfo.description;
        toggleZodiacModal();
    };

    const fetchSatellites = async () => {
        if (N2YO_API_KEY === 'YOUR_N2YO_API_KEY') {
            elements.satelliteData.innerHTML = '<p>Please add your N2YO API key to script.js</p>';
            return;
        }
        elements.satelliteData.innerHTML = '<div class="loader-small"></div>';
        try {
            const { latitude, longitude } = userCoords;
            const response = await fetch(`${N2YO_API_URL}/above/${latitude}/${longitude}/0/70/0/&apiKey=${N2YO_API_KEY}`);
            if (!response.ok) throw new Error(`N2YO API Error: ${response.status}`);
            const data = await response.json();

            if (data.info.satcount === 0) {
                elements.satelliteData.innerHTML = '<p>No satellites found overhead currently.</p>';
            } else {
                displaySatellites(data.above);
            }
        } catch (error) {
            console.error("Could not fetch satellites:", error);
            elements.satelliteData.innerHTML = '<p>Error fetching satellite data.</p>';
        }
    };

    const displaySatellites = (satellites) => {
        elements.satelliteData.innerHTML = satellites.map(sat => `
            <div class="data-item satellite-list-item" data-satid="${sat.satid}" data-satname="${sat.satname}">
                <span class="label">${sat.satname}</span>
                <span class="value">></span>
            </div>
        `).join('');

        document.querySelectorAll('.satellite-list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const { satid, satname } = e.currentTarget.dataset;
                showSatelliteInfo(satid, satname);
            });
        });
    };

    const showSatelliteInfo = async (satid, satname) => {
        elements.satelliteModalTitle.textContent = satname;
        elements.satelliteModalContent.innerHTML = '<div class="loader-small"></div>';
        toggleSatelliteModal();
        try {
            const { latitude, longitude } = userCoords;
            const response = await fetch(`${N2YO_API_URL}/positions/${satid}/${latitude}/${longitude}/0/1/&apiKey=${N2YO_API_KEY}`);
            if (!response.ok) throw new Error(`N2YO API Error: ${response.status}`);
            const data = await response.json();
            const pos = data.positions[0];

            elements.satelliteModalContent.innerHTML = `
                <div class="data-item"><span class="label">NORAD ID</span><span class="value">${data.info.satid}</span></div>
                <div class="data-item"><span class="label">Altitude</span><span class="value">${pos.sataltitude.toFixed(2)} km</span></div>
                <div class="data-item"><span class="label">Azimuth</span><span class="value">${pos.azimuth.toFixed(2)}°</span></div>
                <div class="data-item"><span class="label">Elevation</span><span class="value">${pos.elevation.toFixed(2)}°</span></div>
                <div class="data-item"><span class="label">Right Ascension</span><span class="value">${pos.ra.toFixed(4)}</span></div>
                <div class="data-item"><span class="label">Declination</span><span class="value">${pos.dec.toFixed(4)}</span></div>
            `;
        } catch (error) {
            console.error("Could not fetch satellite details:", error);
            elements.satelliteModalContent.innerHTML = '<p>Error fetching satellite details.</p>';
        }
    };

    const toggleApodModal = () => { elements.modalOverlay.classList.toggle('visible'); elements.apodModal.classList.toggle('visible'); };
    const toggleZodiacModal = () => { elements.zodiacModalOverlay.classList.toggle('visible'); elements.zodiacModal.classList.toggle('visible'); };
    const toggleSatelliteModal = () => { elements.satelliteModalOverlay.classList.toggle('visible'); elements.satelliteModal.classList.toggle('visible'); };

    // --- Helper & Init Functions ---
    const getPhaseName = (phase) => { if (phase <= 0.03 || phase >= 0.97) return 'New Moon'; if (phase > 0.03 && phase < 0.22) return 'Waxing Crescent'; if (phase >= 0.22 && phase <= 0.28) return 'First Quarter'; if (phase > 0.28 && phase < 0.47) return 'Waxing Gibbous'; if (phase >= 0.47 && phase <= 0.53) return 'Full Moon'; if (phase > 0.53 && phase < 0.72) return 'Waning Gibbous'; if (phase >= 0.72 && phase <= 0.78) return 'Third Quarter'; return 'Waning Crescent'; };
    const formatTime = (date) => { if (!date || isNaN(date)) return 'N/A'; return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: !is24HourFormat }); };
    const init = async () => { await fetchApodData(); const userCoords = await getUserLocation(); updateDashboardWithSunCalc(userCoords); startApodCountdown(); };
    const rerenderTimes = () => { if(lastCalculatedSunTimes && lastCalculatedMoonTimes) { elements.timingData.innerHTML = `<div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(lastCalculatedMoonTimes.rise)}</span></div><div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(lastCalculatedSunTimes.solarNoon)}</span></div><div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(lastCalculatedMoonTimes.set)}</span></div>`; } };
    const updateUpcomingPhases = (startDate) => {try {const phases = [{ name: 'New Moon', value: 0 }, { name: 'First Quarter', value: 0.25 },{ name: 'Full Moon', value: 0.5 }, { name: 'Third Quarter', value: 0.75 }];let upcoming = [];let date = new Date(startDate);for (let i = 0; i < 70 * 24; i++) {date.setHours(date.getHours() + 1);const illumination = SunCalc.getMoonIllumination(date);for (const phase of phases) {const prevDate = new Date(date);prevDate.setHours(prevDate.getHours() - 1);const prevIllumination = SunCalc.getMoonIllumination(prevDate);const justCrossed = (prevIllumination.phase < phase.value && illumination.phase >= phase.value) ||(phase.value === 0 && prevIllumination.phase > 0.95 && illumination.phase < 0.05);if (justCrossed && !upcoming.some(p => p.name === phase.name)) {upcoming.push({ name: phase.name, date: new Date(date) });}}if (upcoming.length >= 4) break;}upcoming.sort((a, b) => a.date - b.date);const getPhaseIconClass = (phaseName) => phaseName.toLowerCase().replace(' ', '-');elements.upcomingPhasesCard.innerHTML = `<h3 style="margin: 0 0 1.5rem 0; font-family: 'Orbitron', sans-serif;">Upcoming Phases</h3><div class="upcoming-phases-grid">${upcoming.slice(0, 4).map(p => `<div class="upcoming-phase-item"><div class="phase-icon ${getPhaseIconClass(p.name)}"></div><p class="label">${p.name}</p><p class="value" style="font-size: 1.1rem; margin-top: 0.25rem;">${p.date.toLocaleDateString([], {month: 'short', day: 'numeric'})}</p></div>`).join('')}</div>`;if (upcoming.length > 0) {updateNextPhaseCard(upcoming[0]);}} catch (error) { console.error("Could not calculate upcoming phases:", error); }};
    const startApodCountdown = () => {const countdownElement = elements.apodCountdown; const updateTimer = () => { const now = new Date(); let nextUpdate = new Date(); nextUpdate.setUTCHours(5, 0, 0, 0); if (now.getTime() > nextUpdate.getTime()) { nextUpdate.setDate(nextUpdate.getDate() + 1); } const diff = nextUpdate.getTime() - now.getTime(); if (diff <= 0) { countdownElement.textContent = "New picture available now!"; return; } const hours = Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, '0'); const minutes = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0'); const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0'); countdownElement.textContent = `Next picture in: ${hours}:${minutes}:${seconds}`; }; setInterval(updateTimer, 1000); updateTimer(); };
    const getUserLocation = () => {return new Promise((resolve) => {const fallback = { latitude: 51.5074, longitude: -0.1278 };if (!navigator.geolocation) { console.warn("Geolocation not supported, using fallback."); return resolve(fallback); }const timeoutId = setTimeout(() => {console.warn("Geolocation timed out, using fallback.");resolve(fallback);}, 8000);navigator.geolocation.getCurrentPosition((position) => { clearTimeout(timeoutId); resolve(position.coords); },(error) => { console.warn(`Geolocation error (${error.code}): ${error.message}. Using fallback.`); clearTimeout(timeoutId); resolve(fallback); });});};
    const fetchApodData = async () => {try {const response = await fetch(APOD_URL);if (!response.ok) throw new Error(`NASA API Error: ${response.status}`);const apodData = await response.json();updateBackgroundAndModal(apodData);if (apodData.media_type === 'image') {updateThemeFromImage(apodData.hdurl || apodData.url);}} catch (error) {console.error("Error fetching APOD data:", error);}};
    const updateThemeFromImage = (imageUrl) => {const proxiedUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;const img = new Image();img.crossOrigin = 'Anonymous';img.src = proxiedUrl;img.onload = () => {try {const colorThief = new ColorThief();const dominantColor = colorThief.getColor(img);const palette = colorThief.getPalette(img, 5);const accentColor = palette[1] || dominantColor;const root = document.documentElement;root.style.setProperty('--card-color', `rgba(${dominantColor.join(',')}, 0.5)`);root.style.setProperty('--border-color', `rgba(${accentColor.join(',')}, 0.3)`);root.style.setProperty('--glow-color', `rgba(${accentColor.join(',')}, 0.1)`);root.style.setProperty('--text-primary', getContrastingTextColor(dominantColor));root.style.setProperty('--text-secondary', `rgba(${accentColor.join(',')}, 1)`);root.style.setProperty('--accent-primary', `rgba(${palette[2] ? palette[2].join(',') : accentColor.join(',')}, 1)`);root.style.setProperty('--accent-secondary', `rgba(${accentColor.join(',')}, 1)`);root.style.setProperty('--distance-bar-color', `linear-gradient(to right, rgba(${accentColor.join(',')}, 0.7), rgba(${dominantColor.join(',')}, 1))`);} catch(e) { console.error("Could not apply theme from image.", e); }};img.onerror = (err) => { console.error("Could not load image for theming: ", err); };};
    const getContrastingTextColor = (rgb) => {const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;return luminance > 0.5 ? '#000000' : '#FFFFFF';};
    const updateBackgroundAndModal = (data) => {if(data.media_type==="image"){elements.body.style.backgroundImage=`url(${data.hdurl||data.url})`}else{elements.body.style.backgroundColor="#0c0a1f"}elements.apodTitle.textContent=data.title;elements.apodDate.textContent=(new Date(data.date)).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});elements.apodExplanation.textContent=data.explanation;const copyright=data.copyright?data.copyright.trim():"";if(copyright&&copyright.toLowerCase()!=="public domain"){elements.apodCopyright.textContent=`Copyright: ${copyright}`}else{elements.apodCopyright.textContent="Public Domain"}};
    const updateLocationCard = async (coords) => {const { latitude, longitude } = coords;let content = '';if (latitude === 52.5200 && longitude === 13.4050) {content = `<div class="data-item"><span class="label">Location</span><span class="value">Berlin, DE</span></div>`;} else {try {const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);if (!response.ok) throw new Error('Reverse geocoding failed');const data = await response.json();const city = data.address.city || data.address.town || data.address.village || 'Unknown Area';const country = data.address.country || '';content = `<div class="data-item"><span class="label">Location</span><span class="value">${city}, ${country}</span></div>`;} catch (error) {content = `<div class="data-item"><span class="label">Location</span><span class="value">${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°</span></div>`;}}elements.locationData.innerHTML = content;};
    const updateNextPhaseCard = (nextPhase) => {const now = new Date();const msUntil = nextPhase.date.getTime() - now.getTime();const days = Math.floor(msUntil / (1000 * 60 * 60 * 24));const hours = Math.floor((msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));elements.nextPhaseData.innerHTML = `<div class="data-item"><span class="label">Next Major Phase</span><span class="value">${nextPhase.name}</span></div><div class="data-item"><span class="label">Countdown</span><span class="value">≈ ${days}d ${hours}h</span></div>`;};
    const handleSetLocation = async ()=>{const e=prompt("Enter a city name to get its lunar data:");if(!e||""===e.trim())return;elements.dashboard.style.display="none",elements.loadingSpinner.style.display="flex";try{const t=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(e)}&format=json&limit=1`);if(!t.ok)throw new Error("Geocoding API failed");const o=await t.json();o&&o.length>0?updateDashboardWithSunCalc({latitude:parseFloat(o[0].lat),longitude:parseFloat(o[0].lon)}):(alert("Could not find location. Please be more specific."),elements.loadingSpinner.style.display="none",elements.dashboard.style.display="block")}catch(e){console.error("Failed to set new location:",e),alert("An error occurred while fetching the new location."),elements.loadingSpinner.style.display="none",elements.dashboard.style.display="block"}};

    // --- Event Listeners ---
    elements.showApodInfoButton.addEventListener('click', toggleApodModal);
    elements.modalCloseButton.addEventListener('click', toggleApodModal);
    elements.modalOverlay.addEventListener('click', toggleApodModal);

    elements.zodiacModalCloseButton.addEventListener('click', toggleZodiacModal);
    elements.zodiacModalOverlay.addEventListener('click', toggleZodiacModal);

    elements.satelliteCard.addEventListener('click', fetchSatellites);
    elements.satelliteModalCloseButton.addEventListener('click', toggleSatelliteModal);
    elements.satelliteModalOverlay.addEventListener('click', toggleSatelliteModal);

    elements.toggleBlurButton.addEventListener('click', () => { elements.body.classList.toggle('blur-off'); elements.toggleBlurButton.textContent = elements.body.classList.contains('blur-off') ? 'Add Blur' : 'Remove Blur'; });
    elements.timeFormatButton.addEventListener('click', () => { is24HourFormat = !is24HourFormat; rerenderTimes(); elements.timeFormatButton.textContent = is24HourFormat ? 'Use 12H Time' : 'Use 24H Time'; });
    elements.setLocationButton.addEventListener('click', handleSetLocation);

    init();
});