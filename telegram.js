import {readFileSync} from 'fs';

const url = `https://api.telegram.org/bot{{TOKEN}}/sendMessage`;

export function sendTelegramMessage(message) {
    getEnv()
    fetch(url.replace('{{TOKEN}}', process.env['TELEGRAM_BOT_TOKEN']), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: process.env['MY_CHAT_ID'],
            text: message,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Message sent successfully!', data);
        })
        .catch((error) => {
            console.error('Error sending message:', error);
        });
}

function getEnv() {
    const envFile = readFileSync('.env', { encoding: 'utf-8' });
    const envLines = envFile.split('\n');

    envLines.forEach((line) => {
        if (line.startsWith('#'))
            return; // skip comment

        const [key, value] = line.split('=');
        process.env[key] = value;
    });
}
