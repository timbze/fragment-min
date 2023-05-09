import {readFileSync, writeFileSync} from 'fs';

const url = `https://api.telegram.org/bot{{TOKEN}}/sendMessage`;

export function sendTelegramMessage(message, sendWithoutSound = false) {
    fetch(url.replace('{{TOKEN}}', process.env['TELEGRAM_BOT_TOKEN']), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: process.env['MY_CHAT_ID'],
            text: message,
            disable_notification: sendWithoutSound,
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

export async function getTelegramUpdates() {
    const messages = (await (await fetch(`https://api.telegram.org/bot${process.env['TELEGRAM_BOT_TOKEN']}/getUpdates?offset=${process.env['LAST_UPDATE_ID']}`)).json()).result

    // const messages = data.result;
    const messagesFromChat = messages.filter(message => {
        return String(message.message.chat.id) === process.env['MY_CHAT_ID'];
    });

    messagesFromChat.forEach(message => {
        if (!isNaN(message.message.text)){
            saveEnv('LOW', message.message.text)
            sendTelegramMessage(`Low price set to ${message.message.text} TON`, true)
        }
    })

    if (messages.length > 0) {
        saveEnv('LAST_UPDATE_ID', messages[messages.length - 1].update_id + 1)
    }
}

export function getEnv() {
    const envFile = readFileSync('.env', { encoding: 'utf-8' });
    const envLines = envFile.split('\n');

    envLines.forEach((line) => {
        if (line.startsWith('#'))
            return; // skip comment

        const [key, value] = line.split('=');
        process.env[key] = value;
    });
}

function saveEnv(key, value) {
    const envFile = readFileSync('.env', { encoding: 'utf-8' });
    const envLines = envFile.split('\n');

    const newEnvLines = envLines.map((line) => {
        if (line.startsWith('#')) return line; // keep comment

        const [existingKey, existingValue] = line.split('=');

        if (existingKey === key) {
            return `${key}=${value}`;
        } else {
            return line;
        }
    });

    // If the key doesn't exist, add it
    if (!newEnvLines.some(line => line.startsWith(`${key}=`))) {
        newEnvLines.push(`${key}=${value}`);
    }

    const newEnvFile = newEnvLines.join('\n');
    writeFileSync('.env', newEnvFile, { encoding: 'utf-8' });
    process.env[key] = value;
}
