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
            timerDiv.className = "countdown-timer";
            timerDiv.innerHTML = `<span class='timer-name'>${timer.name}</span>: <span class='timer-remaining'>${this.getRemaining(timer.end)}</span>`;
            timerDiv.addEventListener("click", () => {
                if (confirm(`Remove timer "${timer.name}"?`)) {
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

        // Modal content (refactored to match GoogleCalendarEventAdder style)
        const modalContent = document.createElement("div");
        modalContent.style.background = "#fff";
        modalContent.style.padding = "2em";
        modalContent.style.borderRadius = "8px";
        modalContent.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
        modalContent.style.minWidth = "320px";
        modalContent.tabIndex = -1;

        // Header bar
        const headerBar = document.createElement("div");
        headerBar.className = "headerBar";
        headerBar.style.fontWeight = "bold";
        headerBar.style.fontSize = "1.2em";
        headerBar.style.marginBottom = "1em";
        headerBar.textContent = "Add Timer";
        modalContent.appendChild(headerBar);

        // Content container
        const formContentContainer = document.createElement("div");
        formContentContainer.className = "form-content-container";

        // Timer Name field
        const nameGroup = document.createElement("div");
        nameGroup.className = "form-group";
        const nameLabel = document.createElement("label");
        nameLabel.setAttribute("for", "eventTitle");
        nameLabel.textContent = "Timer Name:";
        nameGroup.appendChild(nameLabel);
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "eventTitle";
        nameInput.name = "name";
        nameInput.placeholder = "Timer Name";
        nameInput.required = true;
        nameInput.style.display = "block";
        nameInput.style.marginBottom = "1em";
        nameInput.style.width = "100%";
        nameGroup.appendChild(nameInput);
        formContentContainer.appendChild(nameGroup);

        // End time field
        const endGroup = document.createElement("div");
        endGroup.className = "form-group";
        const endLabel = document.createElement("label");
        endLabel.setAttribute("for", "endTime");
        endLabel.textContent = "End Time:";
        endGroup.appendChild(endLabel);
        const endInput = document.createElement("input");
        endInput.type = "datetime-local";
        endInput.id = "endTime";
        endInput.name = "end";
        endInput.required = true;
        endInput.style.display = "block";
        endInput.style.marginBottom = "1em";
        endInput.style.width = "100%";
        endGroup.appendChild(endInput);
        formContentContainer.appendChild(endGroup);

        // Button container
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "form-group submit-button-container";
        buttonContainer.style.textAlign = "right";

        const submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.textContent = "Add";
        buttonContainer.appendChild(submitBtn);

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.className = "cancel-btn";
        cancelBtn.textContent = "Cancel";
        buttonContainer.appendChild(cancelBtn);

        formContentContainer.appendChild(buttonContainer);

        // Form element
        const form = document.createElement("form");
        form.className = "add-timer-form";
        form.appendChild(formContentContainer);
        modalContent.appendChild(form);

        // Trap focus inside modal
        modalContent.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                modalOverlay.remove();
            }
        });

        // Cancel button
        cancelBtn.addEventListener("click", () => {
            modalOverlay.remove();
        });

        // Outside click closes modal
        modalOverlay.addEventListener("mousedown", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

        // Form submit
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = nameInput.value;
            const end = endInput.value;
            if (name && end) {
                this.timers.push({ name, end });
                this.sendSocketNotification("SAVE_TIMERS", this.timers); // Save timers to disk
                this.updateDom();
            }
            modalOverlay.remove();
        });

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Focus first input and attach keyboard (matching MMM-GoogleCalendarEventAdder style)
        setTimeout(() => {
            nameInput.focus();
            this.activeInput = nameInput;
            nameInput.addEventListener("focus", (event) => {
                this.activeInput = event.target;
                this.sendNotification("SHOW_KEYBOARD");
            });
            // Manually trigger focus event to ensure keyboard shows
            var focusEvent = new Event('focus', { bubbles: true });
            nameInput.dispatchEvent(focusEvent);
        }, 10);
    },

    // attachKeyboardToInput is not needed; logic is now handled in showAddTimerModal for consistency with MMM-GoogleCalendarEventAdder

    removeTimer: function(idx) {
        this.timers.splice(idx, 1);
        this.sendSocketNotification("SAVE_TIMERS", this.timers); // Save timers to disk
        this.updateDom();
    },

    getStyles: function() {
        return ["MMM-CountDown.css"];
    }
});
