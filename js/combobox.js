let ComboBox = function () {
    let _ = Object.create(Bedrock.Base);

    _.init = function (parameters) {
        // scope "this" as self so I can use it in closures
        let self = this;

        // get the text box from the parameters
        let inputElement = this.inputElement = document.getElementById(parameters.inputElementId);

        // put a dropdown arrow on the right side of the input element

        // get the parent element
        let parentElement = inputElement.parentNode;

        // put a pseudo-parent down so the popup will always be under it but not in the
        // document flow
        parentElement = addElement(parentElement, "div", { class: "combobox-pseudo-parent" });

        // create a box under it the same size, absolute position
        let optionsElement = this.optionsElement = addElement(parentElement, "div", {
            class: "combobox-options",
            style: { width: inputElement.offsetWidth + "px" },
        });

        // get the list of options from the parameters, expected { value: v, label: l, alternates: [a1, a2, a3] }
        this.options = parameters.options;
        this.currentOption = null;

        // subscribe to various events on the input element
        // onchange fires onblur if the value has changed
        inputElement.onchange = function () {
            self.updateOptions ();
        };

        // in case I need to capture some keys (up/down, for instance)
        inputElement.onkeypress = function (event) {
            console.log ("KEY: " + event.key);
            this.onchange ();
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

                    // set scroll pos to the current option
                    optionsElement.scrollTop = self.currentOption.offsetTop;
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

                    // set scroll pos to the current option
                    optionsElement.scrollTop = self.currentOption.offsetTop;
                    break;
                }
                case "Enter": {
                    if (self.currentOption != null) {
                        inputElement.value = self.currentOption.innerHTML;
                    }
                    break;
                }
                default:
                    return true;
            }
            return false;
        };

        // in case the user changes by pasting, does this not fire oninput?
        inputElement.onpaste = function () {
            this.onchange ();
        };

        // oninput fires immediately when the value changes
        inputElement.oninput = function () {
            this.onchange ();
        };

        // duh
        inputElement.onclick = function () {
            self.updateOptions ();
            self.optionsElement.style.display = "block";
        };

        // when the user moves away from the control
        inputElement.onblur = function () {
            self.optionsElement.style.display = "none";
        };

    };

    _.updateOptions = function () {
        // scope "this" as self so I can use it in closures
        let self = this;

        // get the element
        let inputElement = this.inputElement;
        let optionsElement = this.optionsElement;

        // clear out the options
        while (optionsElement.firstChild) {
            optionsElement.removeChild (optionsElement.firstChild);
        }

        // get the current value
        let value = this.inputElement.value;
        let regex = new RegExp (value, 'i');

        // take the inputElement value and use it to filter the list
        for (let option of this.options) {
            if (option.match (regex)) {
                addElement (optionsElement, "div", {
                    class: "combobox-option",
                    onmousedown: function () {
                        inputElement.value = option;
                        return true;
                    },
                    onmouseover: function () {
                        self.currentOption = this;
                        this.classList.add ("combobox-option-hover");
                    },
                    onmouseout: function () {
                        this.classList.remove("combobox-option-hover");
                    }
                }).innerHTML = option;
            }
        }
    };

    return _;
} ();
