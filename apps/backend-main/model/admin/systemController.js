const asyncHandler = require('../../utils/asyncHandler');
const db = require('../../config/db');
const redis = require('../../config/redis');
const amqp = require('amqplib');
const axios = require('axios');
require('dotenv').config();

const RABBIT_URL = process.env.RABBIT_URL || "amqp://admin:admin@10.3.36.17:5672";
const FUNASR_URL = "http://127.0.0.1:8766"; // Assuming local or reachable

exports.getSystemHealth = asyncHandler(async (req, res) => {
    const health = {
        mysql: 'down',
        redis: 'down',
        rabbitmq: 'down',
        funasr: 'down',
        timestamp: new Date()
    };

    // Check MySQL
    try {
        await new Promise((resolve, reject) => {
            db.ping((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        health.mysql = 'up';
    } catch (e) {
        health.mysql_error = e.message;
    }

    // Check Redis
    try {
        if (redis.status === 'ready') {
            health.redis = 'up';
        } else {
            health.redis = redis.status;
        }
    } catch (e) {
        health.redis_error = e.message;
    }

    // Check RabbitMQ
    try {
        const connection = await amqp.connect(RABBIT_URL);
        health.rabbitmq = 'up';
        await connection.close();
    } catch (e) {
        health.rabbitmq_error = e.message;
    }

    // Check FunASR
    try {
        // FunASR doesn't have a standard health endpoint usually, but we can try root or docs
        await axios.get(FUNASR_URL, { timeout: 2000 });
        health.funasr = 'up';
    } catch (e) {
         // If it returns 404 but connects, it's technically up.
         if (e.response) health.funasr = 'up'; // Connected but error response
         else health.funasr_error = e.message;
    }

    res.json({
        code: 200,
        message: 'System health check',
        data: health
    });
});
