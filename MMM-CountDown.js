Module.register("MMM-CountDown",{
    defaults: {
        timers: [],
        minAnimationInterval: 30000,  // Minimum time between animations (30 seconds)
        maxAnimationInterval: 60000   // Maximum time between animations (60 seconds)
    },

    animationTimeouts: {},  // Store timeouts for each timer
    activeAnimations: {},   // Track which timers are currently being animated

    start: function() {
        this.timers = [];
        this.loaded = false;
        this.activeInput = null; // Track active input for keyboard
        this.sendSocketNotification("LOAD_TIMERS");
        // Update timers every second
        this.timerInterval = setInterval(() => {
            const wrapper = document.querySelector(".countdown-wrapper");
            if (!wrapper) {
                this.updateDom();
                return;
            }

            // Update just the time values without rebuilding the entire DOM
            this.timers.forEach(timer => {
                const timerElement = wrapper.querySelector(`[data-timer-id="${timer.end}"]`);
                if (!timerElement) return;

                const now = new Date();
                const end = new Date(timer.end);
                let diff = end - now;
                let expired = diff < 0;

                // Just trigger a full refresh of the timer when it expires
                if (expired) {
                    this.updateDom();
                    return;
                }

                // Only update the time values if not expired
                let days = Math.floor(diff / (1000*60*60*24));
                diff -= days * (1000*60*60*24);
                let hours = Math.floor(diff / (1000*60*60));
                diff -= hours * (1000*60*60);
                let minutes = Math.floor(diff / (1000*60));
                diff -= minutes * (1000*60);
                let seconds = Math.floor(diff / 1000);

                const timeValues = timerElement.querySelectorAll('.timer-value');
                if (timeValues.length === 4) {

                    timeValues[0].textContent = '\u00A0\u00A0' + String(days).padStart(2, '0') + '\u00A0\u00A0';
                    timeValues[1].textContent = '\u00A0\u00A0' + String(hours).padStart(2, '0') + '\u00A0\u00A0';
                    timeValues[2].textContent = '\u00A0\u00A0' + String(minutes).padStart(2, '0') + '\u00A0\u00A0';
                    timeValues[3].textContent = '\u00A0\u00A0' + String(seconds).padStart(2, '0') + '\u00A0\u00A0';
                }
            });
        }, 1000);
        
        // Clear all animation states on start
        this.animationTimeouts = {};
        this.activeAnimations = {};
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "TIMERS_LOADED") {
            this.timers = payload || [];
            this.loaded = true;
            this.updateDom();
        }
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "countdown-wrapper";

        // Add timer button at the top
        const addBtn = document.createElement("button");
        addBtn.innerText = "Add Countdown";
        addBtn.className = "add-timer-btn";
        addBtn.style.padding = "4px 8px";
        addBtn.style.fontSize = "var(--font-size-xsmall, 0.8rem)";
        addBtn.addEventListener("click", () => {
            this.showTimerModal();
        });
        wrapper.appendChild(addBtn);

        // Sort timers by soonest event first
        const sortedTimers = this.timers.slice().sort((a, b) => new Date(a.end) - new Date(b.end));

        // Display timers
        sortedTimers.forEach((timer, idx) => {
            const timerDiv = document.createElement("div");
            timerDiv.className = "countdown-timer styled-timer";

            // Calculate time left
            const now = new Date();
            const end = new Date(timer.end);
            let diff = end - now;
            let expired = diff < 0;
            let days = 0, hours = 0, minutes = 0, seconds = 0;
            if (!expired) {
                days = Math.floor(diff / (1000*60*60*24));
                diff -= days * (1000*60*60*24);
                hours = Math.floor(diff / (1000*60*60));
                diff -= hours * (1000*60*60);
                minutes = Math.floor(diff / (1000*60));
                diff -= minutes * (1000*60);
                seconds = Math.floor(diff / 1000);
            }

            // Add data-timer-id to all timers for updates
            timerDiv.setAttribute('data-timer-id', timer.end);

            // Add flair classes for thresholds
            if (!expired) {
                const totalHours = days * 24 + hours;
                let flairClass = "";
                if (totalHours < 1) {
                    flairClass = "flair-1hour";
                } else if (totalHours < 6) {
                    flairClass = "flair-6hours";
                } else if (totalHours < 12) {
                    flairClass = "flair-12hours";
                } else if (days < 1) {
                    flairClass = "flair-1day";
                }
                
                if (flairClass) {
                    timerDiv.classList.add(flairClass);
                    
                    // Only set up animation if it's not already running
                    if (!this.activeAnimations[timer.end]) {
                        this.activeAnimations[timer.end] = true;
                        
                        const startAnimation = () => {
                            // Check if timer still exists and should be animated
                            if (!this.activeAnimations[timer.end]) {
                                return;
                            }
                            
                            const existingElement = document.querySelector(`[data-timer-id="${timer.end}"]`);
                            // If element exists and is already animating, don't restart
                            if (existingElement && existingElement.classList.contains('animate')) {
                                timerDiv.classList.add('animate');  // Sync the new element's state
                                return;
                            }

                            timerDiv.classList.add('animate');
                            setTimeout(() => {
                                const updatedElement = document.querySelector(`[data-timer-id="${timer.end}"]`);
                                if (updatedElement) {
                                    updatedElement.classList.remove('animate');
                                }
                                // Reset animation state so it can trigger again
                                this.activeAnimations[timer.end] = false;
                            }, 10000); // Animation duration (10 seconds to match CSS)
                            
                            // Schedule next animation
                            const nextInterval = Math.random() * 
                                (this.config.maxAnimationInterval - this.config.minAnimationInterval) + 
                                this.config.minAnimationInterval;
                            this.animationTimeouts[timer.end] = setTimeout(startAnimation, nextInterval);
                        };
                        
                        // Start the animation cycle
                        const initialDelay = Math.random() * this.config.minAnimationInterval;
                        this.animationTimeouts[timer.end] = setTimeout(startAnimation, initialDelay);
                    }
                }
            }

            // Format event date
            const eventDate = end.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

            timerDiv.innerHTML = `
                <div class='timer-header'>${timer.name}</div>
                <div class='timer-counts'>
                    <div class='timer-block'><span class='timer-value'>&nbsp;&nbsp;${expired ? '--' : String(days).padStart(2, '0')}&nbsp;&nbsp;</span><span class='timer-label'>D</span></div>
                    <div class='timer-block'><span class='timer-value'>&nbsp;&nbsp;${expired ? '--' : String(hours).padStart(2, '0')}&nbsp;&nbsp;</span><span class='timer-label'>H</span></div>
                    <div class='timer-block'><span class='timer-value'>&nbsp;&nbsp;${expired ? '--' : String(minutes).padStart(2, '0')}&nbsp;&nbsp;</span><span class='timer-label'>M</span></div>
                    <div class='timer-block'><span class='timer-value'>&nbsp;&nbsp;${expired ? '--' : String(seconds).padStart(2, '0')}&nbsp;&nbsp;</span><span class='timer-label'>S</span></div>
                </div>
                <div class='timer-date'>${expired ? 'Expired' : eventDate}</div>
            `;
            timerDiv.addEventListener("click", () => {
                this.showTimerModal(timer, idx);
            });
            wrapper.appendChild(timerDiv);
        });

        return wrapper;
    },
    showTimerModal: function(timer = null, idx = null) {
        // Remove existing modal if present
        let oldModal = document.querySelector('.add-timer-modal');
        if (oldModal) oldModal.remove();

        // Modal overlay
        const modalOverlay = document.createElement("div");
        modalOverlay.className = "add-timer-modal";
        modalOverlay.style.position = "fixed";
        modalOverlay.style.top = "0";
        modalOverlay.style.left = "0";
        modalOverlay.style.width = "100vw";
        modalOverlay.style.height = "100vh";
        modalOverlay.style.background = "rgba(0,0,0,0.5)";
        modalOverlay.style.display = "flex";
        modalOverlay.style.alignItems = "center";
        modalOverlay.style.justifyContent = "center";
        modalOverlay.style.zIndex = "100";

        // Modal content
        const modalContent = document.createElement("div");
        modalContent.style.background = "#fff";
        modalContent.style.padding = "2em";
        modalContent.style.borderRadius = "8px";
        modalContent.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        modalContent.style.minWidth = "300px";
        modalContent.tabIndex = -1;

        // If editing, prefill values
        let nameValue = timer ? timer.name : "";
        let endValue = "";
        if (timer) {
            // Convert UTC ISO string to local datetime-local value
            const localDate = new Date(timer.end);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            const hours = String(localDate.getHours()).padStart(2, '0');
            const minutes = String(localDate.getMinutes()).padStart(2, '0');
            endValue = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        let formTitle = timer ? "Edit Timer" : "Add Timer";

        modalContent.innerHTML = `
            <form class='timer-form'>
                <h3>${formTitle}</h3>
                <input type='text' id='timerName' name='name' value='${nameValue}' placeholder='Timer Name' required style="display:block;margin-bottom:1em;width:100%;" />
                <input type='datetime-local' name='end' value='${endValue}' required style="display:block;margin-bottom:1em;width:100%;" />
                <div style="text-align:right;">
                    <button type='submit'>${timer ? "Save" : "Add"}</button>
                    ${timer ? "<button type='button' class='delete-btn'>Delete</button>" : ""}
                    <button type='button' class='cancel-btn'>Cancel</button>
                </div>
            </form>
        `;

        // Trap focus inside modal
        modalContent.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                modalOverlay.remove();
                this.sendNotification("FORM_CLOSED");
            }
        });

        // Cancel button
        modalContent.querySelector('.cancel-btn').addEventListener("click", () => {
            modalOverlay.remove();
            this.sendNotification("FORM_CLOSED");
        });

        // Delete button (only for edit)
        if (timer) {
            modalContent.querySelector('.delete-btn').addEventListener("click", () => {
                if (confirm(`Delete timer \"${timer.name}\"?`)) {
                    this.removeTimer(idx);
                    modalOverlay.remove();
                    this.sendNotification("FORM_CLOSED");
                }
            });
        }

        // Outside click closes modal
        modalOverlay.addEventListener("mousedown", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                this.sendNotification("FORM_CLOSED");
            }
        });

        // Form submit
        modalContent.querySelector("form").addEventListener("submit", (e) => {
            e.preventDefault();
            const form = e.target;
            const name = form.name.value;
            const end = form.end.value;
            if (name && end) {
                if (timer) {
                    this.timers[idx] = { name, end };
                } else {
                    this.timers.push({ name, end });
                }
                // Sort timers after add/edit
                this.timers.sort((a, b) => new Date(a.end) - new Date(b.end));
                this.sendSocketNotification("SAVE_TIMERS", this.timers); // Save timers to disk
                this.updateDom();
            }
            modalOverlay.remove();
            this.sendNotification("FORM_CLOSED");
        });

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Focus first input and attach keyboard
        setTimeout(() => {
            const nameInput = modalContent.querySelector("input[name='name']");
            this.attachKeyboardToInput(nameInput);
            nameInput.focus();
            var focusEvent = new Event('focus', { bubbles: true });
            nameInput.dispatchEvent(focusEvent);
        }, 10);
    },

    getRemaining: function(endTime) {
        const now = new Date();
        const end = new Date(endTime);
        let diff = end - now;
        if (diff < 0) return "Expired";
        const days = Math.floor(diff / (1000*60*60*24));
        diff -= days * (1000*60*60*24);
        const hours = Math.floor(diff / (1000*60*60));
        diff -= hours * (1000*60*60);
        const minutes = Math.floor(diff / (1000*60));
        return `${days}d ${hours}h ${minutes}m`;
    },

    // showAddTimerModal is now handled by showTimerModal

    attachKeyboardToInput: function(inputField) {
        let self = this;
        if (inputField) {
            inputField.addEventListener("focus", function(event) {
                console.log("Input field focused.");
                // Notify the keyboard module to show the keyboard for this input
                self.sendNotification("SHOW_KEYBOARD", { inputId: event.target.id });
            });
        } else {
            console.log("Input field not found.");
        }
    },

    removeTimer: function(idx) {
        const timer = this.timers[idx];
        if (timer) {
            // Clean up animations
            if (this.animationTimeouts[timer.end]) {
                clearTimeout(this.animationTimeouts[timer.end]);
                delete this.animationTimeouts[timer.end];
            }
            delete this.activeAnimations[timer.end];
        }
        
        this.timers.splice(idx, 1);
        this.sendSocketNotification("SAVE_TIMERS", this.timers); // Save timers to disk
        this.updateDom();
    },

    getStyles: function() {
        return ["MMM-CountDown.css"];
    }
});
