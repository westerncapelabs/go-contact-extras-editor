var vumigo = require("vumigo_v01");
var jed = require("jed");

if (typeof api === "undefined") {
    // testing hook (supplies api when it is not passed in by the real sandbox)
    var api = this.api = new vumigo.dummy_api.DummyApi();
}

var Promise = vumigo.promise.Promise;
var success = vumigo.promise.success;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;

function VumiGoContactExtrasEditor() {
    var self = this;
    // The first state to enter
    StateCreator.call(self, 'first_state');

    self.get_contact = function(im){
        var p = im.api_request('contacts.get_or_create', {
            delivery_class: 'ussd',
            addr: im.user_addr
        });
        return p;
    };

    self.add_state(new ChoiceState(
        "first_state",
        function(choice){return choice.value;},
        "What would you like to do?",
        [
            new Choice("choose_extra", "Update extras"),
            new Choice("choose_contact_field", "Update contact"),
        ]
    ));

    self.add_state(new FreeText(
        "choose_extra",
        "edit_state",
        "What extra do you want to modify?"
    ));

    self.add_creator('edit_state', function(state_name, im) {
        var p = self.get_contact(im);
        p.add_callback(function(result) {
            // This callback updates extras when contact is found
            if (result.success){
                var extra_name = "extras-" + im.get_user_answer('choose_extra');
                if (typeof result.contact[extra_name] !== 'undefined'){
                    return new FreeText(
                        state_name,
                        "save_state",
                        "Extra value currently '" +
                        result.contact[extra_name] +
                        "'. Change to?"
                    );
                } else {
                    return new FreeText(
                        "choose_extra",
                        "edit_state",
                        "Extra not found. Try another?"
                    );
                }
            } else {
                return new EndState(
                    "end_state",
                    "Something went up the swanny with loading. Kbye.",
                    "first_state"
                );
            }
        });
        return p;
    });

    self.add_creator('save_state', function(state_name, im) {
        var p = self.get_contact(im);
        var extra_name = im.get_user_answer('choose_extra');
        var extra_value = im.get_user_answer('edit_state');
        var fields = {};
        fields[extra_name] = JSON.stringify(extra_value);

        p.add_callback(function(result) {
            // Run the extras update
            return im.api_request('contacts.update_extras', {
                key: result.contact.key,
                fields: fields
            });
        });
        p.add_callback(function(result) {
            if (result.success){
                return new ChoiceState(
                    state_name,
                    function(choice){return choice.value;},
                    "Contact updated. Update another extra?",
                    [
                        new Choice("choose_extra", "Yes"),
                        new Choice("end_state", "No"),
                        new Choice("first_state", "Main Menu"),
                    ]
                );
            } else {
                return new EndState(
                    "end_state",
                    "Something went up the swanny saving extra. Kbye.",
                    "first_state"
                );
            }
        });
        return p;
    });

    self.add_state(new FreeText(
        "choose_contact_field",
        "edit_contact_state",
        "What field do you want to modify?"
    ));

    self.add_creator('edit_contact_state', function(state_name, im) {
        var p = self.get_contact(im);
        p.add_callback(function(result) {
            // This callback updates extras when contact is found
            if (result.success){
                var field_name = im.get_user_answer('choose_contact_field');
                if (typeof result.contact[field_name] !== 'undefined'){
                    return new FreeText(
                        state_name,
                        "save_contact_state",
                        "Field value currently '" +
                        result.contact[field_name] +
                        "'. Change to?"
                    );
                } else {
                    return new FreeText(
                        "choose_contact_field",
                        "edit_contact_state",
                        "Field not found. Try another?"
                    );
                }
            } else {
                return new EndState(
                    "end_state",
                    "Something went up the swanny with loading. Kbye.",
                    "first_state"
                );
            }
        });
        return p;
    });

    self.add_creator('save_contact_state', function(state_name, im) {
        var p = self.get_contact(im);
        var name = im.get_user_answer('choose_contact_field');
        var value = im.get_user_answer('edit_contact_state');

        p.add_callback(function(result) {
            // Run the extras update
            var contact = result.contact;
            contact[name] = JSON.stringify(value);
            return im.api_request('contacts.update', {
                key: result.contact.key,
                fields: contact
            });
        });
        p.add_callback(function(result) {
            if (result.success){
                return new ChoiceState(
                    state_name,
                    function(choice){return choice.value;},
                    "Contact updated. Update another field?",
                    [
                        new Choice("choose_contact_field", "Yes"),
                        new Choice("end_state", "No"),
                        new Choice("first_state", "Main Menu"),
                    ]
                );
            } else {
                return new EndState(
                    "end_state",
                    "Something went up the swanny saving extra. Kbye.",
                    "first_state"
                );
            }
        });
        return p;
    });

    self.add_state(new EndState(
        "end_state",
        "Thank you and bye bye!",
        "first_state"
    ));
}

// launch app
var states = new VumiGoContactExtrasEditor();
var im = new InteractionMachine(api, states);
im.attach();