exports.config = {
    baseUrl: 'http://' + (process.env.TRAVIS ? 'ion-autocomplete' : 'localhost') + ':8282/test/e2e/',
    specs: [
        'test/e2e/ion-autocomplete.single-select.e2e.spec.js',
        'test/e2e/ion-autocomplete.multiple-select.e2e.spec.js',
        'test/e2e/ion-autocomplete.prepopulated.e2e.spec.js'
    ],
    sauceUser: process.env.SAUCE_USERNAME,
    sauceKey: process.env.SAUCE_ACCESS_KEY,
    multiCapabilities: [
        {
            browserName: 'chrome',
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER ? process.env.TRAVIS_JOB_NUMBER : null,
            name: 'ion-autocomplete'
        }
    ],
    jasmineNodeOpts: {
        defaultTimeoutInterval: 360000
    }
};