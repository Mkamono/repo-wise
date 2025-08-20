module.exports = {
    'backend-api': {
        input: 'http://localhost:8070/openapi.yaml',
        output: {
            mode: 'split',
            target: './src/api',
            schemas: './src/api/model',
            client: 'swr',
        },
    },
};
