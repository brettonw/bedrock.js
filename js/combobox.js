Bedrock.ComboBox = function () {
    let _ = Object.create(Bedrock.Base);

    let indexById = {};

    _.getById = function (inputElementId) {
        return indexById[inputElementId];
    };

    _.init = function (parameters) {
        // scope "this" as self so I can use it in closures
        let self = this;

        // if the user starts pressing keys to navigate the options list, then we don't
        // want to automagically incure mouseover events while the list scrolls. This flag
        // is used to tell the options not to highlight from mouseover events when the
        // reason for the event is a keypress
        this.allowMouseover = true;

        // get the text box from the parameters and its computed style, store this for
        // later use
        let inputElementId = parameters.inputElementId;
        let inputElement = this.inputElement = document.getElementById(inputElementId);
        //let computedStyle = getComputedStyle (inputElement);
        //inputElement.setAttribute("data", { bedrock: this });
        indexById[inputElementId] = this;

        // get the parent element
        let parentElement = inputElement.parentNode;

        // put a pseudo-parent down so the popup will always be under it but not in the
        // document flow
        parentElement = addElement(parentElement, "div", { class: "combobox-pseudo-parent" });

        // create a box under it the same size, absolute position
        let optionsElement = this.optionsElement = addElement(parentElement, "div", {
            class: "combobox-options",
            style: { "min-width": (1.5 * inputElement.offsetWidth) + "px" },
        });

        // set the options
        this.setOptions(parameters.options);

        // subscribe to various events on the input element

        // capture the mousedown, and if it's on the far right of the input element,
        // clear the text before proceeding
        inputElement.onmousedown = function (event) {
            let x = (event.pageX - this.offsetLeft) / this.offsetWidth;
            let arrowPlacement = (this.offsetWidth - parseFloat (getComputedStyle (this).backgroundSize)) / this.offsetWidth;
            if (x > arrowPlacement) {
                inputElement.value = "";

                // if the element is already focused, we need to update the options
                if (this === document.activeElement) {
                    self.updateOptions ();
                    self.callOnChange ();
                }
            }
            //console.log (this.id + " - mousedown (" + x + "/" + arrowPlacement + ")");
        };

        // in case I need to capture some keys (up/down, for instance)
        inputElement.onkeydown = function (event) {
            switch (event.key) {
                case "ArrowUp": {
                    if (self.currentOption != null) {
                        self.currentOption.classList.remove ("combobox-option-hover");
                        if (self.currentOption.previousSibling != null) {
                            self.currentOption = self.currentOption.previousSibling;
                        } else {
                            self.currentOption = optionsElement.lastChild;
                        }
                    } else {
                        self.currentOption = optionsElement.lastChild;
                    }
                    self.currentOption.classList.add ("combobox-option-hover");

                    // if the newly selected current option is not visible, set the scroll
                    // pos to make it visible, and tell the options not to respond to
                    // mouseover events until the mouse moves
                    if (! elementIsInView(self.currentOption, optionsElement)) {
                        self.allowMouseover = false;
                        optionsElement.scrollTop = self.currentOption.offsetTop;
                    }
                    break;
                }
                case "ArrowDown": {
                    if (self.currentOption != null) {
                        self.currentOption.classList.remove ("combobox-option-hover");
                        if (self.currentOption.nextSibling != null) {
                            self.currentOption = self.currentOption.nextSibling;
                        } else {
                            self.currentOption = optionsElement.firstChild;
                        }
                    } else {
                        self.currentOption = optionsElement.firstChild;
                    }
                    self.currentOption.classList.add ("combobox-option-hover");

                    // if the newly selected current option is not visible, set the scroll
                    // pos to make it visible, and tell the options not to respond to
                    // mouseover events until the mouse moves
                    if (!elementIsInView (self.currentOption, optionsElement)) {
                        self.allowMouseover = false;
                        optionsElement.scrollTop = (self.currentOption.offsetTop - optionsElement.offsetHeight) + self.currentOption.offsetHeight;
                    }
                    break;
                }
                case "Enter": {
                    if (self.currentOption != null) {
                        inputElement.value = self.currentOption.getAttribute ("data-value");
                    }
                    self.callOnChange ();
                    inputElement.blur ();
                    break;
                }
                case "Escape": {
                    inputElement.blur ();
                    break;
                }
                default:
                    return true;
            }
            return false;
        };

        // in case the user changes by pasting, does this not fire oninput?
        inputElement.onpaste = function () {
            this.oninput ();
        };

        // oninput fires immediately when the value changes
        inputElement.oninput = function () {
            self.updateOptions ();
            self.callOnChange ();
        };

        // when the control gains focus (in this order: onmousedown, focus, click)
        inputElement.onfocus = function (event) {
            //console.log (this.id + " - focus");
            self.updateOptions ();
            optionsElement.scrollTop = 0;
            optionsElement.style.display = "block";
        };

        // when the user moves away from the control
        inputElement.onblur = function () {
            //console.log (this.id + " - blur");
            self.optionsElement.style.display = "none";
        };

        return this;
    };

    _.callOnChange = function () {
        if (("onchange" in this.inputElement) && (typeof this.inputElement.onchange === "function")) {
            this.inputElement.onchange ();
        }
    };

    _.updateOptions = function () {
        // scope "this" as self so I can use it in closures
        let self = this;

        // there should be no currently selected option
        self.currentOption = null;

        // get the elements
        let inputElement = this.inputElement;
        let optionsElement = this.optionsElement;

        // clear out the options
        while (optionsElement.firstChild) {
            optionsElement.removeChild (optionsElement.firstChild);
        }

        // get the current value as a regex object for rapid matching
        let regex = new RegExp (this.inputElement.value, 'i');

        // take the inputElement value and use it to filter the list
        for (let option of this.options) {
            if (option.matchTarget.match (regex)) {
                let comboBoxOption = addElement (optionsElement, "div", {
                    class: "combobox-option",
                    onmousedown: function () {
                        inputElement.value = option.value;
                        self.callOnChange();
                        return true;
                    },
                    onmouseover: function () {
                        //console.log ("onmouseover (" + ((self.allowMouseover === true) ? "YES" : "NO") + ")");
                        if (self.allowMouseover === true) {
                            if (self.currentOption != null) {
                                self.currentOption.classList.remove ("combobox-option-hover");
                            }
                            self.currentOption = this;
                            this.classList.add ("combobox-option-hover");
                        }
                        self.allowMouseover = true;
                    },
                    onmouseout: function () {
                        //console.log ("onmouseout (" + ((self.allowMouseover === true) ? "YES" : "NO") + ")");
                        if (self.allowMouseover === true) {
                            this.classList.remove ("combobox-option-hover");
                        }
                    }
                });
                comboBoxOption.setAttribute("data-value", option.value);

                //comboBoxOption.innerHTML = ("label" in option) ? option.label : option.value;
                if ("label" in option) {
                    addElement (comboBoxOption, "div", { style: { float: "left" }}).innerHTML = option.value;
                    addElement (comboBoxOption, "div", { class: "combobox-option-label" }).innerHTML = option.label;
                } else {
                    comboBoxOption.innerHTML = option.value;
                }
            }
        }

        return this;
    };

    _.setOptions = function (options) {
        this.options = options;
        // get the list of options from the parameters, convert it to the expected format:
        // { value: "v", label: "m", alt:"xxx" }, and we create { value: "v", label: "m", matchTarget: "v, m, xxx" }
        let conditionedOptions = this.options = [];
        for (let option of options) {
            if (option === Object (option)) {
                // XXX fill this in
                let conditionedOption = { value: option.value, matchTarget: option.value };
                if ("label" in option) {
                    conditionedOption.label = option.label;
                    conditionedOption.matchTarget += ", " + option.label;
                }
                if ("alt" in option) {
                    conditionedOption.matchTarget += ", " + option.alt;
                }
                conditionedOptions.push (conditionedOption);
            } else {
                conditionedOptions.push ({ value: option, matchTarget: option });
            }
        }

        // and start with the current option set to null
        this.currentOption = null;

        return this;
    };

    return _;
} ();
