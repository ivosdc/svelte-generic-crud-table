module.exports = {
    transform: {
        '^.+\\.svelte$': 'svelte-jester',
        '^.+\\.js$': 'babel-jest',
    },
    moduleFileExtensions: ['js', 'svelte'],
    resolver: 'jest-svelte-resolver',
    transformIgnorePatterns: [
        'node_modules/(?!fa-svelte)'
    ],
}
