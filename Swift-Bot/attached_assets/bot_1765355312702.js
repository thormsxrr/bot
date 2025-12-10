// Add crypto polyfill FIRST
globalThis.crypto = require('crypto');
const crypto = require('crypto');
const { makeWASocket, useMultiFileAuthState, delay, isJidGroup, jidNormalizedUser } = require("@whiskeysockets/baileys");
const qrcode = require('qrcode-terminal'); // Add QR code terminal display
const fs = require('fs');
const path = require('path');

// === CONFIG ===
const DATA_FILE = 'bot_state.json';
const DEFAULT_SUFFIX = "";
const RESPONSES = [
    "chup rndy tmkb",
    "bhggg bsdk",
    "🗣️abe jhatu maa chuda",
    "👂ha to maa chuda",
    "📬 bhaag mt kuttiya ke beej"
];
const ADMIN_NUMBERS = ["918881207220", "918581952145","916299336702"];
const EMOJIS = ['🚀','🔥','💥','✨','🌟','💫','🌪️','🌈','⚡','❄️','💦','🍃','🌊','🔮','🎭','🎪','🎯','🎰','🧩','🪄'];

// === USER AGENT ROTATION ===
const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
];

let state = {
    groupStates: {},
    suffix: DEFAULT_SUFFIX,
    admins: ADMIN_NUMBERS
};

// === LOAD STATE ===
if (fs.existsSync(DATA_FILE)) {
    state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}
state.admins = ADMIN_NUMBERS;

function saveState() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

// === CLIENT MANAGEMENT ===
let sock;
let restartCount = 0;
const MAX_RESTARTS = 10;
const RESTART_DELAY = 10000;
const MAX_RESTART_DELAY = 300000; // 5 minutes
const nameChangeControllers = {};
const spamIntervals = {};
let currentUserAgent = USER_AGENTS[0];
let userAgentRotationTimer;
let isConnected = false;

async function initClient() {
    // Clean up any existing rotation timer
    if (userAgentRotationTimer) {
        clearTimeout(userAgentRotationTimer);
        userAgentRotationTimer = null;
    }
    
    const { state: authState, saveCreds } = await useMultiFileAuthState('baileys_auth');

    // Rotate user agent
    currentUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    console.log(`🔄 Using User Agent: ${currentUserAgent.substring(0, 60)}...`);

    sock = makeWASocket({
        auth: authState,
        printQRInTerminal: false, // Disable built-in QR handling
        browser: ["Chrome", "Windows", "10.0.0"],
        syncFullHistory: false,
        mobile: false,
        getMessage: async () => undefined,
        userAgent: currentUserAgent
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        
        // Handle QR code display
        if (qr) {
            console.log('╔════════════════════════════════════════════════╗');
            console.log('║                SCAN QR CODE BELOW               ║');
            console.log('╚════════════════════════════════════════════════╝');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') restartClient();
        if (connection === 'open') onReady();
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', onMessage);
    
    // Anti-detection heartbeat
    setInterval(() => {
        if (sock && isConnected) sock.sendPresenceUpdate('available');
    }, 60000);
    
    // Schedule user agent rotation every 60 minutes
    userAgentRotationTimer = setTimeout(rotateUserAgent, 60 * 60 * 1000);
}

async function rotateUserAgent() {
    console.log('🔄 Rotating User Agent...');
    try {
        cleanupResources();
        if (sock) {
            await sock.end();
            sock = null;
        }
        initClient();
    } catch (err) {
        console.error('User Agent rotation failed:', err);
        restartClient();
    }
}

async function onReady() {
    isConnected = true;
    const botNumber = sock.user.id.split(':')[0].replace('+', '');
    console.log('✅ Bot is ready as:', botNumber);
    
    if (!state.admins.includes(botNumber)) {
        state.admins.push(botNumber);
    }
    restartCount = 0;
    
    // Restart group activities after reconnect
    restartGroupActivities();
    saveState();
}

// === ACTIVITY RESTART ===
function restartGroupActivities() {
    console.log('♻️ Restarting group activities');
    Object.entries(state.groupStates).forEach(([groupId, groupState]) => {
        if (groupState.spamming && groupState.spamParams) {
            const { message, minDelay, maxDelay } = groupState.spamParams;
            startSpamming(groupId, message, minDelay, maxDelay);
        }
        if (groupState.nameChanging && groupState.nameChangeBase) {
            startNameChanging(groupId, groupState.nameChangeBase);
        }
    });
}

// === OPTIMIZED NAME CHANGE WITH INTERVAL ===
async function startNameChanging(groupId, baseName) {
    stopNameChanging(groupId);
    
    const controller = { running: true };
    nameChangeControllers[groupId] = controller;
    
    if (state.groupStates[groupId]) {
        state.groupStates[groupId].nameChanging = true;
        state.groupStates[groupId].nameChangeBase = baseName;
        saveState();
    }
    
    const changeName = async () => {
        if (!controller?.running) return;
        
        try {
            const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            // Fire and forget for speed - don't await
            sock.groupUpdateSubject(groupId, `${baseName}${randomEmoji}`).catch(err => {
                // Silently handle rate limits to keep it smooth
                if (!err.message?.includes('rate-overlimit')) {
                   console.error('Name change error:', err);
                }
            });
        } catch (err) {
            console.error('Name change loop error:', err);
        }
    };
    
    // ULTRA FAST MODE: 50ms interval (10x speed)
    const intervalId = setInterval(changeName, 50);
    controller.intervalId = intervalId;
}

function stopNameChanging(groupId) {
    if (nameChangeControllers[groupId]) {
        clearInterval(nameChangeControllers[groupId].intervalId);
        nameChangeControllers[groupId].running = false;
        delete nameChangeControllers[groupId];
    }
    if (state.groupStates[groupId]) {
        state.groupStates[groupId].nameChanging = false;
        saveState();
    }
}

// === SPAM FUNCTION ===
function startSpamming(groupId, message, minDelay, maxDelay) {
    stopSpamming(groupId);
    
    // Store spam parameters in state
    if (state.groupStates[groupId]) {
        state.groupStates[groupId].spamming = true;
        state.groupStates[groupId].spamParams = { message, minDelay, maxDelay };
        saveState();
    }

    const sendSpam = async () => {
        if (!spamIntervals[groupId]) return;
        
        try {
            await sock.sendMessage(groupId, { text: message });
        } catch (err) {
            console.error('Spam error:', err);
        }
    };
    
    // Calculate initial delay and interval
    const initialDelay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    const interval = minDelay + Math.floor((maxDelay - minDelay) / 2);
    
    setTimeout(() => {
        sendSpam();
        spamIntervals[groupId] = setInterval(sendSpam, interval * 1000);
    }, initialDelay * 1000);
}

function stopSpamming(groupId) {
    if (spamIntervals[groupId]) {
        clearInterval(spamIntervals[groupId]);
        delete spamIntervals[groupId];
    }
    
    if (state.groupStates[groupId]) {
        state.groupStates[groupId].spamming = false;
        state.groupStates[groupId].spamParams = null;
        saveState();
    }
}

// === MESSAGE HANDLER ===
async function onMessage({ messages }) {
    if (!isConnected) return;
    
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    
    const isGroup = isJidGroup(msg.key.remoteJid);
    const groupId = isGroup ? msg.key.remoteJid : null;
    const senderNum = jidNormalizedUser(msg.key.participant || msg.key.remoteJid).split('@')[0].replace('+', '');
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log(`📥 [${isGroup ? 'GROUP' : 'PV'}] ${senderNum}: ${text}`);
    
    // Group state initialization
    if (isGroup && !state.groupStates[groupId]) {
        state.groupStates[groupId] = {
            active: false,
            allowedUsers: [],
            replyAll: false,
            subadmins: [],
            nameChanging: false,
            spamming: false,
            spamParams: null,
            nameChangeBase: ""
        };
        saveState();
    }
    
    const groupState = isGroup ? state.groupStates[groupId] : null;
    
    // === COMMAND HANDLING ===
    if (isGroup && text.startsWith('/')) {
        const isAdmin = state.admins.includes(senderNum);
        const isSubadmin = groupState && groupState.subadmins.includes(senderNum);
        const adminOnlyCommands = ['/reset', '/subadmin', '/stopchanging'];
        
        const command = text.trim().split(' ')[0].toLowerCase();
        const canExecute = isAdmin || (isSubadmin && !adminOnlyCommands.includes(command));
        
        if (!canExecute) return;
        
        const parts = text.trim().split(' ');
        let arg = parts[1] ? parts[1].replace('@', '').trim() : null;
        
        try {
            switch (command) {
                case '/start':
                    groupState.active = true;
                    await reply(msg, '🟢 Bot activated');
                    break;
                    
                case '/stop':
                    groupState.active = false;
                    stopNameChanging(groupId);
                    stopSpamming(groupId);
                    await reply(msg, '🔴 Bot deactivated');
                    break;
                    
                case '/subadmin':
                    if (arg && !groupState.subadmins.includes(arg)) {
                        groupState.subadmins.push(arg);
                        await reply(msg, `✅ Added subadmin: ${arg}`);
                    }
                    break;
                    
                case '/remove':
                    if (arg && groupState.subadmins.includes(arg)) {
                        groupState.subadmins = groupState.subadmins.filter(n => n !== arg);
                        await reply(msg, `✅ Removed subadmin: ${arg}`);
                    }
                    break;
                    
                case '/target':
                    if (arg && !groupState.allowedUsers.includes(arg)) {
                        groupState.allowedUsers.push(arg);
                    }
                    groupState.replyAll = false;
                    await reply(msg, `🎯 Added target: ${arg}`);
                    break;
                    
                case '/block':
                    if (arg && groupState.allowedUsers.includes(arg)) {
                        groupState.allowedUsers = groupState.allowedUsers.filter(n => n !== arg);
                        await reply(msg, `🚫 Blocked user: ${arg}`);
                    }
                    break;
                    
                case '/reset':
                    groupState.active = false;
                    groupState.allowedUsers = [];
                    groupState.replyAll = false;
                    groupState.subadmins = [];
                    stopNameChanging(groupId);
                    stopSpamming(groupId);
                    await reply(msg, '🔄 Bot state reset');
                    break;
                    
                case '/changename':
                    const newName = text.split(' ').slice(1).join(' ').trim();
                    if (newName) {
                        await sock.groupUpdateSubject(groupId, newName);
                        await reply(msg, `✅ Name changed to: ${newName}`);
                    }
                    break;
                    
                case '/startchanging':
                    const baseName = text.split(' ').slice(1).join(' ').trim();
                    if (baseName) {
                        startNameChanging(groupId, baseName);
                        await reply(msg, `🌀 Started name changing`);
                    }
                    break;
                    
                case '/stopchanging':
                    stopNameChanging(groupId);
                    await reply(msg, '⏹️ Stopped name changing');
                    break;
                    
                case '/replyall':
                    groupState.replyAll = true;
                    await reply(msg, '🌍 Replying to everyone');
                    break;
                    
                case '/suffix':
                    const suffixText = text.split(' ').slice(1).join(' ').replace(/@/g, '');
                    state.suffix = suffixText;
                    await reply(msg, `✏️ Suffix: ${state.suffix || "None"}`);
                    break;
                    
                case '/spam':
                    const spamParts = text.split('"');
                    if (spamParts.length < 3) break;
                    
                    const spamMessage = spamParts[1];
                    const delayPart = spamParts[2].trim();
                    const delayMatch = delayPart.match(/(\d+)\s*,\s*(\d+)/);
                    
                    if (delayMatch) {
                        const minDelay = parseInt(delayMatch[1]);
                        const maxDelay = parseInt(delayMatch[2]);
                        
                        if (minDelay >= 1 && maxDelay >= minDelay) {
                            startSpamming(groupId, spamMessage, minDelay, maxDelay);
                            await reply(msg, `🔫 Spamming started`);
                        }
                    }
                    break;
                    
                case '/stopspam':
                    stopSpamming(groupId);
                    await reply(msg, '🛑 Spamming stopped');
                    break;
            }
            saveState();
        } catch (err) {
            console.error('Command error:', err);
        }
        return;
    }
    
    // === QUOTED REPLY HANDLING ===
    if (isGroup && groupState?.active) {
        if (msg.key.fromMe) return;

        const shouldReply = groupState.replyAll || groupState.allowedUsers.includes(senderNum);
        
        if (shouldReply) {
            try {
                const randomResponse = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
                const replyText = randomResponse + (state.suffix || '');
                
                await sock.sendMessage(
                    msg.key.remoteJid, 
                    { text: replyText },
                    { quoted: msg }
                );
                
                console.log(`💬 Replied to ${senderNum} in group`);
            } catch (err) {
                console.error('Reply error:', err);
            }
        }
    }
}

// === REPLY FUNCTION ===
async function reply(originalMsg, text) {
    await sock.sendMessage(
        originalMsg.key.remoteJid, 
        { text: text },
        { quoted: originalMsg }
    );
}

// === RESTART MECHANISM ===
function cleanupResources() {
    isConnected = false;
    
    // Stop all name changing
    Object.entries(nameChangeControllers).forEach(([groupId, controller]) => {
        controller.running = false;
        clearInterval(controller.intervalId);
    });
    
    // Clear all spam intervals
    Object.values(spamIntervals).forEach(intervalId => {
        clearInterval(intervalId);
    });
    
    // Clear user agent rotation timer
    if (userAgentRotationTimer) {
        clearTimeout(userAgentRotationTimer);
        userAgentRotationTimer = null;
    }
}

function restartClient() {
    cleanupResources();
    
    if (restartCount < MAX_RESTARTS) {
        restartCount++;
        const delayTime = Math.min(RESTART_DELAY * Math.pow(2, restartCount), MAX_RESTART_DELAY);
        console.log(`♻️ Restarting in ${Math.round(delayTime/1000)}s (${restartCount}/${MAX_RESTARTS})`);
        setTimeout(initClient, delayTime);
    } else {
        console.error('🚨 Max restarts reached');
        process.exit(1);
    }
}

// === GLOBAL ERROR HANDLING ===
process.on('unhandledRejection', (err) => {
    console.error('🚨 Unhandled Rejection:', err);
    restartClient();
});

process.on('uncaughtException', (err) => {
    console.error('🚨 Uncaught Exception:', err);
    restartClient();
});

// Start the bot
initClient();