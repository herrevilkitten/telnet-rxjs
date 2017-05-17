module.exports = function (config) {
  var configuration = {
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
  };

  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};