Module.register("MMM-CountDownTimers",{
    defaults: {
        timers: []
    },

    start: function() {
        this.timers = this.config.timers.slice();
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
            wrapper.appendChild(timerDiv);
        });

        // Add timer button
        const addBtn = document.createElement("button");
        addBtn.innerText = "Add Timer";
        addBtn.className = "add-timer-btn";
        addBtn.addEventListener("touchstart", () => {
            this.showAddTimerForm(wrapper);
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

    showAddTimerForm: function(wrapper) {
        // Remove existing form if present
        const oldForm = wrapper.querySelector('.add-timer-form');
        if (oldForm) oldForm.remove();

        const form = document.createElement("form");
        form.className = "add-timer-form";
        form.innerHTML = `
            <input type='text' name='name' placeholder='Timer Name' required />
            <input type='datetime-local' name='end' required />
            <button type='submit'>Add</button>
        `;
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = form.name.value;
            const end = form.end.value;
            if (name && end) {
                this.timers.push({ name, end });
                this.updateDom();
            }
            form.remove();
        });
        wrapper.appendChild(form);
    },

    removeTimer: function(idx) {
        this.timers.splice(idx, 1);
        this.updateDom();
    },

    getStyles: function() {
        return ["MMM-CountDownTimers.css"];
    }
});
