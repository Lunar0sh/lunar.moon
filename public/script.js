document.addEventListener('DOMContentLoaded', () => {
    // --- State & Constants ---
    // REMOVED: Default NASA API Key is no longer hardcoded.
    let is24HourFormat = true;
    let lastCalculatedSunTimes = null;
    let lastCalculatedMoonTimes = null;

    const elements = {
        // Core
        loginOverlay: document.getElementById('login-overlay'),
        mainContent: document.getElementById('main-content'),
        body: document.body,

        // Login/Register Forms
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        showLoginTab: document.getElementById('show-login-tab'),
        showRegisterTab: document.getElementById('show-register-tab'),
        loginError: document.getElementById('login-error'),
        registerError: document.getElementById('register-error'),

        // Modals
        modalOverlay: document.getElementById('modal-overlay'),
        apodModal: document.getElementById('apod-modal'),
        accountModal: document.getElementById('account-modal'),
        apodModalClose: document.querySelector('#apod-modal .modal-close-button'),
        accountModalClose: document.querySelector('#account-modal .modal-close-button'),

        // Header Controls
        toggleBlurButton: document.getElementById('toggle-blur-button'),
        timeFormatButton: document.getElementById('toggle-time-format-button'),
        setLocationButton: document.getElementById('set-location-button'),
        accountButton: document.getElementById('account-button'),
        logoutButton: document.getElementById('logout-button'),

        // API Key Form
        apiKeyInput: document.getElementById('api-key-input'),
        saveApiKeyButton: document.getElementById('save-api-key-button'),
        apiKeySuccess: document.getElementById('api-key-success'),

        // Dashboard Elements
        loadingSpinner: document.getElementById('loading-spinner'),
        dashboard: document.getElementById('dashboard'),
        moonVisual: document.getElementById('moon-visual'),
        moonShadow: document.getElementById('moon-shadow'),
        phaseName: document.getElementById('phase-name'),
        illumination: document.getElementById('illumination'),
        moonAge: document.getElementById('moon-age'),
        distanceValue: document.getElementById('distance-value'),
        distanceIndicator: document.getElementById('distance-indicator'),
        positionData: document.getElementById('position-data'),
        locationData: document.getElementById('location-data'),
        timingData: document.getElementById('timing-data'),
        nextPhaseData: document.getElementById('next-phase-data'),
        orbitalData: document.getElementById('orbital-data'),
        upcomingPhasesCard: document.getElementById('upcoming-phases-card'),
        apodCountdown: document.getElementById('apod-countdown'),
        apodTitle: document.getElementById('apod-title'),
        apodDate: document.getElementById('apod-date'),
        apodExplanation: document.getElementById('apod-explanation'),
        apodCopyright: document.getElementById('apod-copyright'),
    };

    // --- Authentication Logic (Communicates with Backend) ---
    const auth = {
        getToken: () => localStorage.getItem('lunar_token'),
        setToken: (token) => localStorage.setItem('lunar_token', token),
        logout: () => localStorage.removeItem('lunar_token'),

        register: async (username, password) => {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            return response.json();
        },

        login: async (username, password) => {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.token) {
                auth.setToken(data.token);
            }
            return data;
        },

        getUserData: async () => {
            const token = auth.getToken();
            if (!token) return null;
            try {
                const response = await fetch('/api/user-data', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    auth.logout();
                    window.location.reload();
                    return null;
                };
                return response.json();
            } catch (error) {
                console.error("Error fetching user data:", error);
                return null;
            }
        },

        saveApiKey: async (apiKey) => {
            const token = auth.getToken();
            const response = await fetch('/api/save-key', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ apiKey })
            });
            return response.json();
        }
    };

    // --- Main Application & Dashboard Logic ---

    const init = () => {
        if (auth.getToken()) {
            elements.loginOverlay.classList.remove('visible');
            elements.mainContent.style.visibility = 'visible';
            runDashboard();
        } else {
            elements.loginOverlay.classList.add('visible');
            elements.mainContent.style.visibility = 'hidden';
        }
        setupEventListeners();
    };

    const runDashboard = async () => {
        elements.dashboard.style.display = 'none';
        elements.loadingSpinner.style.display = 'flex';
        await fetchApodData();
        const userCoords = await getUserLocation();
        updateDashboardWithSunCalc(userCoords);
    };

    const getApiKey = async () => {
        const userData = await auth.getUserData();
        // UPDATED: No longer falls back to a default key.
        return userData?.api_key || '';
    };

    const fetchApodData = async () => {
        const apiKey = await getApiKey();
        if (!apiKey) {
            console.warn("No NASA API Key provided. APOD feature will be disabled.");
            elements.body.style.backgroundColor = '#0c0a1f';
            return;
        }

        const APOD_URL = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;
        try {
            const response = await fetch(APOD_URL);
            if (!response.ok) throw new Error(`NASA API Error: ${response.status} on APOD`);
            const apodData = await response.json();
            updateBackgroundAndModal(apodData);
            if (apodData.media_type === 'image') {
                updateThemeFromImage(apodData.hdurl || apodData.url);
            }
        } catch (error) {
            console.error("Error fetching APOD data:", error);
            elements.body.style.backgroundColor = '#0c0a1f';
        }
    };

    const updateDashboardWithSunCalc = (coords) => {
        try {
            const { latitude, longitude } = coords;
            const now = new Date();
            const moonIllumination = SunCalc.getMoonIllumination(now);
            const moonPosition = SunCalc.getMoonPosition(now, latitude, longitude);

            lastCalculatedSunTimes = SunCalc.getTimes(now, latitude, longitude);
            lastCalculatedMoonTimes = SunCalc.getMoonTimes(now, latitude, longitude);

            updateMainPanel(illuminationData, moonPosition);
            updateDetailsColumns(moonPosition, lastCalculatedSunTimes, lastCalculatedMoonTimes, coords);
            updateUpcomingPhases(now);

            elements.loadingSpinner.style.display = 'none';
            elements.dashboard.style.display = 'block';
        } catch (error) {
            console.error("Failed to update dashboard:", error);
            elements.loadingSpinner.innerHTML = `<p style="color: #ff8a8a; text-align: center;">Could not load lunar data. Error: ${error.message}. Please refresh.</p>`;
        }
    };

    const setupEventListeners = () => {
        elements.showLoginTab.addEventListener('click', () => {
            elements.showLoginTab.classList.add('active');
            elements.showRegisterTab.classList.remove('active');
            elements.loginForm.classList.add('active');
            elements.registerForm.classList.remove('active');
        });
        elements.showRegisterTab.addEventListener('click', () => {
            elements.showRegisterTab.classList.add('active');
            elements.showLoginTab.classList.remove('active');
            elements.registerForm.classList.add('active');
            elements.loginForm.classList.remove('active');
        });

        elements.loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            elements.loginError.textContent = '';
            const username = e.target.querySelector('#login-username').value;
            const password = e.target.querySelector('#login-password').value;
            const result = await auth.login(username, password);
            if (result.token) {
                window.location.reload();
            } else {
                elements.loginError.textContent = result.message || 'Login failed.';
            }
        });
        elements.registerForm.addEventListener('submit', async e => {
            e.preventDefault();
            elements.registerError.textContent = '';
            const username = e.target.querySelector('#register-username').value;
            const password = e.target.querySelector('#register-password').value;
            const confirm = e.target.querySelector('#register-confirm-password').value;
            if (password !== confirm) {
                elements.registerError.textContent = 'Passwords do not match.';
                return;
            }
            const result = await auth.register(username, password);
            if (result.userId) {
                alert('Registration successful! Please log in.');
                elements.showLoginTab.click();
            } else {
                elements.registerError.textContent = result.message || 'Registration failed.';
            }
        });

        elements.logoutButton.addEventListener('click', () => {
            auth.logout();
            window.location.reload();
        });

        const toggleModal = (modalElement) => {
            elements.modalOverlay.classList.toggle('visible');
            modalElement.classList.toggle('visible');
        };

        elements.accountButton.addEventListener('click', async () => {
            const userData = await auth.getUserData();
            if (userData) {
                elements.apiKeyInput.value = userData.api_key || '';
            }
            elements.apiKeySuccess.textContent = '';
            toggleModal(elements.accountModal);
        });

        elements.saveApiKeyButton.addEventListener('click', async () => {
            const key = elements.apiKeyInput.value;
            const result = await auth.saveApiKey(key);
            if (result.message) {
                elements.apiKeySuccess.textContent = result.message;
            }
        });

        elements.showApodInfoButton.addEventListener('click', () => toggleModal(elements.apodModal));
        elements.accountModalClose.addEventListener('click', () => toggleModal(elements.accountModal));
        elements.apodModalClose.addEventListener('click', () => toggleModal(elements.apodModal));
        elements.modalOverlay.addEventListener('click', () => {
            elements.accountModal.classList.remove('visible');
            elements.apodModal.classList.remove('visible');
            elements.modalOverlay.classList.remove('visible');
        });

        elements.toggleBlurButton.addEventListener('click', () => {
            elements.body.classList.toggle('blur-off');
            elements.toggleBlurButton.textContent = elements.body.classList.contains('blur-off') ? 'Add Blur' : 'Remove Blur';
        });
        elements.timeFormatButton.addEventListener('click', () => {
            is24HourFormat = !is24HourFormat;
            rerenderTimes();
            elements.timeFormatButton.textContent = is24HourFormat ? 'Use 12H Time' : 'Use 24H Time';
        });
        elements.setLocationButton.addEventListener('click', handleSetLocation);
    };

    // --- All other UI and helper functions ---

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

        elements.positionData.innerHTML = `
            <div class="data-item"><span class="label">Altitude</span><span class="value">${toDegrees(positionData.altitude)}°</span></div>
            <div class="data-item"><span class="label">Azimuth</span><span class="value">${toDegrees(positionData.azimuth)}°</span></div>
            <div class="data-item"><span class="label">Visibility</span><span class="value" style="color: ${isVisible ? '#86efac' : '#fca5a5'};">${isVisible ? 'Above Horizon' : 'Below Horizon'}</span></div>
        `;
        updateLocationCard(coords);

        elements.timingData.innerHTML = `
            <div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(moonTimes.rise)}</span></div>
            <div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(sunData.solarNoon)}</span></div>
            <div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(moonTimes.set)}</span></div>
        `;

        const angularDiameter = (3474 / positionData.distance * 180 / Math.PI * 3600).toFixed(1);
        elements.orbitalData.innerHTML = `
            <div class="data-item"><span class="label">Parallactic Angle</span><span class="value">${toDegrees(positionData.parallacticAngle)}°</span></div>
            <div class="data-item"><span class="label">Angular Diameter</span><span class="value">${angularDiameter}"</span></div>
            <div class="data-item"><span class="label">Avg. Perigee</span><span class="value">363,300 km</span></div>
            <div class="data-item"><span class="label">Avg. Apogee</span><span class="value">405,500 km</span></div>
        `;
    };

    const updateUpcomingPhases = (startDate) => {
        try {
            const phases = [{ name: 'New Moon', value: 0 }, { name: 'First Quarter', value: 0.25 }, { name: 'Full Moon', value: 0.5 }, { name: 'Third Quarter', value: 0.75 }];
            let upcoming = [];
            let date = new Date(startDate);
            for (let i = 0; i < 70 * 24; i++) {
                date.setHours(date.getHours() + 1);
                const illumination = SunCalc.getMoonIllumination(date);
                for (const phase of phases) {
                    const prevDate = new Date(date);
                    prevDate.setHours(prevDate.getHours() - 1);
                    const prevIllumination = SunCalc.getMoonIllumination(prevDate);
                    const justCrossed = (prevIllumination.phase < phase.value && illumination.phase >= phase.value) || (phase.value === 0 && prevIllumination.phase > 0.95 && illumination.phase < 0.05);
                    if (justCrossed && !upcoming.some(p => p.name === phase.name)) {
                        upcoming.push({ name: phase.name, date: new Date(date) });
                    }
                }
                if (upcoming.length >= 4) break;
            }
            upcoming.sort((a, b) => a.date - b.date);
            const getPhaseIconClass = (phaseName) => phaseName.toLowerCase().replace(' ', '-');
            elements.upcomingPhasesCard.innerHTML = `<h3 style="margin: 0 0 1.5rem 0; font-family: 'Orbitron', sans-serif;">Upcoming Phases</h3><div class="upcoming-phases-grid">${upcoming.slice(0, 4).map(p => `<div class="upcoming-phase-item"><div class="phase-icon ${getPhaseIconClass(p.name)}"></div><p class="label">${p.name}</p><p class="value" style="font-size: 1.1rem; margin-top: 0.25rem;">${p.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p></div>`).join('')}</div>`;
            if (upcoming.length > 0) {
                updateNextPhaseCard(upcoming[0]);
            }
        } catch (error) { console.error("Could not calculate upcoming phases:", error); }
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

    const rerenderTimes = () => { if(lastCalculatedSunTimes && lastCalculatedMoonTimes) { elements.timingData.innerHTML = `<div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(lastCalculatedMoonTimes.rise)}</span></div><div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(lastCalculatedSunTimes.solarNoon)}</span></div><div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(lastCalculatedMoonTimes.set)}</span></div>`; } };
    const getPhaseName = (phase) => { if (phase <= 0.03 || phase >= 0.97) return 'New Moon'; if (phase > 0.03 && phase < 0.22) return 'Waxing Crescent'; if (phase >= 0.22 && phase <= 0.28) return 'First Quarter'; if (phase > 0.28 && phase < 0.47) return 'Waxing Gibbous'; if (phase >= 0.47 && phase <= 0.53) return 'Full Moon'; if (phase > 0.53 && phase < 0.72) return 'Waning Gibbous'; if (phase >= 0.72 && phase <= 0.78) return 'Third Quarter'; return 'Waning Crescent'; };
    const toggleModal = (modalElement) => { elements.modalOverlay.classList.toggle('visible'); modalElement.classList.toggle('visible'); };

    init();
});