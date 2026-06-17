const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const replacements = [
                [/background:\s*white;/g, 'background: var(--bg-main);'],
                [/background-color:\s*white;/g, 'background-color: var(--bg-main);'],
                [/background:\s*#fff;/gi, 'background: var(--bg-main);'],
                [/background-color:\s*#fff;/gi, 'background-color: var(--bg-main);'],
                [/background:\s*#ffffff;/gi, 'background: var(--bg-main);'],
                [/background-color:\s*#ffffff;/gi, 'background-color: var(--bg-main);'],
                
                [/background:\s*#f5f5f5;/g, 'background: var(--bg-main);'],
                [/background-color:\s*#f5f5f5;/g, 'background-color: var(--bg-main);'],
                
                [/color:\s*#1a1a2e;/g, 'color: var(--text-main);'],
                [/color:\s*#333;/g, 'color: var(--text-main);'],
                [/color:\s*#666;/g, 'color: var(--text-muted);'],
                [/color:\s*#555;/g, 'color: var(--text-muted);'],
                [/color:\s*#888;/g, 'color: var(--text-muted);'],
                [/color:\s*#999;/g, 'color: var(--text-muted);'],
                
                [/border:\s*1px\s+solid\s+#ddd;/gi, 'border: 1px solid var(--border-color);'],
                [/border-bottom:\s*1px\s+solid\s+#eee;/gi, 'border-bottom: 1px solid var(--border-color);'],
                [/border-bottom:\s*1px\s+solid\s+#f5f5f5;/gi, 'border-bottom: 1px solid var(--border-color);'],
                [/border:\s*1px\s+solid\s+#eee;/gi, 'border: 1px solid var(--border-color);'],
                
                [/\.card\s*{[^}]*border-radius:\s*0;?/g, match => match.replace('border-radius: 0;', 'border-radius: 12px;')],
                [/\.post-item\s*{[^}]*border-radius:\s*0;?/g, match => match.replace('border-radius: 0;', 'border-radius: 12px;')],
                [/\.result-card\s*{[^}]*border-radius:\s*0;?/g, match => match.replace('border-radius: 0;', 'border-radius: 12px;')],
                [/\.form-card\s*{[^}]*border-radius:\s*0;?/g, match => match.replace('border-radius: 0;', 'border-radius: 12px;')],
                [/\.profile-card\s*{[^}]*border-radius:\s*0;?/g, match => match.replace('border-radius: 0;', 'border-radius: 12px;')]
            ];

            let newContent = content;
            for (const [regex, replacement] of replacements) {
                newContent = newContent.replace(regex, replacement);
            }
            
            // Handle specific border-radius 0 manually for generic classes that are cards
            newContent = newContent.replace(/border-radius:\s*0;/g, 'border-radius: 12px;');

            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent, 'utf8');
                console.log('Updated: ' + fullPath);
            }
        }
    }
}

processDir('C:/Users/singh/OneDrive/Desktop/community/frontend/src/app');
