/**
 * Logger Utility for Server
 * Standardized logging with ANSI colors for better readability
 */
import { parentPort } from 'worker_threads';

const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    
    fg: {
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        magenta: "\x1b[35m",
        cyan: "\x1b[36m",
        white: "\x1b[37m",
        gray: "\x1b[90m"
    },
    bg: {
        red: "\x1b[41m",
        green: "\x1b[42m",
        yellow: "\x1b[43m",
        blue: "\x1b[44m",
        magenta: "\x1b[45m",
        cyan: "\x1b[46m",
        white: "\x1b[47m"
    }
};

const getTimestamp = () => {
    return `${colors.fg.gray}[${new Date().toLocaleTimeString()}]${colors.reset}`;
};

const sendToParent = (level, context, message) => {
    if (parentPort) {
        parentPort.postMessage({
            type: 'instance-log',
            level,
            context,
            message,
            timestamp: new Date().toISOString()
        });
    }
};

export const logger = {
    info: (context, message, ...args) => {
        console.log(`${getTimestamp()} ${colors.fg.cyan}[${context}]${colors.reset} ${message}`, ...args);
        sendToParent('info', context, message);
    },
    success: (context, message, ...args) => {
        console.log(`${getTimestamp()} ${colors.fg.green}${colors.bright}[${context}]${colors.reset} ${colors.fg.green}${message}${colors.reset}`, ...args);
        sendToParent('success', context, message);
    },
    warn: (context, message, ...args) => {
        console.warn(`${getTimestamp()} ${colors.fg.yellow}[${context}]${colors.reset} ${colors.fg.yellow}${message}${colors.reset}`, ...args);
        sendToParent('warn', context, message);
    },
    error: (context, message, error = null, ...args) => {
        console.error(`${getTimestamp()} ${colors.bg.red}${colors.fg.white}${colors.bright} [${context}] ERROR ${colors.reset} ${colors.fg.red}${message}${colors.reset}`, ...args);
        if (error) {
            console.error(`${colors.fg.red}${error.stack || error}${colors.reset}`);
        }
        sendToParent('error', context, message);
    },
    debug: (context, message, ...args) => {
        if (process.env.DEBUG === 'true') {
            console.log(`${getTimestamp()} ${colors.fg.magenta}[DEBUG:${context}]${colors.reset} ${colors.dim}${message}${colors.reset}`, ...args);
        }
    },
    socket: (socketId, event, data) => {
        console.log(`${getTimestamp()} ${colors.fg.blue}[SOCKET]${colors.reset} ${colors.fg.gray}${socketId}${colors.reset} ${colors.bright}→${colors.reset} ${colors.fg.magenta}${event}${colors.reset}`, data || '');
    },
    worker: (id, message, type = 'info') => {
        const color = type === 'error' ? colors.fg.red : (type === 'success' ? colors.fg.green : colors.fg.cyan);
        console.log(`${getTimestamp()} ${color}[WORKER:${id.slice(0, 6)}]${colors.reset} ${message}`);
        sendToParent(type, `WORKER:${id.slice(0, 6)}`, message);
    },
    bot: (instanceName, direction, message) => {
        const dirIcon = direction === 'in' ? '📩' : '🤖';
        const dirColor = direction === 'in' ? colors.fg.yellow : colors.fg.green;
        console.log(`${getTimestamp()} ${colors.fg.blue}[${instanceName}]${colors.reset} ${dirIcon} ${dirColor}${message}${colors.reset}`);
        
        // Use a special level for bot messages to style them differently
        sendToParent(direction === 'in' ? 'bot-in' : 'bot-out', instanceName, message);
    }
};

export default logger;
