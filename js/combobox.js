let ComboBox = function () {
    let _ = Object.create(Bedrock.Base);

    _.init = function (parameters) {
        // get the list of options from the parameters, expected { value: v, label: l, alternates: [a1, a2, a3] }
        let options = parameters.options;

        // get the text box from the parameters
        let inputElement = this.inputElement = document.getElementById(parameters.inputElementId);

        let self = this;

        // subscribe to various events on the input element
        // onchange fires onblur if the value has changed
        inputElement.onchange = function () {

        };

        // in case I need to capture some keys (up/down, for instance)
        inputElement.onkeypress = function () { this.onchange(); };

        // in case the user changes by pasting, does this notfire oninput?
        inputElement.onpaste = function () { this.onchange(); };

        // oninput fires immediately when the value changes
        inputElement.oninput = function () { this.onchange(); };

        // duh
        inputElement.onclick = function () {
            self.optionsElement.style.display = "block";
        };

        // duh
        inputElement.onblur = function () {
            self.optionsElement.style.display = "none";
        };

        // put a dropdown arrow on the right side of the input element

        // get the parent element
        let parentElement = inputElement.parentNode;

        // put a pseudo-parent down so the popup will always be under it but not in the
        // document flow
        /*
        <div style="position: relative; width: 0; height: 0">
            <div style="position: absolute; left: 100px; top: 100px">
                Hi there, I'm 100px offset from where I ought to be, from the top and left.
            </div>
        </div>
        */
        parentElement = addElement(parentElement, "div", {
            style: {
                position: "relative",
                width: 0,
                height: 0
            }
        });

        // create a box under it the same size, absolute position
        let optionsElement = this.optionsElement = addElement(parentElement, "div", {
            id: parameters.inputElementId + "-list",
            style: {
                position: "absolute",
                display: "none",
                width: inputElement.clientWidth + "px",
                height: "100px",
                overflowY: "scroll",
                color: "#800",
                "z-index": 100
            }
        });

        for (let option of parameters.options) {
            addElement(optionsElement, "div", {}).innerHTML = option;
        }
    };

    return _;
} ();
