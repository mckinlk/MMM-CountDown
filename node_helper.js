const NodeHelper = require("node_helper");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
    timersFile: path.join(__dirname, "timers.json"),

    socketNotificationReceived: function(notification, payload) {
        if (notification === "LOAD_TIMERS") {
            this.loadTimers();
        }
        if (notification === "SAVE_TIMERS") {
            this.saveTimers(payload);
        }
    },

    loadTimers: function() {
        fs.readFile(this.timersFile, "utf8", (err, data) => {
            let timers = [];
            if (!err && data) {
                try {
                    timers = JSON.parse(data);
                } catch (e) {}
            }
            this.sendSocketNotification("TIMERS_LOADED", timers);
        });
    },

    saveTimers: function(timers) {
        fs.writeFile(this.timersFile, JSON.stringify(timers, null, 2), "utf8", (err) => {
            // Optionally handle error
        });
    }
});
