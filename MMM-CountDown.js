Module.register("MMM-CountDown",{
    defaults: {
        timers: []
    },

    start: function() {
        this.timers = [];
        this.loaded = false;
        this.activeInput = null; // Track active input for keyboard
        this.sendSocketNotification("LOAD_TIMERS");
        this.timerInterval = setInterval(() => {
            this.updateDom();
        }, 1000);
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

        // Display timers
        this.timers.forEach((timer, idx) => {
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

            // Format event date
            const eventDate = end.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

            timerDiv.innerHTML = `
                <div class='timer-header'>${timer.name}</div>
                <div class='timer-counts'>
                    <div class='timer-block'><span class='timer-value'>${expired ? '--' : String(days).padStart(2, '0')}</span><span class='timer-label'>DAYS</span></div>
                    <div class='timer-block'><span class='timer-value'>${expired ? '--' : String(hrs).padStart(2, '0')}</span><span class='timer-label'>HRS</span></div>
                    <div class='timer-block'><span class='timer-value'>${expired ? '--' : String(min).padStart(2, '0')}</span><span class='timer-label'>MIN</span></div>
                    <div class='timer-block'><span class='timer-value'>${expired ? '--' : String(sec).padStart(2, '0')}</span><span class='timer-label'>SEC</span></div>
                </div>
                <div class='timer-date'>${expired ? 'Expired' : eventDate}</div>
            `;
            timerDiv.addEventListener("click", () => {
                if (confirm(`Remove timer \"${timer.name}\"?`)) {
                    this.removeTimer(idx);
                }
            });
            wrapper.appendChild(timerDiv);
        });

        // Add timer button
        const addBtn = document.createElement("button");
        addBtn.innerText = "Add Timer";
        addBtn.className = "add-timer-btn";
        addBtn.addEventListener("click", () => {
            this.showAddTimerModal();
        });
        wrapper.appendChild(addBtn);

        return wrapper;
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

    showAddTimerModal: function() {
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

        modalContent.innerHTML = `
            <form class='add-timer-form'>
                <h3>Add Timer</h3>
                <input type='text' id='countDown' name='name' placeholder='Timer Name' required style="display:block;margin-bottom:1em;width:100%;" />
                <input type='datetime-local' name='end' required style="display:block;margin-bottom:1em;width:100%;" />
                <div style="text-align:right;">
                    <button type='submit'>Add</button>
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
                this.timers.push({ name, end });
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
            // Manually trigger focus event to ensure keyboard shows
            var focusEvent = new Event('focus', { bubbles: true });
            nameInput.dispatchEvent(focusEvent);
        }, 10);
    },

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
        this.timers.splice(idx, 1);
        this.sendSocketNotification("SAVE_TIMERS", this.timers); // Save timers to disk
        this.updateDom();
    },

    getStyles: function() {
        return ["MMM-CountDown.css"];
    }
});
