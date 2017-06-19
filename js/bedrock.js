let Bedrock = function () {
    let $ = Object.create (null);

    $.copyIf = function (key, leftObject, rightObject) {
        if (key in leftObject) rightObject[key] = leftObject[key];
    };

    $.Base = function () {
        let _ = Object.create (null);

        _.new = function (parameters) {
            return Object.create (this).init (parameters);
        };

        return _;
    } ();

    return $;
} ();
