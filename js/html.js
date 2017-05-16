// Helper functions for emitting HTML from Javascript
let valid = function (value) {
    return (typeof (value) !== "undefined") && (value !== null);
};

let block = function (block, attributes, content) {
    let result = "<" + block;
    if (valid (attributes)) {
        let attributeNames = Object.keys (attributes);
        for (let attributeName of attributeNames) {
            if (valid (attributes[attributeName])) {
                result += " " + attributeName + "=\"" + attributes[attributeName] + "\"";
            }
        }
    }
    return result + (valid (content) ? (">" + content + "</" + block + ">") : ("/>"));
};

let div = function (cssClass, content) {
    return block ("div", { "class": cssClass }, content);
};

let addElement = function (parent, tag, options) {
    let element = document.createElement (tag);
    let optionNames = Object.keys (options);
    for (let optionName of optionNames) {
        switch (optionName) {
            case "class": {
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
    parent.appendChild (element);
    return element;
};

