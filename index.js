// // capture.js
// const fs = require("fs");
// const moment = require("moment");
// const puppeteer = require("puppeteer");
// const devices = require("puppeteer/DeviceDescriptors");

// const dateTimeDescriptor = moment().format("YYYYMMDD-hhmmss");

// const captureScreenshots = async url => {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     await page.emulate({
//         userAgent:
//             "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
//         viewport: {
//             width: 1440,
//             height: 900
//         }
//     });
//     await page.goto(url);

//     const title = await page.title();

//     const screenshot = await page.screenshot({
//         // path: `screenshots/${dateTimeDescriptor}/${title}.png`,
//         fullPage: true
//     });

//     fs.writeFile(`${title}.png`, screenshot, "binary", function(err) {
//         console.error(err);
//     });

//     // const file = fs.createWriteStream(
//     //     `screenshots/${dateTimeDescriptor}/${title}.png`,
//     //     { encoding: "binary" }
//     // );

//     // screenshot.on("data", function(data) {
//     //     file.write(data.toString("binary"), "binary");
//     // });

//     await browser.close();
// };

// captureScreenshots("http://nordex.thor.testonline.be/nl-BE/");

require("./screenshot.js").init();
