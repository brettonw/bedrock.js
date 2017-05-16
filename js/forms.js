let Forms = function () {
    let _ = Object.create (Bedrock.Base);

    let forms = {};

    const INPUT = "-input-";
    const ERROR = "-error-";

    _.init = function (parameters) {
        // parameters.name - name of the form (and the event to use when submitting)
        let formName = this.name = parameters.name;
        forms[formName] = this;

        // parameters.submit - function to call when the user clicks submit and all the
        //                     input values pass validation
        this.completion = parameters.completion;

        // parameters.div - where to put the form
        let divElement = document.getElementById(parameters.div);
        divElement = addElement(divElement, "div", { class : "form-container" });

        // parameters.inputs - array of input names, with prompt, type, default value, template, and required flag
        // input = { name: "nm", type: "text|checkbox|select", label: "blah", required: true, (...values appropriate for input type...) }
        let inputs = this.inputs = {};
        for (let input of parameters.inputs) {
            // create the div and set the title
            let formDivElement = addElement (divElement, "div", { class: "form-div" });
            addElement (formDivElement, "div", { class: "form-title-div", innerHTML: input.label });

            // now add the actual input
            let inputObject = inputs[input.name] = {
                name: input.name,
                type: input.type,
                required: ("required" in input) ? input.required : false,
            };

            // and the input element depending on the type
            switch (input.type) {
                case "text": {
                    let value = ("value" in input) ? input.value : "";
                    inputObject.inputElement = addElement (formDivElement, "input", { id: (formName + INPUT + input.name), type: "text", class: "form-input", placeholder: input.placeholder, value: value });
                    inputObject.value = value;
                    if ("pattern" in input) {
                        inputObject.pattern = input.pattern;
                    }
                    break;
                }
                case "checkbox": {
                    let checked = ("checked" in input) ? input.checked : false;
                    inputObject.inputElement = addElement (formDivElement, "input", { id: (formName + INPUT + input.name), type: "checkbox", class: "form-input", checked: checked });
                    inputObject.checked = checked;
                    break;
                }
                case "select": {
                    let inputElement = inputObject.inputElement = addElement (formDivElement, "select", { id: (formName + INPUT + input.name), class: "form-input" });
                    for (let option of input.options) {
                        let value = (option === Object (option)) ? option.value : option;
                        let label = ((option === Object (option)) && ("label" in option)) ? option.label : value;
                        addElement (inputElement, "option", { value: value, label: label });
                    }
                    let value = ("value" in input) ? input.value : inputObject.inputElement.value;
                    inputObject.value = value;
                    inputObject.inputElement.value = value;
                    break;
                }
                case "text-select": {
                    // XXX I ultimately want this to be a dropdown list with a type-able value box
                    break;
                }
            }

            // and now add the error element
            inputObject.errorElement = addElement (formDivElement, "div", { id: (formName + ERROR + input.name), class: "form-error", innerHTML: inputObject.required ? "REQUIRED" : "" });
        }

        // now add the submit button
        let formDivElement = addElement (divElement, "div", { classes: ["form-div", "form-button-wrapper"] });
        addElement (formDivElement, "input", { type: "button", value: "SUBMIT", class: "form-submit-button", onclick: function () { forms[formName].handleClickSubmit (); }  });

        return this;
    };

    _.handleClickSubmit = function () {
        // define the error condition
        let allValid = true;

        // check if all the required inputs are set correctly
        let inputNames = Object.keys(this.inputs);
        for (let inputName of inputNames) {
            let input = this.inputs[inputName];
            if (input.required) {
                let valid = true;
                switch (input.type) {
                    case "text": {
                        if ("pattern" in input) {
                            valid = input.inputElement.value.match (input.pattern);
                        } else  {
                            valid = (input.inputElement.value.length > 0);
                        }
                        break;
                    }
                    case "checkbox": {
                        valid = input.inputElement.checked;
                        break;
                    }
                    case "select": {
                        valid = (input.inputElement.value.length > 0);
                        break;
                    }
                }
                input.errorElement.style.visibility = valid ? "hidden" : "visible";
                allValid = allValid && valid;
            }
        }

        // call completion if everything passes
        if (allValid === true) {
            this.completion (this);
        }
    };

    _.reset = function () {
        let inputNames = Object.keys (this.inputs);
        for (let inputName of inputNames) {
            let input = this.inputs[inputName];
            switch (input.type) {
                case "checkbox":
                    input.inputElement.checked = input.checked;
                    break;
                case "text":
                case "select":
                    input.inputElement.value = input.value;
                    break;
            }
        }
    };

    _.getInputValues = function () {
        let now = new Date ().getTime ();
        let result = "api?event=" + this.name + "&timestamp=" + now
        let keys = Object.keys (this.inputs);
        for (let key of keys) {
            let input = this.inputs[key];
            result += "&" + input.name + "=";
            switch (input.type) {
                case "checkbox":
                    result += input.inputElement.checked;
                    break;
                case "text":
                case "select":
                    result += input.inputElement.value;
                    break;
            }
        }
        return result;
    };


    return _;
} ();

