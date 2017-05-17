let Bedrock = function () {
    let $ = Object.create (null);

    $.get = function (queryString, onSuccess) {
        let request = new XMLHttpRequest ();
        request.overrideMimeType ("application/json");
        request.open ("GET", queryString, true);
        request.onload = function (event) {
            if (request.status === 200) {
                let response = JSON.parse (this.responseText);
                onSuccess (response);
            }
        };
        request.send ();
    };

    $.getFromServiceBase = function (queryString, onSuccess) {
        this.fetch (queryString, function (response) {
            console.log (form.name + " (status: " + response.status + ")");
            if (response.status === "ok") {
                onSuccess (response.response);
            }
        });
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
