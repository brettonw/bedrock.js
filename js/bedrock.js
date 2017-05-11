let Bedrock = function () {
    let $ = Object.create (null);

    $.Base = function () {
        let _ = Object.create (null);

        _.new = function (parameters) {
            return Object.create (this).init (parameters);
        };

        return _;
    } ();

    return $;
} ();
