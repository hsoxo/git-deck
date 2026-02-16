#!/usr/bin/env node

/**
 * Git GUI Web Server
 * 在远程服务器上运行，通过浏览器访问
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;

function exec(command) {
    try {
        return execSync(command, { encoding: 'utf-8', cwd: process.cwd() });
    } catch (error) {
        return { error: error.message, stdout: error.stdout };
    }
}

function handleAPI(req, res, url) {
    res.setHeader('Content-Type', 'application/json');

    try {
        if (url === '/api/status') {
            const status = exec('git status --porcelain');
            res.end(JSON.stringify({ status }));
        } else if (url === '/api/log') {
            const log = exec('git log --oneline --graph --decorate -50');
            res.end(JSON.stringify({ log }));
        } else if (url === '/api/branches') {
            const branches = exec('git branch -a');
            res.end(JSON.stringify({ branches }));
        } else if (url === '/api/diff') {
            const diff = exec('git diff');
            res.end(JSON.stringify({ diff }));
        } else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    } catch (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
    }
}

function getHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Git GUI Web</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #4ec9b0; margin-bottom: 20px; }
        .tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid #3e3e3e;
        }
        .tab {
            padding: 10px 20px;
            background: #2d2d2d;
            border: none;
            color: #d4d4d4;
            cursor: pointer;
            border-radius: 4px 4px 0 0;
        }
        .tab.active {
            background: #007acc;
            color: white;
        }
        .content {
            background: #252526;
            padding: 20px;
            border-radius: 4px;
            min-height: 400px;
        }
        pre {
            background: #1e1e1e;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .loading { text-align: center; padding: 40px; color: #858585; }
        .error { color: #f48771; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Git GUI Web</h1>
        <div class="tabs">
            <button class="tab active" onclick="showTab('status')">Status</button>
            <button class="tab" onclick="showTab('log')">Log</button>
            <button class="tab" onclick="showTab('branches')">Branches</button>
            <button class="tab" onclick="showTab('diff')">Diff</button>
        </div>
        <div class="content" id="content">
            <div class="loading">Loading...</div>
        </div>
    </div>
    
    <script>
        let currentTab = 'status';
        
        async function fetchData(endpoint) {
            try {
                const response = await fetch('/api/' + endpoint);
                const data = await response.json();
                return data;
            } catch (error) {
                return { error: error.message };
            }
        }
        
        async function showTab(tab) {
            currentTab = tab;
            
            // Update active tab
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            
            // Show loading
            document.getElementById('content').innerHTML = '<div class="loading">Loading...</div>';
            
            // Fetch data
            const data = await fetchData(tab);
            
            // Display data
            const content = document.getElementById('content');
            if (data.error) {
                content.innerHTML = '<div class="error">Error: ' + data.error + '</div>';
            } else {
                const value = data[tab] || '';
                content.innerHTML = '<pre>' + escapeHtml(value) + '</pre>';
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Auto refresh every 5 seconds
        setInterval(() => {
            showTab(currentTab);
        }, 5000);
        
        // Initial load
        showTab('status');
    </script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
    const url = req.url;

    if (url.startsWith('/api/')) {
        handleAPI(req, res, url);
    } else {
        res.setHeader('Content-Type', 'text/html');
        res.end(getHTML());
    }
});

server.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════════╗`);
    console.log(`║     Git GUI Web Server is running!           ║`);
    console.log(`╠════════════════════════════════════════════════╣`);
    console.log(`║  Local:   http://localhost:${PORT}              ║`);
    console.log(`║  Network: http://<your-ip>:${PORT}              ║`);
    console.log(`╠════════════════════════════════════════════════╣`);
    console.log(`║  Press Ctrl+C to stop                         ║`);
    console.log(`╚════════════════════════════════════════════════╝\n`);
    console.log(`Working directory: ${process.cwd()}\n`);
});
