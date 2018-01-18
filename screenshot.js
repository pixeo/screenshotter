const { URL } = require("url");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const argum = require("argum");
const Sitemapper = require("sitemapper");
const moment = require("moment");

// Create
function mkdirpath(dirPath) {
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath);
        } catch (e) {
            mkdirpath(path.dirname(dirPath));
            mkdirpath(dirPath);
        }
    }
}

function delay(timeout) {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}

exports.init = function() {
    return (async function() {
        const dateTimeDescriptor = moment().format("YYYYMMDD-HHmmss");
        const saveToPath = `./screenshots/${dateTimeDescriptor}`;

        var config = {
            url: argum.get("--url", false, false),
            viewportWidth: argum.get("--viewportWidth", false, 1440),
            viewportHeight: argum.get("--viewportHeight", false, 900),
            mobile: argum.get("--mobile", false, false),
            userAgent: argum.get("--userAgent", false, false),
            pdf: argum.get("--pdf", false, false),
            mediaTypePrint: argum.get("--mediaTypePrint", false, false),
            lazyLoad: argum.get("--lazyLoad", false, false),
            sitemap: argum.get("--sitemap", false, false)
        };

        let result = {
            status: "OK"
        };

        let urls = [];

        /**
         * Logs json to the console and if required terminates the process
         *
         * @param status
         * @param message
         * @param terminate
         */
        function log(status, message, terminate) {
            result.status = status;

            if (message) {
                result.message = message;
            }

            console.log(result);

            if (terminate) {
                process.exit(terminate);
            }
        }

        /**
         * Take screenshot
         *
         * @param {*} browser
         * @param {*} url
         */
        async function takeScreenshot(page, url) {
            log(url);
            await page.goto(url).catch(function(error) {
                log("BAD", error, 1);
            });

            // attempt to load lazy load images
            if (config.lazyLoad) {
                var maxScroll = await page
                    .evaluate(function() {
                        return Promise.resolve(
                            Math.max(
                                document.body.scrollHeight,
                                document.body.offsetHeight,
                                document.documentElement.clientHeight,
                                document.documentElement.scrollHeight,
                                document.documentElement.offsetHeight
                            ) - window.innerHeight
                        );
                    })
                    .catch(function() {
                        log(
                            "BAD",
                            "Lazy load failed due to an error while getting the scroll height.",
                            1
                        );
                    });

                var fullScrolls = Math.floor(maxScroll / config.viewportHeight); // how many times full scroll needs to be done
                var lastScroll = maxScroll % config.viewportHeight; // amount left to get to the bottom of the page after doing the full scrolls

                // do full scrolls if there is any
                for (var i = 1; i <= fullScrolls; i++) {
                    await page
                        .evaluate(
                            function(i, viewportHeight) {
                                return Promise.resolve(
                                    window.scrollTo(0, i * viewportHeight)
                                );
                            },
                            i,
                            config.viewportHeight
                        )
                        .catch(function() {
                            result.status = "BAD";
                            result.message =
                                "Promise rejected while scrolling for lazy load images.";
                        });

                    await delay(500);
                }

                // do last scroll if there is any
                if (lastScroll > 0) {
                    await page
                        .evaluate(function(maxScroll) {
                            return Promise.resolve(
                                window.scrollTo(0, maxScroll + 25)
                            );
                        }, maxScroll)
                        .catch(() => {
                            result.status = "BAD";
                            result.message =
                                "Promise rejected while last scrolling for lazy load images.";
                        });
                }
            }

            const myUrl = new URL(url);

            const title = `${myUrl.pathname.replace(
                /\//g,
                "|"
            )} - ${await page.title()}`;
            const screenshotType = "jpeg";
            const screenshotQuality = 66;
            mkdirpath(saveToPath);

            if (config.pdf) {
                // save pdf
                await page.screenshot({
                    quality: screenshotQuality,
                    type: screenshotType,
                    path: `${saveToPath}/${title}.${screenshotType}`,
                    fullPage: true
                });
            } else {
                // save screenshot
                await page.screenshot({
                    quality: screenshotQuality,
                    type: screenshotType,
                    path: `${saveToPath}/${title}.${screenshotType}`,
                    fullPage: true
                });
            }

            result.title = title;
            log(result);
        }

        /**
         * Init
         */

        if (config.sitemap) {
            var website = new Sitemapper({
                url: config.sitemap
            });
            const sitemapResponse = await website.fetch();
            urls = await sitemapResponse.sites;
        } else {
            urls.push(config.url);
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // set the media type
        if (config.mediaTypePrint) {
            await page.emulateMedia("print");
        } else {
            await page.emulateMedia("screen");
        }

        // set the user agent if one is provided
        if (config.userAgent) {
            await page.setUserAgent(config.userAgent);
        }

        if (config.mobile) {
            // set user agent to be as Chrome 60 for Android
            await page.setUserAgent(
                "Mozilla/5.0 (Linux; Android 5.1; XT1039 Build/LPBS23.13-17.6-1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.116 Mobile Safari/537.36"
            );

            // set mobile viewport
            await page.setViewport({ width: 320, height: 480 });
        } else {
            await page.setViewport({
                width: parseInt(config.viewportWidth),
                height: parseInt(config.viewportHeight)
            }); // set default view port size
        }

        for (let index = 0; index < urls.length; index++) {
            await takeScreenshot(page, urls[index]);
        }

        await browser.close();
    })();
};
