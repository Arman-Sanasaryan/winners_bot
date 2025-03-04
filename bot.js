require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const WALLET = process.env.BINANCE_WALLET;

// Основная клавиатура с кнопкой /start
const startKeyboard = {
    reply_markup: {
        keyboard: [
            [{ text: "Start" }]
        ],
        resize_keyboard: true, // Уменьшает размер клавиатуры для удобства
        one_time_keyboard: false, // Клавиатура будет оставаться видимой
    }
};

// command /START
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(
        msg.chat.id,
        `👋 Hello! Welcome to our platform! I accept payments in USDT (TRC20). Please choose a course to proceed. Here are the available options:\n\n` +
        `1. Calculator - 10 USDT\n   🔑 Access to our crypto trading calculator.\n\n` +
        `2. Online Lessons - 200 USDT\n   📚 Includes lessons on how to use the calculator and other important features. Step-by-step instructions and training materials.\n`,
        {
            ...startKeyboard, // Добавляем кнопку старта
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Calculator - 10 USDT", callback_data: "calculator" },
                        { text: "Online Lessons - 200 USDT", callback_data: "online_lessons" }
                    ]
                ]
            }
        }
    );
});

// Реакция на кнопку "Start"
bot.on('message', (msg) => {
    if (msg.text === 'Start') {
        bot.sendMessage(
            msg.chat.id,
            `👋 Hello! Welcome to our platform! Please choose a course to proceed. Here are the available options:\n\n` +
            `1. Calculator - 10 USDT\n   🔑 Access to our crypto trading calculator.\n\n` +
            `2. Online Lessons - 200 USDT\n   📚 Includes lessons on how to use the calculator and other important features. Step-by-step instructions and training materials.\n`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Calculator - 10 USDT", callback_data: "calculator" },
                            { text: "Online Lessons - 200 USDT", callback_data: "online_lessons" }
                        ]
                    ]
                }
            }
        );
    }
});

// Payment check
async function checkPayment(walletAddress, amount) {
    try {
        const url = `https://apilist.tronscan.org/api/transaction?address=${walletAddress}`;
        const response = await axios.get(url);
        const transactions = response.data.data;

        for (let tx of transactions) {
            if (
                tx.contractData.to_address === walletAddress &&
                tx.contractData.amount / 1e6 >= amount
            ) {
                return true; // found payment
            }
        }
        return false;
    } catch (error) {
        console.error("Error checking transaction:", error);
        return false;
    }
}

// Handle course selection
bot.on('callback_query', async (query) => {
    const course = query.data;
    let coursePrice;
    
    if (course === 'calculator') {
        coursePrice = 10;
        bot.sendMessage(
            query.message.chat.id,
            `🎓 You selected the "Calculator" course (10 USDT). \n\n` +
            `🔑 This gives you access to our crypto trading calculator.\n\n` +
            `💳 Please send 10 USDT (TRC20) to the following address:\n\n` +
            `After payment, enter /check to verify your payment.`,
        );
        bot.sendMessage(
            query.message.chat.id,
            `${WALLET}\n\n`,
            startKeyboard // Добавляем кнопку старта
        );
    } else if (course === 'online_lessons') {
        coursePrice = 200;
        bot.sendMessage(
            query.message.chat.id,
            `🎓 You selected the "Online Lessons" course (200 USDT). \n\n` +
            `📚 This course includes lessons on how to use the calculator and other important features. Step-by-step instructions and training materials.\n\n` +
            `💳 Please send 200 USDT (TRC20) to the following address:\n\n` +
            `After payment, enter /check to verify your payment.`,
            startKeyboard // Добавляем кнопку старта
        );
        bot.sendMessage(
            query.message.chat.id,
            `${WALLET}\n\n`,
            startKeyboard // Добавляем кнопку старта
        );
    }
});

// /CHECK command
bot.onText(/\/check/, async (msg) => {
    const paid = await checkPayment(WALLET, 10); // You can adjust this for the specific course price if needed

    if (paid) {
        bot.sendMessage(
            msg.chat.id,
            `✅ Payment received! Access to the course has been granted.`,
            startKeyboard // Добавляем кнопку старта
        );
    } else {
        bot.sendMessage(
            msg.chat.id,
            `❌ Payment not found. Please check the amount and network (TRC20).`,
            startKeyboard // Добавляем кнопку старта
        );
    }
});
