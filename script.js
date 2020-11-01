const puppeteer = require('puppeteer');
const cheerio = require("cheerio");
const nodemailer = require('nodemailer');

// These need to be configured
const postId = '';
const senderEmail = '';
const subStackPassword = '';
const emailSubject = '';
const emailText = '';

async function scrollToBottom() {
    await new Promise(resolve => {
        const distance = 100; // should be less than or equal to window.innerHeight
        const delay = 100;
        const timer = setInterval(() => {
            document.scrollingElement.scrollBy(0, distance);
            if (document.scrollingElement.scrollTop + window.innerHeight >= document.scrollingElement.scrollHeight) {
                clearInterval(timer);
                resolve();
            }
        }, delay);
    });
}

const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
        user: '',
        pass: ''
    }
});

const sendEmail = async (email) => {
    var mailOptions = {
        from: senderEmail,
        to: email,
        subject: emailSubject,
        text: emailText
    };
    try {
        const result = await transporter.sendMail(mailOptions);
        console.log(result);
    } catch (e) {
        console.log('error sending mail');
        console.log(e);
    }
}

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(`https://substack.com/account/login?redirect=%2F&senderEmail=&with_password=`);
    await page.click('a.login-option');
    await page.type('input[type="email"]', senderEmail);
    await page.type('input[type="password"]', subStackPassword);
    await page.click('button[type="submit"]');
    await page.waitFor(3000);
    await page.goto(`https://rephrased.substack.com/publish/${postId}/recipients`);
    await page.waitFor(3000);
    await page.evaluate(scrollToBottom);
    await page.waitFor(3000);
    const data = await page.evaluate(() => document.querySelector('*').outerHTML);
    const $ = cheerio.load(data);
    const emails = [];
    const openCount = [];
    $("table tr td.opener-email").each((index, element) => {
        const email = $(element).text().trim();
        emails.push(email);
    });

    $("table tr td.opener-opens").each((index, element) => {
        const count = $(element).text().trim();
        openCount.push(count);
    });

    for (let index = 0; index < emails.length; index++) {
        const email = emails[index];
        const count = openCount[index];

        if(parseInt(count) < 1){
            console.log('will send email to ', email);
            await sendEmail(email);
        }

    }

    await browser.close();
})();