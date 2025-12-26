const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
    const { user, pass, targetLink } = req.body;
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.goto('https://www.instagram.com/accounts/login/');
        
        await page.waitForSelector('input[name="username"]', { timeout: 10000 });
        await page.type('input[name="username"]', user, { delay: 100 });
        await page.type('input[name="password"]', pass, { delay: 100 });
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        const loginError = await page.$('p[role="alert"]');
        if (loginError) {
            await browser.close();
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        res.json({ success: true, message: "Login Successful" });
        await browser.close();
    } catch (e) {
        if (browser) await browser.close();
        res.status(500).json({ success: false, message: e.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server live on port ' + PORT));
