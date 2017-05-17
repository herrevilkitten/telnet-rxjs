if (process.env.TRAVIS) {
  configuration.browsers = ['Chrome_travis_ci'];
}

module.exports = function (config) {
  config.set({
    frameworks: ["jasmine", "karma-typescript"],
    files: [{
        pattern: "src/**/*.ts"
      },
      {
        pattern: "test/**/*.ts"
      }
    ],
    preprocessors: {
      "src/**/*.ts": ["karma-typescript"],
      "test/**/*.ts": ["karma-typescript"]
    },
    karmaTypescriptConfig: {
      tsconfig: "./tsconfig.spec.json"
    },
    reporters: ["progress", "karma-typescript"],
    browsers: ["Chrome"],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
  });
};