document.addEventListener('DOMContentLoaded', () => {
    let is24HourFormat = true;
    let lastCalculatedSunTimes = null;
    let lastCalculatedMoonTimes = null;
    let userCoords = { latitude: 41.9028, longitude: 12.4964 };

    const ZODIAC_DATA = {
        aries: { name: 'Aries', dates: 'Mar 21 - Apr 19', emoji: '♈', description: 'Represents courage and passion. It is the first sign of the zodiac and is ruled by Mars. Aries are known for being energetic and determined leaders.' },
        taurus: { name: 'Taurus', dates: 'Apr 20 - May 20', emoji: '♉', description: 'Represents stability and comfort. Ruled by Venus, Taureans are known for their practicality, loyalty, and appreciation for the finer things in life.' },
        gemini: { name: 'Gemini', dates: 'May 21 - Jun 20', emoji: '♊', description: 'Represents communication and curiosity. Ruled by Mercury, Geminis are adaptable, intellectual, and sociable individuals.' },
        cancer: { name: 'Cancer', dates: 'Jun 21 - Jul 22', emoji: '♋', description: 'Represents emotion and nurturing. Ruled by the Moon, Cancers are known for their intuitive and protective nature, deeply connected to home and family.' },
        leo: { name: 'Leo', dates: 'Jul 23 - Aug 22', emoji: '♌', description: 'Represents creativity and leadership. Ruled by the Sun, Leos are confident, generous, and charismatic individuals who enjoy being in the spotlight.' },
        virgo: { name: 'Virgo', dates: 'Aug 23 - Sep 22', emoji: '♍', description: 'Represents precision and service. Ruled by Mercury, Virgos are meticulous, analytical, and practical, with a strong sense of duty.' },
        libra: { name: 'Libra', dates: 'Sep 23 - Oct 22', emoji: '♎', description: 'Represents balance and harmony. Ruled by Venus, Libras are diplomatic, fair-minded, and social, seeking beauty and partnership.' },
        scorpio: { name: 'Scorpio', dates: 'Oct 23 - Nov 21', emoji: '♏', description: 'Represents transformation and intensity. Ruled by Pluto and Mars, Scorpios are passionate, resourceful, and determined individuals.' },
        sagittarius: { name: 'Sagittarius', dates: 'Nov 22 - Dec 21', emoji: '♐', description: 'Represents exploration and wisdom. Ruled by Jupiter, Sagittarians are optimistic, adventurous, and have a love for freedom and knowledge.' },
        capricorn: { name: 'Capricorn', dates: 'Dec 22 - Jan 19', emoji: '♑', description: 'Represents time and responsibility. It is ruled by Saturn. Those born under this sign are said to be practical and ambitious.' },
        aquarius: { name: 'Aquarius', dates: 'Jan 20 - Feb 18', emoji: '♒', description: 'Represents innovation and humanitarianism. It is ruled by Uranus and Saturn. Aquarians are often seen as original and independent.' },
        pisces: { name: 'Pisces', dates: 'Feb 19 - Mar 20', emoji: '♓', description: 'Represents dreams and healing. It is ruled by Neptune and Jupiter. Pisces are known for their empathy and artistic sensibilities.' },
    };

    const elements = {
        zodiacModalOverlay: document.getElementById('zodiac-modal-overlay'),
        zodiacModal: document.getElementById('zodiac-modal'),
        zodiacModalCloseButton: document.getElementById('zodiac-modal-close-button'),
        zodiacModalTitle: document.getElementById('zodiac-modal-title'),
        zodiacModalDates: document.getElementById('zodiac-modal-dates'),
        zodiacModalDescription: document.getElementById('zodiac-modal-description'),
        loadingSpinner: document.getElementById('loading-spinner'),
        dashboard: document.getElementById('dashboard'),
        timeFormatButton: document.getElementById('toggle-time-format-button'),
        setLocationButton: document.getElementById('set-location-button'),
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
        zodiacData: document.getElementById('zodiac-data'),
        upcomingPhasesCard: document.getElementById('upcoming-phases-card'),
        copyrightNotice: document.getElementById('copyright-notice'),
    };

    const updateDashboardWithSunCalc = (coords) => {
        try {
            userCoords = coords;
            const now = new Date();
            const moonIllumination = SunCalc.getMoonIllumination(now);
            const moonPosition = SunCalc.getMoonPosition(now, userCoords.latitude, userCoords.longitude);
            lastCalculatedSunTimes = SunCalc.getTimes(now, userCoords.latitude, userCoords.longitude);
            lastCalculatedMoonTimes = SunCalc.getMoonTimes(now, userCoords.latitude, userCoords.longitude);
            updateMainPanel(moonIllumination, moonPosition);
            updateDetailsColumns(moonPosition, lastCalculatedSunTimes, lastCalculatedMoonTimes);
            updateUpcomingPhases(now);
            updateZodiacCard(now);
            updateLocationCard();
            elements.loadingSpinner.style.display = 'none';
            elements.dashboard.style.display = 'block';
        } catch (error) {
            console.error("Failed to update dashboard:", error);
        }
    };

    const updateMainPanel = (illuminationData, positionData) => {
        const originalPhase = illuminationData.phase;
        const snappedPhase = Math.round(originalPhase * 4) / 4;
        elements.phaseName.textContent = getPhaseName(originalPhase);
        elements.illumination.textContent = `Illumination: ${(illuminationData.fraction * 100).toFixed(2)}%`;
        elements.moonAge.textContent = `Age: ≈${(originalPhase * 29.53).toFixed(1)} days`;
        let transformPercentage;
        if (snappedPhase <= 0.5) {
            const progress = snappedPhase / 0.5;
            transformPercentage = progress * -100;
        } else {
            const progress = (snappedPhase - 0.5) / 0.5;
            transformPercentage = progress * 100;
        }
        elements.moonShadow.style.transform = `translateX(${transformPercentage}%)`;
        const perigee = 363300, apogee = 405500;
        elements.distanceValue.textContent = `${Math.round(positionData.distance).toLocaleString()} km`;
        const percentage = Math.max(0, Math.min(100, ((positionData.distance - perigee) / (apogee - perigee)) * 100));
        elements.distanceIndicator.style.width = `${percentage}%`;
    };

    const updateDetailsColumns = (positionData, sunData, moonTimes) => {
        const toDegrees = (rad) => (rad * 180 / Math.PI).toFixed(2);
        const isVisible = positionData.altitude > 0;
        elements.positionData.innerHTML = `<div class="data-item"><span class="label">Altitude</span><span class="value">${toDegrees(positionData.altitude)}°</span></div><div class="data-item"><span class="label">Azimuth</span><span class="value">${toDegrees(positionData.azimuth)}°</span></div><div class="data-item"><span class="label">Visibility</span><span class="value" style="color: ${isVisible ? '#86efac' : '#fca5a5'};">${isVisible ? 'Above Horizon' : 'Below Horizon'}</span></div>`;
        elements.timingData.innerHTML = `<div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(moonTimes.rise)}</span></div><div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(sunData.solarNoon)}</span></div><div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(moonTimes.set)}</span></div>`;
        const angularDiameter = (3474 / positionData.distance * 180 / Math.PI * 3600).toFixed(1);
        elements.orbitalData.innerHTML = `<div class="data-item"><span class="label">Parallactic Angle</span><span class="value">${toDegrees(positionData.parallacticAngle)}°</span></div><div class="data-item"><span class="label">Angular Diameter</span><span class="value">${angularDiameter}"</span></div><div class="data-item"><span class="label">Avg. Perigee</span><span class="value">363,300 km</span></div><div class="data-item"><span class="label">Avg. Apogee</span><span class="value">405,500 km</span></div>`;
    };

    const getSunZodiacKey = (date) => {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return 'aries';
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return 'taurus';
        if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return 'gemini';
        if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return 'cancer';
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return 'leo';
        if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return 'virgo';
        if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return 'libra';
        if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return 'scorpio';
        if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return 'sagittarius';
        if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return 'capricorn';
        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return 'aquarius';
        if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return 'pisces';
    };

    const updateZodiacCard = (now) => {
        const pastDate = new Date(now);
        pastDate.setMonth(now.getMonth() - 1);
        const futureDate = new Date(now);
        futureDate.setMonth(now.getMonth() + 1);
        const lastSignKey = getSunZodiacKey(pastDate);
        const currentSignKey = getSunZodiacKey(now);
        const nextSignKey = getSunZodiacKey(futureDate);
        const createZodiacHTML = (signKey, label, isCurrent) => {
            const zodiacInfo = ZODIAC_DATA[signKey];
            const currentClass = isCurrent ? 'is-current' : '';
            return `<div class="zodiac-item-container ${currentClass}"><span class="label">${label}</span><div class="zodiac-clickable-area" data-zodiac="${signKey}"><div class="zodiac-icon">${zodiacInfo.emoji}</div><div class="zodiac-name">${zodiacInfo.name}</div></div></div>`;
        };
        elements.zodiacData.innerHTML = createZodiacHTML(lastSignKey, 'Last Sign', false) + createZodiacHTML(currentSignKey, 'Current Sign', true) + createZodiacHTML(nextSignKey, 'Next Sign', false);
        document.querySelectorAll('.zodiac-clickable-area').forEach(el => el.addEventListener('click', (e) => showZodiacInfo(e.currentTarget.dataset.zodiac)));
    };

    const showZodiacInfo = (signKey) => {
        const zodiacInfo = ZODIAC_DATA[signKey];
        elements.zodiacModalTitle.textContent = `${zodiacInfo.name} (Sun Sign)`;
        elements.zodiacModalDates.textContent = `(Sun Sign Dates: ${zodiacInfo.dates})`;
        elements.zodiacModalDescription.textContent = zodiacInfo.description;
        toggleZodiacModal();
    };

    const toggleZodiacModal = () => { elements.zodiacModalOverlay.classList.toggle('visible'); elements.zodiacModal.classList.toggle('visible'); };

    const getPhaseName = (phase) => { if (phase <= 0.03 || phase >= 0.97) return 'New Moon'; if (phase > 0.03 && phase < 0.22) return 'Waxing Crescent'; if (phase >= 0.22 && phase <= 0.28) return 'First Quarter'; if (phase > 0.28 && phase < 0.47) return 'Waxing Gibbous'; if (phase >= 0.47 && phase <= 0.53) return 'Full Moon'; if (phase > 0.53 && phase < 0.72) return 'Waning Gibbous'; if (phase >= 0.72 && phase <= 0.78) return 'Third Quarter'; return 'Waning Crescent'; };
    const formatTime = (date) => { if (!date || isNaN(date)) return 'N/A'; return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', hour12: !is24HourFormat }); };

    const init = () => {
        const currentYear = new Date().getFullYear();
        elements.copyrightNotice.innerHTML = `© ${currentYear} Lunar_sh.`;
        updateDashboardWithSunCalc(userCoords);
        initStarAnimation();
    };

    const rerenderTimes = () => { if(lastCalculatedSunTimes && lastCalculatedMoonTimes) { elements.timingData.innerHTML = `<div class="data-item"><span class="label">Moonrise</span><span class="value">${formatTime(lastCalculatedMoonTimes.rise)}</span></div><div class="data-item"><span class="label">Solar Noon</span><span class="value">${formatTime(lastCalculatedSunTimes.solarNoon)}</span></div><div class="data-item"><span class="label">Moonset</span><span class="value">${formatTime(lastCalculatedMoonTimes.set)}</span></div>`; } };

    const updateUpcomingPhases = (startDate) => {
        try {
            const phases = [{ name: 'New Moon', value: 0 }, { name: 'First Quarter', value: 0.25 },{ name: 'Full Moon', value: 0.5 }, { name: 'Third Quarter', value: 0.75 }];
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
            elements.upcomingPhasesCard.innerHTML = `<h3 style="margin: 0 0 1.5rem 0; font-family: 'Orbitron', sans-serif;">Upcoming Phases</h3><div class="upcoming-phases-grid">${upcoming.slice(0, 4).map(p => `<div class="upcoming-phase-item"><div class="phase-icon ${getPhaseIconClass(p.name)}"></div><p class="label">${p.name}</p><p class="value" style="font-size: 1.1rem; margin-top: 0.25rem;">${p.date.toLocaleDateString([], {month: 'short', day: 'numeric'})}</p></div>`).join('')}</div>`;
            if (upcoming.length > 0) updateNextPhaseCard(upcoming[0]);
        } catch (error) {
            console.error("Could not calculate upcoming phases:", error);
        }
    };

    const updateLocationCard = async () => {
        let content = '';
        if (userCoords.latitude === 41.9028 && userCoords.longitude === 12.4964) {
            content = `<div class="data-item"><span class="label">Location</span><span class="value">Rome, IT</span></div>`;
        } else {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userCoords.latitude}&lon=${userCoords.longitude}`);
                if (!response.ok) throw new Error('Reverse geocoding failed');
                const data = await response.json();
                const city = data.address.city || data.address.town || data.address.village || 'Unknown Area';
                const country = data.address.country || '';
                content = `<div class="data-item"><span class="label">Location</span><span class="value">${city}, ${country}</span></div>`;
            } catch (error) {
                content = `<div class="data-item"><span class="label">Location</span><span class="value">${userCoords.latitude.toFixed(2)}°, ${userCoords.longitude.toFixed(2)}°</span></div>`;
            }
        }
        elements.locationData.innerHTML = content;
    };

    const updateNextPhaseCard = (nextPhase) => {
        const now = new Date();
        const msUntil = nextPhase.date.getTime() - now.getTime();
        const days = Math.floor(msUntil / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        elements.nextPhaseData.innerHTML = `<div class="data-item"><span class="label">Next Major Phase</span><span class="value">${nextPhase.name}</span></div><div class="data-item"><span class="label">Countdown</span><span class="value">≈ ${days}d ${hours}h</span></div>`;
    };

    const handleSetLocation = async () => {
        const city = prompt("Enter a city name to get its lunar data:");
        if (!city || city.trim() === "") return;
        elements.dashboard.style.display = "none";
        elements.loadingSpinner.style.display = "flex";
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
            if (!response.ok) throw new Error("Geocoding API failed");
            const data = await response.json();
            if (data && data.length > 0) {
                updateDashboardWithSunCalc({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
            } else {
                alert("Could not find location. Please be more specific.");
                elements.loadingSpinner.style.display = "none";
                elements.dashboard.style.display = "block";
            }
        } catch (error) {
            console.error("Failed to set new location:", error);
            alert("An error occurred while fetching the new location.");
            elements.loadingSpinner.style.display = "none";
            elements.dashboard.style.display = "block";
        }
    };

    const initStarAnimation = () => {
        const canvas = document.getElementById('star-canvas');
        const ctx = canvas.getContext('2d');
        let particles = [];
        const numParticles = window.innerWidth > 768 ? 150 : 70;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            constructor(x, y, size, speedX, speedY) {
                this.x = x;
                this.y = y;
                this.size = size;
                this.speedX = speedX;
                this.speedY = speedY;
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
                this.x += this.speedX;
                this.y += this.speedY;
            }
            draw() {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const createParticles = () => {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                const size = Math.random() * 1.5 + 0.5;
                const x = Math.random() * (canvas.width - size * 2) + size;
                const y = Math.random() * (canvas.height - size * 2) + size;
                const speedX = (Math.random() * 0.4) - 0.2;
                const speedY = (Math.random() * 0.4) - 0.2;
                particles.push(new Particle(x, y, size, speedX, speedY));
            }
        };

        const connectParticles = () => {
            const maxDistance = 100;
            for (let a = 0; a < particles.length; a++) {
                for (let b = a; b < particles.length; b++) {
                    const dx = particles[a].x - particles[b].x;
                    const dy = particles[a].y - particles[b].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = 1 - (distance / maxDistance);
                        ctx.strokeStyle = `rgba(200, 200, 255, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(particles[a].x, particles[a].y);
                        ctx.lineTo(particles[b].x, particles[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connectParticles();
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', () => {
            resizeCanvas();
            createParticles();
        });

        resizeCanvas();
        createParticles();
        animate();
    };

    elements.zodiacModalCloseButton.addEventListener('click', toggleZodiacModal);
    elements.zodiacModalOverlay.addEventListener('click', toggleZodiacModal);
    elements.timeFormatButton.addEventListener('click', () => {
        is24HourFormat = !is24HourFormat;
        rerenderTimes();
        elements.timeFormatButton.textContent = is24HourFormat ? 'Use 12H Time' : 'Use 24H Time';
    });
    elements.setLocationButton.addEventListener('click', handleSetLocation);

    init();
});