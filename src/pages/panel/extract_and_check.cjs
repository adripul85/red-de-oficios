
const fs = require('fs');
const { execSync } = require('child_process');

try {
    const content = fs.readFileSync('index.astro', 'utf8');
    const lines = content.split('\n');
    // Script starts at line 614 (0-indexed: 613) -> <script>
    // We want content inside, so start at 614
    // Script ends at line 1581 (0-indexed: 1580) -> </script>
    // We want up to 1580

    // Adjusting for 1-based indexing from previous view_file
    // <script> is at line 614
    // </script> is at line 1581 (approx)

    // Let's find the script tag indices dynamically to be safe
    let start = -1;
    let end = -1;

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '<script>') start = i + 1;
        if (lines[i].trim() === '</script>') end = i;
    }

    if (start === -1 || end === -1) {
        console.error('Could not find script tags');
        process.exit(1);
    }

    const scriptContent = lines.slice(start, end).join('\n');
    fs.writeFileSync('temp_check.js', scriptContent);

    console.log(`Extracted lines ${start + 1} to ${end + 1} to temp_check.js`);

    try {
        execSync('node --check temp_check.js', { stdio: 'inherit' });
        console.log('Syntax OK');
    } catch (e) {
        console.error('Syntax Error found');
    }

} catch (e) {
    console.error(e);
}
