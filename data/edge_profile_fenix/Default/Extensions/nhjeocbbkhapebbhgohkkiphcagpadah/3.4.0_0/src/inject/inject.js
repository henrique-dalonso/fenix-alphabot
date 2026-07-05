let isConnected = false;
let lastGameName = null;
let gameNameInterval = null;
let gameNameIntervalCount = 0;
let singlePageApp = {
    callback: null,
    selector: null,
    url: null
};

const PRODUCT_TYPE = Object.freeze({
    BATTLE_NET: 'battle.net',
    EPIC_GAMES: 'epic games',
    EA_APP: 'ea app',
    ORIGIN: 'origin',
    STEAM: 'steam',
    UBISOFT_CONNECT: 'ubisoft connect',
    MICROSOFT_STORE: 'microsoft store',
    NC_SOFT: 'ncsoft',
    BETHESDA: 'bethesda',
    GOG: 'gog',
    ROCKSTAR: 'rockstar',
    NINTENDO_ESHOP: 'nintendo eshop',
    PLAYSTATION_STORE: 'playstation store',
    INSTANT_GAMING: 'instant gaming',
    OTHER: 'other'
});

const PRODUCT_PLATFORM = Object.freeze({
    PC: 'pc',
    MAC: 'mac',
    LINUX: 'linux',
    SWITCH: 'switch',
    WII_U: 'wii u',
    NINTENDO_3DS: 'nintendo 3ds',
    PLAYSTATION_4: 'playstation 4',
    PLAYSTATION_5: 'playstation 5',
    PLAYSTATION: 'playstation',
    XBOX_360: 'xbox 360',
    XBOX_ONE: 'xbox one',
    XBOX_SERIES_X: 'xbox x',
    XBOX_SERIES_S: 'xbox s',
    XBOX: 'xbox',
    GEFORCE_NOW: 'geforce now',
});

let browserName = 'chrome';

if (
    (!!window.opr && !!opr.addons)
    || !!window.opera
    || navigator.userAgent.indexOf(' OPR/') >= 0
) {
    browserName = 'opera';
} else if (typeof InstallTrigger !== 'undefined') {
    browserName = 'firefox';
} else if (window.navigator.userAgent.indexOf("Edg") > -1) {
    browserName = 'edge';
}

chrome.runtime.sendMessage({
    action: 'browser_detection',
    browserName: browserName
});

function findGame(gameName, callback, data = {}) {
    chrome.runtime.sendMessage(
        Object.assign(data, {
            action: 'find_game',
            name: gameName
        }),
        callback
    );
}

function listenSinglePageApp(selectorCallback, successCallback, canFetchInit = true) {
    singlePageApp.selector = selectorCallback;
    singlePageApp.callback = successCallback;

    if (canFetchInit) {
        fetchGameName(selectorCallback, successCallback);
    } else {
        isConnected = true;
    }

    chrome.runtime.connect();
}

function listenDOMModifications(element, callback) {
    const observer = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
            callback(mutation);
        }
    });

    observer.observe(element, {
        childList: true,
        subtree: true
    });

    return observer;
}

function allKeyShopRedirectBox($target)
{
    if ($target.length) {
        let $productPlace = $target.closest('.offers-table-row');
        let $compareList = $target.closest('.offers-table');
        let $category = $compareList.find('.offers-table-head');

        $category.remove();
        $productPlace.remove();
        $productPlace.prependTo($compareList);
        $category.prependTo($compareList);
    }
}

function clearProductName(game)
{
    return game
        .trim()
        .replace(/^(acheter|buy|kaufe|comprar|comperare|kaufen)(\s|:|$)/gi, '')
        .replace(/\s?(test:|pr[ée]comander?|pre-?order|vorbestellen|hacer un pedido|preordinare)(\s|:|$)/gi, ' ')
        .replace(/\s(Global CD Key|CD Key|Digital Download|Gift|DVD|Key|CODE)(\s|$).*/gi, '')
        .replace(/™/gi, '')
        .replace(/[\[\(\)\]]/gi, '')
        .trim();
}

function isFreeProduct(productPrice)
{
    return productPrice.match(/(Gratuit|Kostenlos|Gratis|Bezpłatne|Grátis|Free|Gratuito)/g);
}

function getTemplate(apiResponse, siteName, priceOnCurrentPage = null) {
    $('#__ig_ext').remove();

    if (
        null === apiResponse
        || 'error' in apiResponse
        || (
            !apiResponse.force_display_out_of_stock
            && (
                0 === parseInt(apiResponse.price)
                || (
                    null !== priceOnCurrentPage
                    && !isNaN(parseFloat(priceOnCurrentPage))
                    && parseFloat(apiResponse.price) > parseFloat(priceOnCurrentPage)
                )
            )
        )
    ) {
        return null;
    }

    let mainClass = '___' + siteName + ' __ig_extention-container';

    if (!apiResponse.in_stock) {
        mainClass += ' __ig_out-of-stock';
    }

    const container = document.createElement('div');
    container.className = mainClass;
    container.id = '__ig_ext';

    const insideContainer = document.createElement('div');
    insideContainer.className = '__ig_inside-container';

    const logoLink = document.createElement('a');
    const logoBase = new URL('https://www.instant-gaming.com');

    try {
        const safeParams = new URLSearchParams((apiResponse.utmQueryParams ?? '').replace(/^\?/, ''));
        safeParams.forEach((v, k) => logoBase.searchParams.set(k, v));
    } catch (e) {
        // keep bare base URL on parse failure
    }

    logoLink.href = logoBase.toString();
    logoLink.className = '__ig_logo';
    logoLink.target = '_blank';
    logoLink.rel = 'noopener noreferrer';

    const logoSpan = document.createElement('span');
    logoSpan.id = '_ig_new_logo_svg';
    logoLink.appendChild(logoSpan);

    const titleDiv = document.createElement('div');
    titleDiv.className = '__ig_title';
    titleDiv.textContent = decodeHtml(apiResponse.name);

    const dataDiv = document.createElement('div');
    dataDiv.className = '__ig_data';

    if (apiResponse.in_stock) {
        const numbersDiv = document.createElement('div');
        numbersDiv.className = '__ig_numbers';

        if (parseInt(apiResponse.discount) > 0) {
            const discountDiv = document.createElement('div');
            discountDiv.className = '__ig_discount';
            discountDiv.textContent = '-' + parseInt(apiResponse.discount) + '%';
            numbersDiv.appendChild(discountDiv);
        }

        const priceDiv = document.createElement('div');
        priceDiv.className = '__ig_price';
        priceDiv.textContent = decodeHtml(apiResponse.cur_price);
        numbersDiv.appendChild(priceDiv);
        dataDiv.appendChild(numbersDiv);
    } else {
        const outOfStockDiv = document.createElement('div');
        outOfStockDiv.style.marginRight = '10px';
        outOfStockDiv.textContent = decodeHtml(apiResponse.out_of_stock);
        dataDiv.appendChild(outOfStockDiv);
    }

    const buyBtn = document.createElement('a');
    buyBtn.className = '__ig_buy-button';

    if (isSafeUrl(apiResponse.url)) {
        buyBtn.href = apiResponse.url;
        buyBtn.target = '_blank';
        buyBtn.rel = 'noopener noreferrer';
    } else {
        buyBtn.setAttribute('aria-disabled', 'true');
        buyBtn.style.pointerEvents = 'none';
    }

    buyBtn.textContent = decodeHtml(apiResponse.in_stock ? apiResponse.buy : apiResponse.discover);
    dataDiv.appendChild(buyBtn);

    insideContainer.appendChild(logoLink);
    insideContainer.appendChild(titleDiv);
    insideContainer.appendChild(dataDiv);
    container.appendChild(insideContainer);

    return $(container);
}

function fetchGameName(callback, onSuccess = null, canRetry = true) {
    if (null === onSuccess) {
        if (null === singlePageApp.callback) {
            return;
        }

        onSuccess = singlePageApp.callback;
    }

    const doClearInterval = function () {
        clearInterval(gameNameInterval);
        gameNameInterval = null;
        gameNameIntervalCount = 0;
    }

    const checkGameName = function () {
        let gameName = callback();

        if (null === gameName || 0 === gameName.length) {
            gameName = null;
            lastGameName = null;
        }

        if (
            null !== gameName
            && gameName !== lastGameName
        ) {
            doClearInterval();
            lastGameName = gameName;

            onSuccess(clearProductName(gameName));

            return true;
        }

        return false;
    };

    doClearInterval();

    if (checkGameName()) {
        return;
    }

    if (canRetry) {
        gameNameInterval = setInterval(() => {
            if (checkGameName()) {
                return;
            }

            gameNameIntervalCount++;

            if (gameNameIntervalCount > 60) {
                doClearInterval();
            }
        }, 1000);
    }
}

function decodeHtml(str) {
    return str
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function isSafeUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

chrome.runtime.onMessage.addListener(function () {
    const currentUrl = window.location.href;

    if (
        null === singlePageApp.selector
        || currentUrl === singlePageApp.url
    ) {
        return;
    }

    singlePageApp.url = window.location.href;

    if (isConnected) {
        fetchGameName(singlePageApp.selector, singlePageApp.callback);
    } else {
        isConnected = true;
    }
});

function getLowestPriceFromDivs($pricesDivs, attribute = null) {
    let prices = [];

    if (null !== $pricesDivs && 'undefined' !== typeof $pricesDivs) {
        for (let i = 0; i < $pricesDivs.length; i++) {
            prices.push(
                null !== attribute
                    ? $pricesDivs[i].getAttribute(attribute)
                    : normalizePrice($pricesDivs[i].textContent)
            );
        }
    }


    return prices.length > 0 ? Math.min(...prices) : null;
}

function normalizePrice(priceString) {
    if (null === priceString || 'undefined' === typeof priceString) {
        return null;
    }

    const match = priceString.match(/(\d+(?:[.|,]\d{1,2}))/);

    return null !== match
        ? parseFloat(match[0].replace(',', '.')).toFixed(2)
        : null;
}

if (/steampowered\.com\/app\/\d+/.test(window.location.href)) {
    let steamId = window.location.href.match(/steampowered\.com\/app\/(\d+)/)[1];

    const prefix = "game_area_purchase_section_add_to_cart_title_";
    let element = document.querySelector(`[id^="${prefix}"]`);
    const editionId = element !== null ? element.id.replace(prefix, '') : undefined;

    fetchGameName(
        () => {
            return $('.apphub_AppName').first().text();
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $divPrices = $('.game_area_purchase_game').find('[data-price-final]');
                const $template = getTemplate(
                    response,
                    'steam',
                    $divPrices > 0
                        ? parseInt($divPrices[0].getAttribute('data-price-final')) / 100
                        : null
                );

                if (null !== $template) {
                    $('#game_area_purchase').prepend($template);
                }
            }, {
                steamappid: steamId,
                platform: PRODUCT_PLATFORM.PC,
                type: PRODUCT_TYPE.STEAM,
                ...(editionId !== undefined ? { editionId } : {})
            });
        }
    );
}

else if (/www\.dlcompare\.*/.test(window.location.href)) {
    $(function () {
        $('ul.pricelist-item li').each(function() {
            if ($(this).find('span.shop img').attr('alt') == 'Instant Gaming') {
                let $li = $(this);
                let $target = $li.closest('ul');
                $(this).remove();
                $li.prependTo($target);
            }
        });
    });
}

else if (/allkeyshop\.com|keyforsteam\.de|www\.goclecd\.fr|www\.keyforsteam\.de/.test(window.location.href)) {
    $(function () {
        let $target = $('.offers-table').first().find('.offers-table-row[data-merchant=13]');
        let $targetOutOfStock = $('.offers-table.out-of-stock .offers-table-row[data-merchant=13]');
        allKeyShopRedirectBox($target);
        allKeyShopRedirectBox($targetOutOfStock);
    });
}

else if (/www\.cdkeys\.com.*/.test(window.location.href)) {
    fetchGameName(
        () => {
            return $('meta[name=title]').attr('content').split('|')[0].trim();
        },
        (gameName) => {
            findGame(gameName, (response) => {
                const $productInfoDiv = $('.product-info-addto');
                const $template = getTemplate(
                    response,
                    'cdkeys',
                    $productInfoDiv
                        .find('[data-price-type="finalPrice"]')
                        .data('price-amount')
                    ?? null
                );

                if (null !== $template) {
                    $template.insertBefore($productInfoDiv);
                }
            });
        }
    );
}

else if (/gocdkeys\.com/.test(window.location.href)) {
    $(function () {
        let $ig = $('img[title="Instant Gaming"]').closest('tr');
        if ($ig.length) {
            if ($ig.hasClass('hidden-store')) {
                $ig.removeClass()
            }
            $ig.addClass('recommended');
            $ig.insertBefore($ig.closest('tbody').children().eq(1));
            $ig.next('tr').removeClass('recommended');
            $ig.next('tr').find('.p-store-cheapest').text('');
            $ig.focus();
        }
    });
}

else if (/jeuxvideo\.com/.test(window.location.href)) {
    fetchGameName(
        () => {
            const $gameName = $('.gameHeaderBanner div a');

            if ($gameName.length > 0) {
                return $('.gameHeaderBanner div a')[0].textContent;
            }

            return null;
        },
        (gameName) => {
            findGame(gameName, (response) => {
                const $mainOffersDivs = $('.gameAffiliate div div div a');
                let prices = [];

                if ($mainOffersDivs.length > 0) {
                    prices.push(getLowestPriceFromDivs($mainOffersDivs));
                }

                const $template = getTemplate(
                    response,
                    'jeuxvideos',
                    prices.length > 0 ? prices : null
                );

                if (null !== $template) {
                    const $a = $template.find('a');

                    $a.attr('href', '#');

                    $a.click(function () {
                        if (isSafeUrl(response.url)) {
                            window.open(response.url);
                        }

                        return false;
                    });

                    // Need position: relative otherwise the block will be hidden
                    $template
                        .css('position', 'relative')
                        .css('z-index', 10)
                        .css('margin-bottom', '20px');

                    const $reviewContainer = $('.reviewContentHeader .row.g-sm-5');
                    const $userSignatureDiv = $('div .userSignature');

                    if ($reviewContainer.length > 0 || $userSignatureDiv.length > 0) {
                        $template.insertAfter($reviewContainer.length > 0 ? $reviewContainer : $userSignatureDiv);
                    } else {
                        $template.appendTo($('.gameCharacteristicsMain'));
                    }
                }
            });
        }
    );
}

else if (/www\.kinguin\.net(?:\/.*|\s{0})\/category\/\d+\/.*/.test(window.location.href)) {
    fetchGameName(
        () => {
            const $h1 = $('h1');

            return $h1.length > 0 ? clearProductName($h1[0].textContent) : '';
        },
        (gameName) => {
            findGame(gameName, (response) => {
                const $mainOfferWrapper = $('#main-offer-wrapper');
                const $priceDiv = $mainOfferWrapper.length > 0
                    ? $mainOfferWrapper
                        .find('.main-offer__price')
                        .find('span:nth-child(2)')
                    : null;
                const $template = getTemplate(
                    response,
                    'kinguin',
                    $priceDiv.length > 0
                        ? normalizePrice($priceDiv[0].textContent)
                        : null
                );

                const observer = listenDOMModifications(document.querySelector('.product-info'), (mutation) => {
                    if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].querySelector('.merchant-info')) {
                        if (null !== $template) {
                            $template.insertBefore($mainOfferWrapper);
                        }

                        observer.disconnect();
                    }
                });
            });
        }
    );
}

else if (/www\.g2a\.com/.test(window.location.href)) {
    fetchGameName(
        () => {
            return clearProductName($('h1[data-locator="ppa-summary__title"]').text());
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $template = getTemplate(
                    response,
                    'g2a',
                    getLowestPriceFromDivs(
                        $('div[data-locator="ppa-payment-info"]')
                            .find('span[data-locator="zth-price"]')
                    )
                );

                if (null !== $template) {
                    $template.insertBefore($('div[class*=SelectedOfferContainer]'));
                }
            });
        }
    );
}

else if (/www\.gamivo\.com/.test(window.location.href)) {
    const gameNameCallback = () => {
        return $('.breadcrumb:first-child li:last-child').text();
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            const $container = $('.product-container app-product-offer-price div.buy-container');
            const $template = getTemplate(
                response,
                'gamivo',
                getLowestPriceFromDivs($container.find('.buy-container__main-price'))
            );

            if (null === $template) {
                return;
            }

            if ($container.length > 0) {
                $container.prepend($template);
            }

            const observer = listenDOMModifications(document.querySelector('body'), (mutation) => {
                if (
                    mutation.addedNodes.length > 0
                    && 'classList' in mutation.addedNodes[0]
                    && mutation.addedNodes[0].classList.contains('product-container')
                ) {
                    observer.disconnect();

                    mutation.addedNodes[0].querySelector('app-product-offer-price').prepend($template[0]);
                }
            });
        });
    };

    listenSinglePageApp(gameNameCallback, gameFoundCallback);
}

else if (/www\.youtube\.com/.test(window.location.href)) {
    const gameNameCallback = () => {
        return $('#endpoint-link #text-container #title').first().text();
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            $('#__ig_ext').remove();

            if (null === response) {
                return;
            }

            $('#secondary.ytd-watch-flexy').prepend(getTemplate(response, 'youtube'));
        });
    };

    listenSinglePageApp(gameNameCallback, gameFoundCallback);

    setInterval(() => {
        fetchGameName(gameNameCallback, gameFoundCallback, false);
    }, 60 * 5 * 1000);
}

else if (/twitch\.tv/.test(window.location.href)) {
    const gameNameCallback = () => {
        let $gameNameElement = $('a[data-a-target="stream-game-link"] > span');

        return $gameNameElement.text();
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            if (null === response || response.error) {
                $('#__ig_ext').remove();

                return false;
            }

            $('#live-channel-stream-information').append(getTemplate(response, 'twitch'));
        });
    };

    listenSinglePageApp(gameNameCallback, gameFoundCallback);

    // Streamer can change the played game without reloading the page
    setInterval(() => {
        fetchGameName(gameNameCallback, gameFoundCallback, false);
    }, 60 * 5 * 1000);
}

else if (/www\.amazon\.(fr|en|es|it|de|com)\/.*/.test(window.location.href)) {
    if ($('[data-category="videogames"]').length > 0 || $('#platformInformation_feature_div').length > 0) {
        fetchGameName(
            () => {
                return clearProductName($('#productTitle').text()).trim();
            },
            (gameName) => {
                findGame(gameName, function (response) {
                    const $priceDiv =$('.aok-offscreen');
                    const $template = getTemplate(
                        response,
                        'amazon',
                        $priceDiv.length > 0 ? normalizePrice($priceDiv[0].textContent) : null
                    );

                    if (null === $template) {
                        return;
                    }

                    $('#addToCart_feature_div').closest('.a-box-group').first().prepend($template);
                });
            }
        );
    }
}

else if (/www\.ea\.com\/.*\/buy\/pc/.test(window.location.href)) {
    const gameNameCallback = () => {
        return document.querySelector('ea-hybrid-msf-sub-summary').attributes['rating-label-text'].value.replace(/\u00a0/g, " ");
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            const $priceDomElement = document.querySelector('ea-hybrid-price-query[query-type="gamePrice"] ea-hybrid-price-badge');
            const $template = getTemplate(
                response,
                'ea',
                null !== $priceDomElement
                    ? normalizePrice($priceDomElement.attributes['text'].textContent)
                    : null
            );

            if (null === $template) {
                return;
            }

            const buyButton = document.querySelector('ea-hybrid-card-input-wrap[context="join-or-buy"]');

            if (null !== buyButton) {
                $template.insertAfter(buyButton);
            } else {
                $template.addClass('__ig_grid');
                $template.appendTo(document.querySelector('ea-hybrid-msf-step[grid="true"]'));
            }
        }, {
            platform: PRODUCT_PLATFORM.PC,
            type: PRODUCT_TYPE.EA_APP
        });
    };

    listenSinglePageApp(gameNameCallback, gameFoundCallback, false);
}

else if (/(fr|pt|es|it|de|www)\.ign\.com/.test(window.location.href)) {
    fetchGameName(
        () => {
            return $('a.evidence').text();
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $template = getTemplate(response, 'ign');

                if (null === $template) {
                    return;
                }

                $template.appendTo($('.object-breadcrumbs'));
            });
        }
    );
}

else if (/https:\/\/www\.gamespot\.com\/(?:articles|reviews|games)\/.*/.test(window.location.href)) {
    let matches = window.location.href.match(/https:\/\/www\.gamespot\.com\/(games|reviews|articles)/);
    const pageType = matches[1];

    fetchGameName(
        () => {
            if (pageType === 'reviews') {
                const $navList = $('.subnav-list__item-primary');

                return $navList.length > 0
                    ? $navList[0].textContent.trim()
                    : $('h1')[0].textContent.match(/(.*\s)Review\s-/)[1].trim();
            } else if (pageType === 'articles') {
                return $('.horizontal-list__item-gap a')[0].textContent.trim();
            } else if (pageType === 'games') {
                return $('.wiki-title')[0].textContent;
            }
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $template = getTemplate(response, 'gamespot');

                if (null === $template) {
                    return;
                }

                let $element = null;

                if (['reviews', 'articles'].includes(pageType)) {
                    $element = window.innerWidth > 1023
                        ? (
                            pageType === 'reviews'
                                ? $('aside.pull-right')
                                : $('aside.seamless-content__aside')
                        )
                        : $('article section')[1];
                } else if (pageType === 'games') {
                    $element =  window.innerWidth > 767 ? $('.secondary-content') : $('#mantle_skin');
                }

                $template.prependTo($element);
            });
        }
    );
}

else if (/epicgames\.com\//.test(window.location.href)) {
    const gameNameCallback = () => {
        const $gameTitle = $('h1 [data-testid="pdp-title"]');

        return $gameTitle.length > 0 ? $gameTitle[0].textContent + ' Epic Games' : '';
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            if (null === response || response.error) {
                return false;
            }

            const $buyButton = $(document).find('button[data-testid="purchase-cta-button"]');

            if ($buyButton.length === 0) {
                const observer = listenDOMModifications($('aside')[0], (mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        const $children = mutation.addedNodes[0].childNodes;
                        let isButtonExist = false;

                        for (let i = 0; i < $children.length; i++) {
                            if (
                                'BUTTON' === $children[i].childNodes[0].childNodes[0].nodeName
                                && 'purchase-cta-button' === $children[i].childNodes[0].childNodes[0].dataset.testid
                            ) {
                                isButtonExist = true;

                                break;
                            }
                        }

                        if (isButtonExist) {
                            const $template = getTemplate(
                                response,
                                'epicgames',
                                normalizePrice(mutation.addedNodes[0].textContent)
                            );

                            if (null !== $template) {
                                $template.insertBefore($('button[data-testid="purchase-cta-button"]'));
                            }
                        }

                        observer.disconnect();
                    }
                });
            } else {
                const $priceElement = $buyButton[0].parentNode.parentNode.parentNode;
                const $template = getTemplate(
                    response,
                    'epicgames',
                    null !== $priceElement
                        ? normalizePrice($priceElement.textContent)
                        : null
                );

                if (null !== $template) {
                    $template.insertBefore($buyButton);
                }
            }
        }, {
            platform: PRODUCT_PLATFORM.PC,
            type: PRODUCT_TYPE.EPIC_GAMES
        });
    }

    listenSinglePageApp(gameNameCallback, gameFoundCallback);
}

else if (/playstation\.com\/.*\/product|concept\//.test(window.location.href)) {
    fetchGameName(
        () => {
            return $('h1[data-qa="mfe-game-title#name"]')[0].textContent;
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const observer = listenDOMModifications($('div[data-mfe-name="ctaWithPrice"]')[0], (mutation) => {
                    if (
                        mutation.addedNodes.length > 0
                        && 'mfeCtaMain' === mutation.addedNodes[0].getAttribute('data-qa')
                    ) {
                        const textContent = mutation.addedNodes[0].textContent;

                        if (textContent.match(/(Gratuit|Kostenlos|Gratis|Bezpłatne|Grátis|Free)/g)) {
                            return;
                        }

                        const $template = getTemplate(
                            response,
                            'playstation',
                            normalizePrice(textContent)
                        );

                        if (null === $template) {
                            observer.disconnect();

                            return;
                        }

                        $template.insertBefore($('[data-qa="mfeCtaMain#cta"]'));

                        observer.disconnect();
                    }
                });
            }, {
                type: PRODUCT_TYPE.PLAYSTATION_STORE
            });
        }
    );
}

else if (/www\.xbox\.com\//.test(window.location.href)) {
    const gameNameCallback = () => {
        if (0 === $('div[class^=ProductDetailsHeader-module__backgroundImageContainer]').length) {
            return '';
        }

        const $h1 = $('h1');

        return $h1.length > 0 ? $h1[0].textContent : '';
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            if (null === response || response.error) {
                return false;
            }

            let $element = $('div#root');
            const isMobile = window.innerWidth <= 850;

            const observer = listenDOMModifications($element[0], (mutation) => {
                if (
                    mutation.addedNodes.length > 0
                    && 'childNodes' in mutation.addedNodes[0]
                    && mutation.addedNodes[0].childNodes.length > 0
                    && (
                        (
                            !isMobile
                            && 'hasAttribute' in mutation.addedNodes[0].childNodes[0]
                            && mutation.addedNodes[0].childNodes[0].hasAttribute('data-focus-container')
                        )
                        || (
                            isMobile
                            && $(mutation.addedNodes[0]).find('*[class^="PDPActionPanelLayout-module__mobileProductActionsPanel___"]').length > 0
                        )
                    )
                ) {
                    let $container;

                    if (isMobile) {
                        $container = $element.find('*[class^="ProductDetailsHeader-module__showOnMobileView___"]');
                    } else {
                        $container = $(mutation.addedNodes[0].childNodes[0]);
                    }

                    const priceString = $container.find('*[class^="Price-module__"]').text();

                    if (!isFreeProduct(priceString)) {
                        const priceMatches = priceString.match(/(\d{1,3}.\d{2})/g);
                        const $template = getTemplate(
                            response,
                            'xbox',
                            priceMatches !== null
                                ? priceMatches.length > 1 ? priceMatches[1] : priceMatches[0]
                                : null
                        );

                        if (null !== $template) {
                            // Need position: relative otherwise the block will be hidden
                            $template.css('position', 'relative').css('z-index', 10);
                            $(mutation.addedNodes[0]).prepend($template);
                        }
                    }

                    observer.disconnect();
                }
            });
        }, {
            type: PRODUCT_TYPE.MICROSOFT_STORE
        });
    }

    listenSinglePageApp(gameNameCallback, gameFoundCallback);
}

else if (/https:\/\/www\.pcgamer\.com\/.*-review\//.test(window.location.href)) {
    fetchGameName(
        () => {
            const h1 = $('h1');

            if (h1[0] === undefined) {
                return '';
            }

            return h1[0].textContent.replace('review', '').trim();
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $template = getTemplate(response, 'pcgamer');

                if (null === $template) {
                    return;
                }

                const target = $('.fancy-box');

                if (target.length) {
                    $template.insertBefore(target);
                } else {
                    $template.prependTo($('#article-body'));
                }
            });
        }
    );
}

else if (/https:\/\/www\.everyeye\.it\/(?:giochi|notizie)\/.*/.test(window.location.href)) {
    let isArticle = null !== window.location.href.match(/notizie/);

    fetchGameName(
        () => {
            return !isArticle ? $('h1')[0].textContent : $('li.nome-gioco-scheda')[0].innerText;
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $template = getTemplate(response, 'everyeye');

                if (null === $template) {
                    return;
                }

                $template.insertAfter(isArticle ? $('.cont_bottoni_schedax') : $('section'));
            });
        }
    );
}

else if (/https:\/\/www\.eurogamer\.(?:net|cz|pt|nl|it|de|es|pl)\/.*(?:review|recenze|analisis|recenzja|recensione|test).*/.test(window.location.href)) {
    fetchGameName(
        () => {
            return $('nav.nav_breadcrumbs li a[href^="/games"]')[0].textContent.trim();
        },
        (gameName) => {
            findGame(gameName, function (response) {
                const $template = getTemplate(response, 'eurogamer');

                if (null === $template) {
                    return;
                }

                $template.insertBefore($('.article_body'));
            });
        }
    );
}

else if (/https:\/\/www\.nintendo\.com(?:\/|\s{0})(?:fr-ca|pt-br|en-ca|\s{0})\/.*/.test(window.location.href)) {
    const gameNameCallback = () => {
        if (null === window.location.href.match(/\/store\/products\//) || $('form[name="ageForm"]').length > 0) {
            return '';
        }

        const $h1 = $('h1');

        return $h1.length > 0
            ? clearProductName($h1[0].textContent)
            : '';
    };

    const gameFoundCallback = (gameName) => {
        findGame(gameName, (response) => {
            if (null === response || response.error) {
                return false;
            }

            let $element = $('#main section div div[class*="PurchaseOption"]');

            if ($element.length > 0) {
                if ('' !== $element[0].textContent) {
                    const priceString = normalizePrice($element[0].textContent);

                    if (null === priceString.match(/Free|Gratuit|Grátis/)) {
                        const $template = getTemplate(
                            response,
                            'nintendo',
                            normalizePrice(priceString)
                        );

                        if (null !== $template) {
                            $template.insertBefore($element[0]);
                        }
                    }

                    return;
                }

                const observer = listenDOMModifications($element[0], (mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        const priceString = mutation.addedNodes[0].textContent;

                        if (null === priceString.match(/Free|Gratuit|Grátis/)) {
                            const $template = getTemplate(
                                response,
                                'nintendo',
                                normalizePrice(priceString)
                            );

                            if (null !== $template) {
                                $template.insertBefore($element);
                            }
                        }

                        observer.disconnect();
                    }
                });
            }
        }, {
            type: PRODUCT_TYPE.NINTENDO_ESHOP
        });
    }

    listenSinglePageApp(gameNameCallback, gameFoundCallback);
}

else if (/https:\/\/www.gamesradar\.com\/.*/.test(window.location.href)) {
    const $navList = $('nav.breadcrumb ol li');

    if ($navList.length > 2 && null !== $navList[0].textContent.match(/Games/)) {
        fetchGameName(
            () => {
                return clearProductName($('nav.breadcrumb ol li:last-of-type')[0].textContent);
            },
            (gameName) => {
                findGame(gameName, function (response) {
                    const $template = getTemplate(response, 'gamesradar');

                    if (null === $template) {
                        return;
                    }

                    $template.insertBefore($('section.content-wrapper #article-body'));
                });
            }
        );
    }
}
