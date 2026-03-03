module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

    testPathIgnorePatterns: [
        "<rootDir>/node_modules/",
        "<rootDir>/dist/",
        "<rootDir>/src/test.ts"
    ],
    transformIgnorePatterns: [
        "node_modules/(?!(pdfmake-wrapper|pdfmake-unicode))"
    ],
    moduleNameMapper: {
        "^@dashboard/(.*)$": "<rootDir>/src/app/dashboard/$1",
        "^@auth/(.*)$": "<rootDir>/src/app/auth/$1",
        "^@services/(.*)$": "<rootDir>/src/app/services/$1",
        "^@interfaces/(.*)$": "<rootDir>/src/app/interfaces/$1",
        "^@shared/(.*)$": "<rootDir>/src/app/shared/$1",
        "^@utils/(.*)$": "<rootDir>/src/app/utils/$1",
        "^@professionals/(.*)$": "<rootDir>/src/app/professionals/$1",
        "^@pharmacists/(.*)$": "<rootDir>/src/app/pharmacists/$1",
        "^@animations/(.*)$": "<rootDir>/src/app/animations/$1",
        "^@root/(.*)$": "<rootDir>/src/$1",
        "^@audit/(.*)$": "<rootDir>/src/app/audit/$1"
    },
    testMatch: [
        "**/+(*.)+(test).+(ts)"
    ]
};
