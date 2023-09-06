module.exports = {
    parserOptions: {
        project: ["./tsconfig.json"],
    },
    plugins: ["@hboictcloud"],
    extends: ["plugin:@hboictcloud/base"],
    overrides: [
        {
            files: [
                "*.js"
            ],
            rules: {
                "@typescript-eslint/typedef": 0,
                "@typescript-eslint/explicit-function-return-type": 0
            }
        }
    ]
};
