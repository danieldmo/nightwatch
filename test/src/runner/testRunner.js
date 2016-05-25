var path = require('path');
var assert = require('assert');
var common = require('../../common.js');
var CommandGlobals = require('../../lib/globals/commands.js');
var Runner = common.require('runner/run.js');

module.exports = {
  'testRunner': {
    before: function (done) {
      CommandGlobals.beforeEach.call(this, done);
    },

    after: function (done) {
      CommandGlobals.afterEach.call(this, done);
    },

    beforeEach: function () {
      process.removeAllListeners('exit');
      process.removeAllListeners('uncaughtException');
    },

    testRunEmptyFolder : function(done) {
      var testsPath = path.join(__dirname, '../../sampletests/empty');
      var runner = new Runner([testsPath], {}, {
        output_folder : false
      }, function(err) {
        assert.strictEqual(err.message.indexOf('No tests defined!'), 0);
        done();
      });
      runner.run();
    },

    testRunSimple: function (done) {
      var testsPath = path.join(__dirname, '../../sampletests/simple');
      var globals = {
        calls: 0
      };

      var runner = new Runner([testsPath], {
        seleniumPort: 10195,
        silent: true,
        output: false,
        globals: globals
      }, {
        output_folder: false,
        start_session: true
      }, function (err, results) {
        assert.strictEqual(err, null);
        assert.ok('sample' in results.modules);
        assert.ok('demoTest' in results.modules.sample.completed);
        done();
      });

      runner.run().catch(function (err) {
        done(err);
      });
    },

    testRunWithJUnitOutput : function(done) {
      var src_folders = [
        path.join(__dirname, '../../sampletests/withsubfolders')
      ];
      var currentTestArray = [];

      var runner = new Runner(src_folders, {
        seleniumPort : 10195,
        silent : true,
        output : false,
        globals : {
          beforeEach : function(client, doneFn) {
            currentTestArray.push({
              name : client.currentTest.name,
              module : client.currentTest.module,
              group : client.currentTest.group
            });
            doneFn();
          }
        }
      }, {
        output_folder : 'output',
        start_session : true,
        src_folders : src_folders,
        reporter : 'junit'
      }, function(err, results) {

        assert.strictEqual(err, null);
        assert.deepEqual(currentTestArray, [
          { name: '', module: 'simple/sample', group : 'simple' },
          { name: '', module: 'tags/sampleTags', group : 'tags' }
        ]);

        var fs = require('fs');
        fs.readdir(src_folders[0], function(err, list) {
          try {
            assert.deepEqual(list, ['simple', 'tags'], 'The subfolders have been created.');
            var simpleReportFile = 'output/simple/FIREFOX_TEST_TEST_sample.xml';
            var tagsReportFile = 'output/tags/FIREFOX_TEST_TEST_sampleTags.xml';

            assert.ok(fs.existsSync(simpleReportFile), 'The simple report file was not created.');
            assert.ok(fs.existsSync(tagsReportFile), 'The tags report file was not created.');
            done();
          } catch (err) {
            done(err);
          }
        });
      });

      runner.run().catch(function (err) {
        done(err);
      });
    },

    testRunUnitTests : function(done) {
      var testsPath = path.join(__dirname, '../../sampletests/unittests');

      var runner = new Runner([testsPath], {
        silent : true,
        output : false,
        globals : {}
      }, {
        output_folder : false,
        start_session : false
      }, function(err, results) {
        assert.strictEqual(err, null);

        done();
      });

      runner.run().catch(function (err) {
        done(err);
      });
    },

    'test async unit test with timeout error': function (done) {
      var testsPath = path.join(__dirname, '../../asynchookstests/unittest-async-timeout.js');
      var globals = {
        calls : 0,
        asyncHookTimeout: 10
      };

      process.on('uncaughtException', function (err) {
        assert.ok(err instanceof Error);
        assert.equal(err.message, 'done() callback timeout of 10 ms was reached while executing "demoTest". ' +
          'Make sure to call the done() callback when the operation finishes.');

        done();
      });

      var runner = new Runner([testsPath], {
        seleniumPort: 10195,
        silent: true,
        output: false,
        persist_globals : true,
        globals: globals,
        compatible_testcase_support : true
      }, {
        output_folder : false,
        start_session : false
      });

      runner.run().catch(function(err) {
        done(err);
      });
    }
  }
};
