let ig_endpoint = null;
let isConnected = false;
let language = null;
const listeningTabIds = [];
let gamesResponse = {};
let browserName = null;

chrome.runtime.onConnect.addListener((connection) => {
    console.log('Tab is connected');

    const singlePageListener = (tabId, state) => {
        if (listeningTabIds.includes(tabId) && state.status && 'complete' === state.status) {
            console.log('Tab is updated');

            chrome.tabs.sendMessage(tabId, {
                action: 'tab.updated'
            });
        }
    };

    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        if (0 === tabs.length) {
            return;
        }

        const currentTab = tabs[0];

        if (!listeningTabIds.includes(currentTab.id)) {
            listeningTabIds.push(currentTab.id);

            connection.onDisconnect.addListener(() => {
                console.log('Tab is disconnected');

                const tabId = connection.sender.tab.id;
                const index = listeningTabIds.indexOf(tabId);

                if (index > -1) {
                    listeningTabIds.splice(index, 1);

                    if (0 === listeningTabIds.length) {
                        isConnected = false;

                        console.log('No tab remaining, removing tabs updates listener');

                        if (chrome.tabs.onUpdated.hasListener(singlePageListener)) {
                            chrome.tabs.onUpdated.removeListener(singlePageListener);
                        }
                    }
                }
            });
        }

        if (!isConnected) {
            console.log('Listening for tabs updates');

            chrome.tabs.onUpdated.addListener(singlePageListener);
            isConnected = true;
        }
    });
});

function parseUrl(url) {
    try {
        return new URL(url);
    } catch (e) {
        return null;
    }
}

const UTM_ALLOWED_KEYS = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']);

function sanitizeUtmQueryParams(raw) {
    try {
        const input = new URLSearchParams((raw ?? '').replace(/^\?/, ''));
        const safe = new URLSearchParams();

        input.forEach((value, key) => {
            if (UTM_ALLOWED_KEYS.has(key)) {
                safe.set(key, value);
            }
        });

        const serialized = safe.toString();
        return serialized ? '?' + serialized : '';
    } catch (e) {
        return '';
    }
}

function reformatLanguage(language) {
    if (!language || language == '' || language == 'und') {
        if ('undefined' !== typeof navigator) {
            language = navigator.language || navigator.userLanguage;
        } else if ('undefined' !== typeof window) {
            language = window.navigator.language || window.navigator.userLanguage;
        } else {
            return 'en';
        }

        if (language.match(language, /^[a-z]{2}_[A-Z]{2}$/)) {
            console.log('Reformating', language);
            language = language.substring(0, 2);
        }

        if (language.length !== 2) {
            language = 'en';
        }

        console.log('New language', language);
    }

    return language;
}

chrome.management.getSelf(function () {
    // ig_endpoint = 'https://local.instant-gaming.com';
    ig_endpoint = 'https://www.instant-gaming.com';

    console.log('IG Endpoint: ' + ig_endpoint);
});

chrome.runtime.onInstalled.addListener(function () {
    fetch(ig_endpoint + '/ext_api/?' + new URLSearchParams({
        install: true
    }))
    .then(() => {
        console.log('Installation done.');
    });
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    console.log('Received message ', message, sender);

    if (!('action' in message)) {
        return;
    }

    if ('browser_detection' === message.action) {
        if (!('browserName' in message)) {
            return;
        }

        if (null !== message.browserName && null === browserName) {
            console.log('Browser name:', message.browserName);

            browserName = message.browserName;
        }
    } else if (
        message.action === 'find_game'
        || message.action === 'find_by_name'
        || message.action === 'find_steam_appid'
    ) {
        message.steamappid ? console.log('Search game', message.steamappid) : 0;
        message.find_steam_appid ? console.log('Search game', message.find_steam_appid) : 0;
        message.steamappid ? console.log('Search game', message.name) : 0;
        message.find_steam_appid ? console.log('Search game', message.find_by_name) : 0;

        const doRequest = () => {
            const request = new URLSearchParams({
                process: 'find_game',
                steamappid: message.steamappid,
                name: message.name,
                region: message.region ?? '',
                platform: message.platform ?? '',
                type: message.type ?? '',
                find_steam_appid: message.find_steam_appid,
                find_by_name: message.find_by_name,
                isolang: language,
                medium: browserName,
                campaign: sender.origin,
                editionId: message.editionId ?? ''
            });
            const cacheKey = request.toString();

            if (cacheKey in gamesResponse) {
                console.log('Sending back response (from cache)', gamesResponse[cacheKey]);

                sendResponse(gamesResponse[cacheKey]);

                return;
            }

            fetch(ig_endpoint + '/ext_api/?' + request, {
                credentials: 'omit'
            })
            .then((response) => response.json())
            .then((response) => {
                console.log('Sending back response', response);

                if (
                    response.success
                    && response.url
                    && (
                        response.price > 0
                        || response.force_display_out_of_stock
                    )
                    && response.discount < 100
                ) {
                    const parsedUrl = parseUrl(response.url);

                    if (!parsedUrl || parsedUrl.protocol !== 'https:') {
                        console.log('Cannot send response: unsafe URL protocol detected');
                        sendResponse(null);

                        return;
                    }

                    response.utmQueryParams = sanitizeUtmQueryParams(response.utmQueryParams);

                    // Avoid bottleneck
                    if (Object.keys(gamesResponse).length > 250) {
                        gamesResponse = {};
                    }

                    gamesResponse[cacheKey] = response;
                    sendResponse(response);
                } else {
                    // Something is wrong, don't pass it to customer.
                    console.log('Cannot send response', response);
                    sendResponse(null);
                }
            });
        };

        if (null === language) {
            chrome.tabs.detectLanguage(sender.tab.id, function (currentLanguage) {
                language = currentLanguage;
                console.log('Current language', language)
                language = reformatLanguage(language);

                doRequest();
            });
        } else {
            doRequest();
        }

        return true;
    }
});

const action = chrome.action ?? chrome.browserAction;

action.onClicked.addListener(function () {
    let url = 'https://www.instant-gaming.com?utm_source=extension';

    if (null !== browserName) {
        url += '&utm_medium=' + browserName;
    }

    chrome.tabs.create({
        url: url
    });
});

// Empty cache
setInterval(() => {
    gamesResponse = {};
}, 60 * 60 * 6 * 1000); // 6 hours
