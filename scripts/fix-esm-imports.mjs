import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const outputDirectory = resolve(process.cwd(), process.argv[2] ?? 'dist');
const emittedExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.node']);

function addJavaScriptExtension(specifier) {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
        return specifier;
    }

    return emittedExtensions.has(extname(specifier)) ? specifier : `${specifier}.js`;
}

function rewriteSpecifiers(source) {
    const staticImports = source.replace(
        /((?:from\s+|import\s*)["'])(\.\.?\/[^"']+)(["'])/g,
        (_match, prefix, specifier, suffix) => `${prefix}${addJavaScriptExtension(specifier)}${suffix}`,
    );

    return staticImports.replace(
        /(import\s*\(\s*["'])(\.\.?\/[^"']+)(["']\s*\))/g,
        (_match, prefix, specifier, suffix) => `${prefix}${addJavaScriptExtension(specifier)}${suffix}`,
    );
}

async function rewriteDirectory(directory) {
    const entries = await readdir(directory, { withFileTypes: true });

    await Promise.all(
        entries.map(async (entry) => {
            const path = join(directory, entry.name);

            if (entry.isDirectory()) {
                await rewriteDirectory(path);
                return;
            }

            if (!entry.name.endsWith('.js') && !entry.name.endsWith('.d.ts')) {
                return;
            }

            const source = await readFile(path, 'utf8');
            const rewritten = rewriteSpecifiers(source);

            if (rewritten !== source) {
                await writeFile(path, rewritten);
            }
        }),
    );
}

await rewriteDirectory(outputDirectory);
