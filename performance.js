#!/usr/bin/env node

const DatabaseHandler = require('./db/DatabaseHandler');
const authenticator = require('./coco/authenticator');
const client = require('./coco/client');
const verifier = require('./coco/verifier');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');

async function yap() {
    const usernames = ['coco', 'wine', 'violet', 'jesus', 'skibidi_toilet'];
    const passwords = ['sus2020', 'emo15', 'famboii22', 'christ4ever', 'emo15'];
    const someIDs = ['macbookpro', 'asus', 'android', 'blackberry', 'hp'];
    const new_usernames = ['bogota', 'buriburi', 'hello_kitty', 'crumbled_bread', 'sir_lenon'];
    const new_passwords = ['heelo', 'hejjjjlo', 'heluulo', 'helll', 'helll'];

    const globalStorage = {};
    const globalDB = new DatabaseHandler('inMemory', globalStorage);

    const logPerformance = async (label, operation) => {
        const start = process.hrtime.bigint();
        try {
            await operation();
        } catch (err) {
            console.error(`❌ ${label} failed:`, err);
        }
        const end = process.hrtime.bigint();
        return Number(end - start) / 1e6; // Convert to milliseconds
    };

    const performanceData = {};
    const m = 120; // Number of repetitions for averaging

    for (let n = 1; n <= 5; n += 1) {
        console.log(`\n--- Running Evaluation for n=${n} Authenticators ---`);
        const taskAverages = {};

        for (let repeat = 0; repeat < m; repeat++) {
            console.log(`Run ${repeat + 1} of ${m}`);
            const localVerifierDB = new DatabaseHandler('inMemory', {});
            const verifierAPI = verifier(localVerifierDB, globalDB);

            const authAPIs = [];
            const apiMap = { verifierAPI };

            for (let i = 0; i < n; i++) {
                const authDB = new DatabaseHandler('inMemory', {});
                const authAPI = authenticator(authDB, globalDB);
                authAPIs.push(`auth${i + 1}API`);
                apiMap[`auth${i + 1}API`] = authAPI;
            }

            const localClientDB = new DatabaseHandler('inMemory', {});
            const clientAPI = client(localClientDB, apiMap, ['verifierAPI'], authAPIs);

            const tasks = [
                { label: 'Register', fn: () => clientAPI.register(usernames[0], passwords[0], someIDs[0]) },
                { label: 'Login', fn: () => clientAPI.login(usernames[0], passwords[0], someIDs[0]) },
                { label: 'Credential Login', fn: () => clientAPI.credentialLogin(usernames[0]) },
                { label: 'Update Username', fn: () => clientAPI.updateUsername(usernames[0], passwords[0], new_usernames[0], someIDs[0]) },
                { label: 'Update Password', fn: () => clientAPI.updatePassword(new_usernames[0], passwords[0], new_passwords[0], someIDs[0]) },
                { label: 'Set Next Factor', fn: () => clientAPI.setNextFactor(new_usernames[0], new_passwords[0], passwords[0], someIDs[0]) },
                { label: 'Delete', fn: () => clientAPI.delete(new_usernames[0], new_passwords[0], passwords[0], someIDs[0]) },
            ];

            for (const { label, fn } of tasks) {
                const executionTime = await logPerformance(label, fn);
                if (!taskAverages[label]) taskAverages[label] = [];
                taskAverages[label].push(executionTime);
            }
        }

        // Calculate averages for each task
        for (const label in taskAverages) {
            const times = taskAverages[label];
            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            if (!performanceData[label]) performanceData[label] = [];
            performanceData[label].push({ n, time: avgTime });
        }
    }

    const complexityResults = analyzePerformance(performanceData);
    await createVisualization(performanceData, complexityResults);
    outputResultsTable(complexityResults);
}

function analyzePerformance(performanceData) {
    const complexityResults = {};

    for (const [task, data] of Object.entries(performanceData)) {
        const trends = { constant: [], linear: [], quadratic: [], cubic: [] };

        data.forEach(({ n, time }) => {
            trends.constant.push(time);
            trends.linear.push(time / n);
            trends.quadratic.push(time / Math.pow(n, 2));
            trends.cubic.push(time / Math.pow(n, 3));
        });

        const complexities = Object.entries(trends).map(([key, values]) => {
            const variance = computeVariance(values);
            const stdDev = Math.sqrt(variance);
            return { complexity: key, variance, stdDev };
        });

        const bestFit = complexities.sort((a, b) => a.variance - b.variance)[0];
        complexityResults[task] = {
            complexity: `O(${bestFit.complexity})`,
            stdDev: bestFit.stdDev.toFixed(2),
        };

        // Log standard deviation for all trends
        complexities.forEach(({ complexity, stdDev }) => {
            console.log(`${task}: O(${complexity}) - Std Dev: ${stdDev.toFixed(2)} ms`);
        });
    }

    return complexityResults;
}

function computeVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
}

async function createVisualization(performanceData, complexityResults) {
    const width = 1200;
    const height = 800;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const datasets = Object.entries(performanceData).map(([task, data]) => {
        const times = data.map((entry) => entry.time);
        const labels = data.map(({ n, time }) => `n=${n}, time=${time.toFixed(2)}ms`);
        return {
            label: `${task} (${complexityResults[task]?.complexity || 'Unknown'})`,
            data: times,
            borderColor: getRandomColor(),
            fill: false,
            pointBackgroundColor: 'rgba(0,0,0,0.5)',
            pointHoverRadius: 8,
        };
    });

    const labels = performanceData[Object.keys(performanceData)[0]].map((entry) => entry.n);
    const configuration = {
        type: 'line',
        data: { labels, datasets },
        options: {
            plugins: {
                title: { display: true, text: 'Performance Trends for All Tasks' },
                tooltip: {
                    callbacks: {
                        label: function (tooltipItem) {
                            const { dataset, dataIndex } = tooltipItem;
                            const n = labels[dataIndex];
                            const time = dataset.data[dataIndex];
                            return `${dataset.label.split('(')[0].trim()} | n=${n} | time=${time.toFixed(2)} ms`;
                        },
                    },
                },
            },
            scales: {
                x: { title: { display: true, text: 'Number of Authenticators (n)' }, ticks: { stepSize: 1 } },
                y: { title: { display: true, text: 'Execution Time (ms)' }, beginAtZero: true },
            },
        },
    };

    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    fs.writeFileSync('performance_all_tasks.png', imageBuffer);
    console.log('Saved all tasks chart as "performance_all_tasks.png".');
}

function outputResultsTable(complexityResults) {
    console.log('\n--- Results Table ---');
    console.log('| Task Name          | Time Complexity | Std Dev (ms) |');
    console.log('|--------------------|-----------------|--------------|');
    for (const [task, { complexity, stdDev }] of Object.entries(complexityResults)) {
        console.log(`| ${task.padEnd(18)} | ${complexity.padEnd(15)} | ${stdDev.padEnd(12)} |`);
    }
    console.log('---------------------------------------------');
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r}, ${g}, ${b})`;
}

(async () => {
    await yap();
})();
