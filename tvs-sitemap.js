console.log("Styler Sitemap — Resilient Version07 (TVS 095)");

(function () {

    const DEFAULT_WAIT_TIMEOUT = 5000;
    const DEFAULT_WAIT_INTERVAL = 80;

    function getDataLayerValue(path) {
        if (!Array.isArray(window.dataLayer)) return null;
        for (var i = 0; i < window.dataLayer.length; i++) {
            var obj = window.dataLayer[i];
            var current = obj;
            for (var j = 0; j < path.length; j++) {
                if (current && current[path[j]] !== undefined) {
                    current = current[path[j]];
                } else {
                    current = null;
                    break;
                }
            }
            if (current !== null && current !== undefined) {
                return current;
            }
        }
        return null;
    }

    function findCatalogVehicle(name) {
        var catalog = window.TVS_VEHICLE_CATALOG;
        if (!catalog || !name) return null;
        var keys = Object.keys(catalog.categories);
        for (var k = 0; k < keys.length; k++) {
            var items = catalog.categories[keys[k]].items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].name === name) return items[i];
            }
        }
        return null;
    }

    function findCatalogVehicleByPid(pid) {
        var catalog = window.TVS_VEHICLE_CATALOG;
        if (!catalog || !pid) return null;
        var keys = Object.keys(catalog.categories);
        for (var k = 0; k < keys.length; k++) {
            var items = catalog.categories[keys[k]].items;
            for (var i = 0; i < items.length; i++) {
                if (items[i].id === pid) return items[i];
            }
        }
        return null;
    }

    function getCartItems() {
        const items = getDataLayerValue(["MCP", "items"]) || [];
        const currency = getDataLayerValue(["MCP", "currency"]) || "INR";
        return items.map(it => ({
            catalogObjectType: "Product",
            catalogObjectId: it.item_id || it.id || null,
            price: parseFloat(it.price) || 0,
            quantity: parseInt(it.quantity, 10) || 0,
            attributes: {
                sku: it.item_sku || it.id,
                name: it.item_name || it.name || "",
                currency: currency
            }
        })).filter(i => !!i.catalogObjectId);
    }

    function waitForElement(selector, timeout = DEFAULT_WAIT_TIMEOUT, interval = DEFAULT_WAIT_INTERVAL) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            function check() {
                try {
                    const el = document.querySelector(selector);
                    if (el) return resolve(el);
                } catch (e) { /* invalid selector */ }
                if (Date.now() - start >= timeout) {
                    return reject(new Error("Timeout waiting for element: " + selector));
                }
                setTimeout(check, interval);
            }
            check();
        });
    }

    function resolveSelectorWithFallback(selectors, timeout = DEFAULT_WAIT_TIMEOUT) {
        if (!selectors) return Promise.reject(new Error("No selector provided"));
        const list = Array.isArray(selectors) ? selectors : [selectors];

        return new Promise((resolve, reject) => {
            const start = Date.now();

            function tryNext(index) {
                if (index >= list.length) {
                    const fallback = list[0];
                    waitForElement(fallback, Math.max(0, timeout - (Date.now() - start)))
                        .then(() => resolve(fallback))
                        .catch(() => reject(new Error("None of the selectors appeared: " + JSON.stringify(list))));
                    return;
                }

                const sel = list[index];
                try {
                    if (document.querySelector(sel)) {
                        return resolve(sel);
                    }
                } catch (e) { /* ignore */ }

                if (Date.now() - start >= timeout) {
                    const fallback = list[0];
                    waitForElement(fallback, 0)
                        .then(() => resolve(fallback))
                        .catch(() => reject(new Error("Timeout trying fallback selectors: " + JSON.stringify(list))));
                    return;
                }

                setTimeout(() => tryNext(index + 1), 60);
            }

            tryNext(0);
        });
    }

    function waitForDataLayerValue(path, timeout = 3000, interval = 80) {
        timeout = timeout || 3000;
        interval = interval || 80;
        return new Promise(function (resolve, reject) {
            var start = Date.now();
            function check() {
                var value = getDataLayerValue(path);
                if (value !== null && value !== undefined) {
                    resolve(value);
                } else if (Date.now() - start >= timeout) {
                    reject(new Error("Timeout waiting datalayer: " + path.join(".")));
                } else {
                    setTimeout(check, interval);
                }
            }
            check();
        });
    }

    function sendVehicleBookedFromDataLayer(item) {
        var mcp = item.MCP || {};
        var product = mcp.Item || {};
        var id = mcp.pid || product.id || "";
        var bikeName = mcp.confirmedBookedBike || product.name || id;
        var price = parseFloat(product.price) || 0;

        if (!id) {
            console.warn("Vehicle Booked — product ID missing in dataLayer");
            return;
        }

        var lineItem = {
            catalogObjectType: "Product",
            catalogObjectId: id,
            quantity: 1,
            price: price,
            attributes: {
                name: bikeName,
                sku: { id: id },
                category: product.category || ""
            }
        };

        SalesforceInteractions.sendEvent({
            interaction: {
                name: SalesforceInteractions.CartInteractionName.AddToCart,
                lineItem: lineItem
            }
        });

        SalesforceInteractions.sendEvent({
            interaction: { name: "Vehicle Booked" },
            user: item.user || {
                attributes: {
                    confirmedBookedBike: bikeName,
                    bookedPid: id
                }
            }
        });
    }

    function sendTestDriveFormOpenedFromDataLayer(item) {
        var mcp = item.MCP || {};
        SalesforceInteractions.sendEvent({
            interaction: { name: "Test Ride Form Opened" },
            user: {
                attributes: {
                    testDriveSelectedBike: mcp.testDriveSelectedBike || (mcp.Item && mcp.Item.name) || "",
                    testDrivePid: mcp.pid || (mcp.Item && mcp.Item.id) || ""
                }
            }
        });
    }

    function sendTestRideBookedFromDataLayer(item) {
        var mcp = item.MCP || {};
        var product = mcp.Item || {};
        var user = item.user || {};
        var attrs = (user.attributes) || {};
        var bikeName = mcp.confirmedTestDriveBike || attrs.confirmedTestDriveBike || product.name || "";
        var pid = mcp.pid || attrs.testDrivePid || product.id || "";
        var email = (user.identities && user.identities.emailAddress) || attrs.testDriveEmail || "";
        var catalogItem = pid ? findCatalogVehicleByPid(pid) : findCatalogVehicle(bikeName);

        if (!email && !bikeName) return;

        SalesforceInteractions.sendEvent({
            interaction: { name: "Test Ride Booked" },
            user: {
                identities: email ? { emailAddress: email } : undefined,
                attributes: {
                    confirmedTestDriveBike: bikeName,
                    testDrivePid: pid,
                    testDriveCustomerName: attrs.testDriveCustomerName || "",
                    testDrivePhone: attrs.testDrivePhone || "",
                    testDriveEmail: attrs.testDriveEmail || email,
                    testDriveCity: attrs.testDriveCity || "",
                    testDrivePincode: attrs.testDrivePincode || "",
                    testDrivePreferredDate: attrs.testDrivePreferredDate || "",
                    testDriveNotes: attrs.testDriveNotes || ""
                }
            },
            catalogObject: catalogItem ? {
                type: "Product",
                id: catalogItem.id,
                attributes: {
                    name: catalogItem.name,
                    price: catalogItem.price || 0,
                    currency: getDataLayerValue(["MCP", "currency"]) || "INR"
                }
            } : undefined
        });
    }

    function installPageDataLayerBridge() {
        var dl = window.dataLayer = window.dataLayer || [];
        if (dl._tvsPageBridgeInstalled) return;
        dl._tvsPageBridgeInstalled = true;

        var recent = {};
        var originalPush = dl.push;

        function shouldSkip(eventName, item) {
            var key = eventName;
            if (item && item.MCP && item.MCP.pid) key += ":" + item.MCP.pid;
            if (item && item.user && item.user.identities && item.user.identities.emailAddress) {
                key += ":" + item.user.identities.emailAddress;
            }
            var now = Date.now();
            if (recent[key] && now - recent[key] < 800) return true;
            recent[key] = now;
            return false;
        }

        function handleDataLayerEvent(item) {
            if (!item || !item.event) return;
            if (shouldSkip(item.event, item)) return;

            switch (item.event) {
                case "auth_modal_open":
                    SalesforceInteractions.sendEvent({
                        interaction: { name: "Auth Modal Opened" }
                    });
                    break;
                case "user_login":
                    SalesforceInteractions.sendEvent({
                        interaction: { name: "User Logged In" },
                        user: item.user || {}
                    });
                    break;
                case "user_signup":
                    SalesforceInteractions.sendEvent({
                        interaction: { name: "Register/Login User" },
                        user: item.user || {}
                    });
                    break;
                case "user_logout":
                    SalesforceInteractions.sendEvent({
                        interaction: { name: "User Logged Out" }
                    });
                    break;
                case "vehicle_booked":
                    sendVehicleBookedFromDataLayer(item);
                    break;
                case "test_drive_form_open":
                    sendTestDriveFormOpenedFromDataLayer(item);
                    break;
                case "test_ride_booked":
                    sendTestRideBookedFromDataLayer(item);
                    break;
            }
        }

        dl.push = function () {
            var item = arguments[0];
            var result = originalPush.apply(dl, arguments);
            handleDataLayerEvent(item);
            return result;
        };

        for (var i = 0; i < dl.length; i++) {
            handleDataLayerEvent(dl[i]);
        }
    }

    if (typeof SalesforceInteractions === "undefined") {
        console.warn("SalesforceInteractions not loaded — sitemap skipped");
        return;
    }

    SalesforceInteractions.init({
        cookieDomain: window.location.hostname
    }).then(function () {

        installPageDataLayerBridge();

        var sitemapConfig = {

            global: {
                contentZones: [
                    { name: "global_survey_feedback" },
                    { name: "global_header", selector: ["header.navbar", "header.site-header", "header.main-header"] },
                    { name: "global_footer", selector: ["footer.footer", "footer.site-footer"] },
                    { name: "global_Product_recommendation", selector: ["#product-recommendation", ".global-product-recommendation"] },
                    { name: "global_welcome" },
                    { name: "global_exit_intent" },
                    { name: "global_auth", selector: "#authModal" }
                ]
            },

            pageTypeDefault: {
                name: "default",
                interaction: { name: "Default Page" }
            },

            pageTypes: [

                {
                    name: "home",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageName"], 2000, 80)
                            .then(function (pt) { return pt === "Home"; })
                            .catch(function () { return false; });
                    },
                    interaction: { name: "Home Page" },
                    contentZones: [
                        { name: "home_recommendation", selector: ".featured-products" },
                        { name: "home_banner", selector: "#hero" },
                        { name: "test_ride_modal", selector: "#testRideModal" },
                        { name: "auth_modal", selector: "#authModal" }
                    ]
                },

                {
                    name: "category",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 2000, 80)
                            .then(function (pt) { return pt === "Category"; })
                            .catch(function () { return false; });
                    },
                    interaction: {
                        name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                        catalogObject: {
                            type: "Category",
                            id: function () {
                                return getDataLayerValue(["MCP", "itemListId"]) || "unknown_category";
                            },
                            attributes: {
                                name: function () {
                                    return getDataLayerValue(["MCP", "itemListName"]) || null;
                                },
                                url: SalesforceInteractions.resolvers.fromHref()
                            }
                        }
                    },
                    contentZones: [
                        { name: "plp_recommendation", selector: ".vehicle-cards" }
                    ]
                },

                {
                    name: "pdp",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 2000, 80)
                            .then(function (pt) { return pt === "Product"; })
                            .catch(function () { return false; });
                    },
                    interaction: {
                        name: SalesforceInteractions.CatalogObjectInteractionName.ViewCatalogObject,
                        catalogObject: {
                            type: "Product",
                            id: function () {
                                return getDataLayerValue(["MCP", "Item", "id"]);
                            },
                            attributes: {
                                sku: {
                                    id: function () {
                                        return getDataLayerValue(["MCP", "Item", "id"]);
                                    }
                                },
                                name: function () { return getDataLayerValue(["MCP", "Item", "name"]); },
                                description: function () { return getDataLayerValue(["MCP", "Item", "description"]); },
                                imageUrl: function () {
                                    var img = getDataLayerValue(["MCP", "Item", "imageUrl"]);
                                    if (!img) {
                                        return window.location.origin + "/default.jpg";
                                    }
                                    if (img.indexOf("http") === 0) return img;
                                    return window.location.origin + img;
                                },
                                url: function () { return getDataLayerValue(["MCP", "Item", "url"]); },
                                currency: function () { return getDataLayerValue(["MCP", "currency"]) || "INR"; },
                                inventoryCount: 1,
                                price: function () { return getDataLayerValue(["MCP", "Item", "price"]) || 0; },
                                availability: function () { return getDataLayerValue(["MCP", "Item", "availability"]); }
                            },
                            relatedCatalogObjects: {
                                Category: function () {
                                    var cat = getDataLayerValue(["MCP", "Item", "category"]);
                                    return cat ? [cat] : [];
                                }
                            }
                        }
                    },
                    contentZones: [
                        { name: "pdp_recommendation", selector: ".pdp_recommendation" }
                    ]
                },

                {
                    name: "booking",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 2000, 80)
                            .then(function (pt) { return pt === "Booking"; })
                            .catch(function () { return false; });
                    },
                    interaction: { name: "Vehicle Booking" }
                },

                {
                    name: "test_ride",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 2000, 80)
                            .then(function (pt) { return pt === "TestRide"; })
                            .catch(function () { return false; });
                    },
                    interaction: { name: "Test Ride Booking" },
                    contentZones: [
                        { name: "test_ride_form", selector: "#testRideForm" }
                    ]
                },

                {
                    name: "Cart page",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 2000, 80)
                            .then(function (pt) { return pt === "Cart"; })
                            .catch(function () { return false; });
                    },
                    interaction: {
                        name: SalesforceInteractions.CartInteractionName.ReplaceCart
                    }
                },

                {
                    name: "checkout",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 5000, 50)
                            .then(function (pt) { return pt === "view_checkout"; })
                            .catch(function () { return false; });
                    },
                    interaction: {
                        name: "Checkout",
                        lineItem: function () {
                            var items = getDataLayerValue(["MCP", "items"]) || [];
                            return items.map(function (item) {
                                return {
                                    catalogObjectType: "Product",
                                    catalogObjectId: item.item_id || "unknown_id",
                                    quantity: parseInt(item.quantity, 10) || 1,
                                    price: parseFloat(item.price) || 0,
                                    attributes: {
                                        name: item.item_name || "",
                                        imageUrl: item.imageUrl || "",
                                        url: item.url || window.location.href,
                                        sku: { id: item.item_id || "" }
                                    }
                                };
                            });
                        }
                    },
                    listeners: [
                        SalesforceInteractions.listener("click", ".checkout-btn", function () {
                            SalesforceInteractions.sendEvent({
                                interaction: { name: "Payment Initiated" },
                                user: {
                                    attributes: {
                                        firstName: SalesforceInteractions.cashDom("#fullName").val(),
                                        phone: SalesforceInteractions.cashDom("#phone").val(),
                                        addressLine1: SalesforceInteractions.cashDom("#address").val(),
                                        city: SalesforceInteractions.cashDom("#city").val(),
                                        stateProvince: SalesforceInteractions.cashDom("#state").val(),
                                        postalCode: SalesforceInteractions.cashDom("#pincode").val()
                                    }
                                }
                            });
                        })
                    ]
                },

                {
                    name: "orders",
                    isMatch: function () {
                        return window.location.pathname === "/orders";
                    },
                    interaction: { name: "Orders Page" }
                },

                {
                    name: "contact",
                    isMatch: function () {
                        return waitForDataLayerValue(["MCP", "pageType"], 2000, 80)
                            .then(function (pt) { return pt === "Contact"; })
                            .catch(function () { return false; });
                    },
                    interaction: { name: "Viewed Contact Us Page" },
                    contentZones: [
                        {
                            name: "contact_us",
                            selector: function () {
                                return resolveSelectorWithFallback([".footer-contact", ".contact-form-section", "#contact"], 4000);
                            }
                        }
                    ]
                }

            ]
        };

        SalesforceInteractions.initSitemap(sitemapConfig);
    });

})();
