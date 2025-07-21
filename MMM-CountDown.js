Module.register("MMM-CountDown",{
    defaults: {
        timers: []
    },

    start: function() {
        // Load timers from localStorage if available
        const stored = localStorage.getItem("MMM-CountDown-timers");
        if (stored) {
            try {
                this.timers = JSON.parse(stored);
            } catch (e) {
                this.timers = this.config.timers.slice();
            }
        } else {
            this.timers = this.config.timers.slice();
        }
        this.loaded = true;
        this.updateDom();
        this.timerInterval = setInterval(() => {
            this.updateDom();
        }, 1000);
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = "countdown-wrapper";

        // Display timers
        this.timers.forEach((timer, idx) => {
            const timerDiv = document.createElement("div");
            timerDiv.className = "countdown-timer";
            timerDiv.innerHTML = `<span class='timer-name'>${timer.name}</span>: <span class='timer-remaining'>${this.getRemaining(timer.end)}</span>`;
            timerDiv.addEventListener("touchstart", () => {
                this.removeTimer(idx);
            });
            timerDiv.addEventListener("click", () => {
                this.removeTimer(idx);
            });
            wrapper.appendChild(timerDiv);
        });

        // Add timer button
        const addBtn = document.createElement("button");
        addBtn.innerText = "Add Timer";
        addBtn.className = "add-timer-btn";
        addBtn.addEventListener("touchstart", () => {
            this.showAddTimerModal();
        });
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
        modalOverlay.style.zIndex = "9999";

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
                <input type='text' name='name' placeholder='Timer Name' required style="display:block;margin-bottom:1em;width:100%;" />
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
            }
        });

        // Cancel button
        modalContent.querySelector('.cancel-btn').addEventListener("click", () => {
            modalOverlay.remove();
        });

        // Outside click closes modal
        modalOverlay.addEventListener("mousedown", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
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
                localStorage.setItem("MMM-CountDown-timers", JSON.stringify(this.timers)); // Save timers
                this.updateDom();
            }
            modalOverlay.remove();
        });

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Focus first input
        setTimeout(() => {
            modalContent.querySelector("input[name='name']").focus();
        }, 10);
    },

    removeTimer: function(idx) {
        this.timers.splice(idx, 1);
        localStorage.setItem("MMM-CountDown-timers", JSON.stringify(this.timers)); // Save timers
        this.updateDom();
    },

    getStyles: function() {
        return ["MMM-CountDown.css"];
    }
});
