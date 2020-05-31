module.exports = {
    transform: {
        '^.+\\.svelte$': 'svelte-jester',
        '^.+\\.js$': 'babel-jest',
        "^.+\\.svg?$": "svelte-jester"
    },
    moduleFileExtensions: ['js', 'svelte'],
    resolver: 'jest-svelte-resolver'
}
