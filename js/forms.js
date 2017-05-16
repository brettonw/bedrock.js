let Forms = function () {
    let _ = Object.create (Bedrock.Base);

    let forms = {};

    const INPUT = "-input-";
    const ERROR = "-error-";

    let addElement = function (parent, tag, options) {
        let element = document.createElement(tag);
        let optionNames = Object.keys(options);
        for (let optionName of optionNames) {
            switch (optionName) {
                case "class":{
                    element.classList.add (options.class);
                    break;
                }
                case "classes": {
                    for (let cssClass of options.classes) {
                        element.classList.add (cssClass);
                    }
                    break;
                }
                default: {
                    element[optionName] = options[optionName];
                    break;
                }
            }
        }
        parent.appendChild(element);
        return element;
    };

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
            /*
             <div class="form-div">
             <div class="form-title-div">Device Id:</div>
             <input blah blah blah">
             <div id="input-device-id-error" class="form-error">REQUIRED</div>
             </div>
             */

            // create the div and set the title
            let formDivElement = addElement (divElement, "div", { class: "form-div" });
            let formTitleDivElement = addElement (formDivElement, "div", { class: "form-title-div", innerHTML: input.label });

            // now add the actual input
            let inputObject = inputs[input.name] = {
                name: input.name,
                type: input.type,
                required: ("required" in input) ? input.required : false,
            };

            // and the input element depending on the type
            switch (input.type) {
                case "text": {
                    /*
                     <input class="form-input" id="input-device-id" type="text" placeholder="Enter your Device ID">
                     */
                    let value = ("value" in input) ? input.value : "";
                    inputObject.inputElement = addElement (formDivElement, "input", { id: (formName + INPUT + input.name), type: "text", class: "form-input", placeholder: input.placeholder, value: value });
                    inputObject.value = value;
                    if ("pattern" in input) {
                        inputObject.pattern = input.pattern;
                    }
                    break;
                }
                case "checkbox": {
                    /*
                     <input class="form-input" id="input-enable" type="checkbox" checked="checked">
                     */
                    let checked = ("checked" in input) ? input.checked : false;
                    inputObject.inputElement = addElement (formDivElement, "input", { id: (formName + INPUT + input.name), type: "checkbox", class: "form-input", checked: checked });
                    inputObject.checked = checked;
                    break;
                }
                case "select": {
                    /*
                     <select class="form-input" id="input-age-rating">
                     <option value="">UNRATED</option>
                     ...
                     <option value="17">MPAA NC-17</option>
                     </select>
                     */
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
        /*
         <div class="form-div form-button-wrapper">
         <input class="bedrockClearButton" type="button" value="SUBMIT" onclick="onClickSubmitApplicationPolicy ();">
         </div>
         */
        let formDivElement = addElement (divElement, "div", { classes: ["form-div", "form-button-wrapper"] });
        addElement (formDivElement, "input", { type: "button", value: "SUBMIT", class: "bedrockClearButton", onclick: function () { forms[formName].handleClickSubmit (); }  });

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
                    case "text-select": {
                        break;
                    }
                }
                input.errorElement.style.visibility = valid ? "hidden" : "visible";
                allValid = allValid && valid;
            }
        }

        // call completion if everything passes
        if (allValid === true) {
            this.completion ();

            // and reset
            for (let inputName of inputNames) {
                let input = this.inputs[inputName];
                switch (input.type) {
                    case "text":
                        input.inputElement.value = input.value;
                        break;
                    case "checkbox":
                        input.inputElement.checked = input.checked;
                        break;
                    case "select":
                        input.inputElement.value = input.value;
                        break;
                    case "text-select":
                        break;
                }
            }
        }
    };

    return _;
} ();

