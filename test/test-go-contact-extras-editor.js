var fs = require("fs");
var assert = require("assert");
var vumigo = require("vumigo_v01");
// CHANGE THIS to your-app-name
var app = require("../lib/go-contact-extras-editor");

// This just checks that you hooked you InteractionMachine
// up to the api correctly and called im.attach();
describe("test_api", function() {
    it("should exist", function() {
        assert.ok(app.api);
    });
    it("should have an on_inbound_message method", function() {
        assert.ok(app.api.on_inbound_message);
    });
    it("should have an on_inbound_event method", function() {
        assert.ok(app.api.on_inbound_event);
    });
});

// YOUR TESTS START HERE
// CHANGE THIS to test_your_app_name
describe("When using the extras editor", function() {

    // These are used to mock API reponses
    // EXAMPLE: Response from google maps API
    var fixtures = [
    ];

    var tester = new vumigo.test_utils.ImTester(app.api, {
        custom_setup: function (api) {
            api.config_store.config = JSON.stringify({
                //user_store: "go_skeleton"
            });

            var dummy_contact = {
                key: "f953710a2472447591bd59e906dc2c26",
                surname: "Trotter",
                user_account: "test-0-user",
                bbm_pin: null,
                msisdn: "+1234567",
                created_at: "2013-04-24 14:01:41.803693",
                gtalk_id: null,
                dob: null,
                groups: null,
                facebook_id: null,
                twitter_handle: null,
                email_address: null,
                name: "Rodney"
            };

            api.add_contact(dummy_contact);
            api.update_contact_extras(dummy_contact, {
                "dummy_string": "dummy",
                "dummy_int": 10
            });
            
            fixtures.forEach(function (f) {
                api.load_http_fixture(f);
            });
        },
        async: true
    });

    // first test should always start 'null, null' because we haven't
    // started interacting yet
    it("first screen should what we want to do", function (done) {
        var p = tester.check_state({
            user: null,
            content: null,
            next_state: "first_state",
            response: "^What would you like to do\\?[^]" +
                "1. Update extras[^]" +
                "2. Update contact$"
        });
        p.then(done, done);
    });

    it("selecting 2 should ask what field", function (done) {
        var user = {
            current_state: "first_state"
        };
        var p = tester.check_state({
            user: user,
            content: "2",
            next_state: "choose_contact_field",
            response: "^What field do you want to modify\\?$"
        });
        p.then(done, done);
    });

    it("selecting 1 should ask what extra", function (done) {
        var user = {
            current_state: "first_state"
        };
        var p = tester.check_state({
            user: user,
            content: "1",
            next_state: "choose_extra",
            response: "^What extra do you want to modify\\?$"
        });
        p.then(done, done);
    });

    it("sending dummy_string should load", function (done) {
        var user = {
            current_state: "choose_extra",
            answers: {
                first_state: '1'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "dummy_string",
            next_state: "edit_state",
            response: "^Extra value currently 'dummy'. Change to\\?$"
        });
        p.then(done, done);
    });

    it("entering change should confirm", function (done) {
        var user = {
            current_state: "edit_state",
            answers: {
                first_state: '1',
                choose_extra: 'dummy_string'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "changed string",
            next_state: "save_state",
            response: "^Contact updated. Update another extra\\?[^]" +
                "1. Yes[^]" +
                "2. No[^]" +
                "3. Main Menu$"
        });
        p.then(done, done);
    });

    it("entering no should exit", function (done) {
        var user = {
            current_state: "save_state",
            answers: {
                first_state: '1',
                choose_extra: 'dummy_string',
                edit_state: 'changed string'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "2",
            next_state: "end_state",
            response: "^Thank you and bye bye!$",
            continue_session: false
        });
        p.then(done, done);
    });

    it("selecting 2 should ask what field", function (done) {
        var user = {
            current_state: "first_state"
        };
        var p = tester.check_state({
            user: user,
            content: "2",
            next_state: "choose_contact_field",
            response: "^What field do you want to modify\\?$"
        });
        p.then(done, done);
    });

    it("sending name should load", function (done) {
        var user = {
            current_state: "choose_contact_field",
            answers: {
                first_state: '2'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "name",
            next_state: "edit_contact_state",
            response: "^Field value currently 'Rodney'. Change to\\?$"
        });
        p.then(done, done);
    });

    it("entering change to field should confirm", function (done) {
        var user = {
            current_state: "edit_contact_state",
            answers: {
                first_state: '1',
                choose_contact_field: 'name'
            }
        };
        var p = tester.check_state({
            user: user,
            content: "Frank",
            next_state: "save_contact_state",
            response: "^Contact updated. Update another field\\?[^]" +
                "1. Yes[^]" +
                "2. No[^]" +
                "3. Main Menu$"
        });
        p.then(done, done);
    });

});