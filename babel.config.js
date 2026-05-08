module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
    ],
    plugins: [
        '@babel/plugin-syntax-import-meta',
        function inlineImportMeta() {
            return {
                visitor: {
                    MetaProperty(path) {
                        // Replace "import.meta" with a mock object so Vite-specific
                        // code like "import.meta.env.BASE_URL" evaluates safely in Jest.
                        path.replaceWithSourceString('({ env: { BASE_URL: "/" } })');
                    },
                },
            };
        },
    ],
};
