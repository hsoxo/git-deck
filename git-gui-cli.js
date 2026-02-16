#!/usr/bin/env node

/**
 * Git GUI CLI - 命令行版本的 Git GUI
 * 适用于远程 SSH 环境
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function exec(command) {
    try {
        return execSync(command, { encoding: 'utf-8' });
    } catch (error) {
        return error.stdout || error.message;
    }
}

function showStatus() {
    console.log('\n=== Git Status ===');
    console.log(exec('git status --short'));
}

function showLog() {
    console.log('\n=== Git Log (last 10 commits) ===');
    console.log(exec('git log --oneline --graph --decorate -10'));
}

function showBranches() {
    console.log('\n=== Git Branches ===');
    console.log(exec('git branch -a'));
}

function showDiff() {
    console.log('\n=== Git Diff ===');
    console.log(exec('git diff'));
}

function showMenu() {
    console.log('\n╔════════════════════════════════════╗');
    console.log('║         Git GUI CLI Menu          ║');
    console.log('╠════════════════════════════════════╣');
    console.log('║ 1. Show Status                    ║');
    console.log('║ 2. Show Log                       ║');
    console.log('║ 3. Show Branches                  ║');
    console.log('║ 4. Show Diff                      ║');
    console.log('║ 5. Stage All                      ║');
    console.log('║ 6. Commit                         ║');
    console.log('║ 7. Push                           ║');
    console.log('║ 8. Pull                           ║');
    console.log('║ 0. Exit                           ║');
    console.log('╚════════════════════════════════════╝\n');
}

function handleChoice(choice) {
    switch (choice.trim()) {
        case '1':
            showStatus();
            promptMenu();
            break;
        case '2':
            showLog();
            promptMenu();
            break;
        case '3':
            showBranches();
            promptMenu();
            break;
        case '4':
            showDiff();
            promptMenu();
            break;
        case '5':
            console.log(exec('git add -A'));
            console.log('✓ All files staged');
            promptMenu();
            break;
        case '6':
            rl.question('Enter commit message: ', (message) => {
                if (message.trim()) {
                    console.log(exec(`git commit -m "${message}"`));
                    console.log('✓ Committed');
                } else {
                    console.log('✗ Commit message cannot be empty');
                }
                promptMenu();
            });
            break;
        case '7':
            console.log(exec('git push'));
            console.log('✓ Pushed');
            promptMenu();
            break;
        case '8':
            console.log(exec('git pull'));
            console.log('✓ Pulled');
            promptMenu();
            break;
        case '0':
            console.log('Goodbye!');
            rl.close();
            process.exit(0);
            break;
        default:
            console.log('Invalid choice');
            promptMenu();
    }
}

function promptMenu() {
    showMenu();
    rl.question('Choose an option: ', handleChoice);
}

// 启动
console.log('Welcome to Git GUI CLI!');
console.log('Current directory:', process.cwd());
promptMenu();
