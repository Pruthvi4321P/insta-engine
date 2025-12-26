const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
    const { user, pass } = req.body;
    let browser;
    try {
        console.log("Starting browser...");
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        });
        const page = await browser.newPage();
        
        // FIXED URL - No brackets
        await page.goto('[https://www.instagram.com/accounts/login/](https://www.instagram.com/accounts/login/)', { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        console.log("Typing credentials...");
        await page.waitForSelector('input[name="username"]', { timeout: 15000 });
        await page.type('input[name="username"]', user, { delay: 100 });
        await page.type('input[name="password"]', pass, { delay: 100 });
        
        await Promise.all([
            page.click('button[type="submit"]'),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }),
        ]);
        
        const loginError = await page.$('p[role="alert"]');
        if (loginError) {
            const errorMsg = await page.evaluate(el => el.textContent, loginError);
            await browser.close();
            return res.status(401).json({ success: false, message: errorMsg });
        }

        console.log("Login Successful for: " + user);
        res.json({ success: true, message: "Login Successful" });
        await browser.close();
    } catch (e) {
        console.error("Error:", e.message);
        if (browser) await browser.close();
        res.status(500).json({ success: false, message: "Engine Error: " + e.message });
    }
});

// Root route to check if server is alive
app.get('/', (req, res) => res.send("Insta-Engine is running!"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Server live on port ' + PORT));
