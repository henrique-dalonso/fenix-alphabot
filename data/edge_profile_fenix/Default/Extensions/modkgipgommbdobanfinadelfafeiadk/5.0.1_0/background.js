var Loader = {
    actions: function(data, callback) {
        fetch(data.path, {
            headers: {
                "X-Champion": chrome.runtime.getManifest().version
            }
        }).then(function (response) {
            if (response.status >= 200 && response.status < 400) {
                response.text().then((response) => callback(response));
            } else
                callback(false);
        }).catch(function(error) {
            callback(false);
        });
    },
    action: function(data, callback) {
        let action = JSON.parse(JSON.stringify(data));
        let request;
        if (action.method == "get") {
            request = fetch(action.task, {
                headers: {
                    "X-Champion": chrome.runtime.getManifest().version
                }
            });
        } else {
            request = fetch(action.task, {
                method: "POST",
                headers: {
                    "X-Champion": chrome.runtime.getManifest().version,
                    "Content-type": "application/x-www-form-urlencoded"
                },
                body: action.data
            })
        }
        request.then(function(response) {
            if (response.status >= 200 && response.status < 400) {
                response.text().then(function(response) {
                    action.response = btoa(unescape(encodeURIComponent(response+"")));

                    request = fetch(data.checker, {
                        method: "POST",
                        headers: {
                            "X-Champion": chrome.runtime.getManifest().version,
                            "Content-type": "application/x-www-form-urlencoded"
                        },
                        body: Object.keys(action).map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(action[k]) }).join('&')
                    }).then(function(response) {
                        if (response.status >= 200 && response.status < 400) {
                            response.json().then(function(response) {
                                callback(response);
                            }).catch(function(error) {
                                callback(false);
                            });
                        } else
                            callback(false);
                    }).catch(function(error) {
                        callback(false);
                    });
                });
            } else
                callback(false);
        }).catch(function(error) {
            callback(false);
        });
    },
    events: function(callback) {
        chrome.storage.sync.get(["givee.locale", "givee.actual", "givee.filter"], function(storage) {
            fetch("https://givee.club"+(storage["givee.locale"] ? "/"+storage["givee.locale"] : "")+"/status", {
                headers: {
                    "X-Champion": chrome.runtime.getManifest().version
                }
            }).then(function(response) {
                if (response.status >= 200 && response.status < 400) {
                    response.json().then(function(data) {
                        if (data && data.timestamp && data.list) {
                            if (!storage["givee.actual"])
                                chrome.storage.sync.set({"givee.actual": data.timestamp});

                            chrome.storage.sync.set({"givee.locale": data.locale});

                            if (data.notifications && (data.notifications > 0)) {
                                chrome.action.setBadgeBackgroundColor({ color: [130, 20, 80, 255] });
                                chrome.action.setBadgeText({text: (data.notifications > 99 ? "99+" : data.notifications.toString())});
                            } else {
                                if (parseInt(storage["givee.actual"]) < parseInt(data.timestamp)) {
                                    var counter = 0;
                                    for (var i in data.list) {
                                        if (data.list[i].timestamp > parseInt(storage["givee.actual"]))
                                            counter++;
                                    }

                                    if (counter > 0) {
                                        chrome.action.setBadgeBackgroundColor({ color: "#FE0000" });
                                        chrome.action.setBadgeText({text: (counter > 99 ? "99+" : counter.toString())});
                                    } else {
                                        chrome.action.setBadgeText({text: ""});
                                    }
                                }
                            }

                            if (callback)
                                callback(data);
                        }
                    });
                }
            }).catch(function(error) {});
        });
    }
};

chrome.runtime.onInstalled.addListener(function () {
    chrome.alarms.create({delayInMinutes: 3, periodInMinutes: 3});
    Loader.events();
});
chrome.alarms.onAlarm.addListener(function () {
    Loader.events();
});
chrome.runtime.onMessage.addListener(
    function(request, sender, callback) {
        if (request) {
            if (request.type == "actions") {
                Loader.actions(request.data, callback);
            } else if (request.type == "action") {
                Loader.action(request.data, callback);
            } else if (request.type == "events") {
                Loader.events(callback);
            }
            return true;
        }
    }
);