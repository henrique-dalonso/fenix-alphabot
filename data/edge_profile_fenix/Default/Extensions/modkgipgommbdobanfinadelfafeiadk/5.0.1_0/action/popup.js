$(document).ready(function() {
    function render(data) {
        return function(v, i) { return (i % 2) ? data[v] : v; };
    }
    chrome.storage.sync.get(["givee.locale", "givee.actual", "givee.filter"], function(storage) {
        chrome.runtime.sendMessage({type: "events", data: {}}, function(data) {
            if (data && data.timestamp) {
                let table = $("#tmpl-events").text().split(/\$\{(.+?)\}/g);
                let rows = [];
                if (data.list && (data.list.length > 0)) {
                    let row = $("#tmpl-event").text().split(/\$\{(.+?)\}/g);
                    for (let i = 0; i < data.list.length; i++) {
                        data.list[i].class = "";
                        if (data.list[i].id.toString().includes(":legacy"))
                            data.list[i].class = "legacy";
                        if (storage["givee.actual"] && (storage["givee.actual"] < data.list[i].timestamp))
                            data.list[i].class += " highlight";
                        data.list[i].linkGetIt = chrome.i18n.getMessage("linkGetIt");
                        rows.push(row.map(render(data.list[i])).join(""));
                    }

                } else {
                    rows.push($("#tmpl-events-empty").html().replace("${errorNoEvents}", chrome.i18n.getMessage("errorNoEvents")));
                }
                $("#events").html(table.map(render({
                    columnEventType: chrome.i18n.getMessage("columnEventType"),
                    columnEventName: chrome.i18n.getMessage("columnEventName"),
                    rows: rows.join("\r\n")
                })).join("\r\n"));
                if (data.notifications && (data.notifications > 0)) {
                    $("#notifications").text("+"+parseInt(data.notifications)).removeClass("hide");
                }
            }
            chrome.storage.sync.set({"givee.actual": parseInt(new Date().getTime() / 1000)});
            chrome.action.setBadgeText({text: ""});
        });
    });
});