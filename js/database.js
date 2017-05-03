let Database = function () {
    let $ = Object.create (null);

    let makeSelect = function (id, keys, value, ghost) {
        let optionsHTML = "";
        if (keys.length > 1) {
            optionsHTML = block ("option", { value: "" }, "(" + ghost + ")");
        }
        for (let key of keys) {
            //let encodedName = encodeURIComponent (key).toLowerCase ();
            //let selectedAttr = (encodedName == value) ? " selected" : "";
            let attributes = { value: key };
            if (key === value) {
                attributes.selected = "selected";
            }
            optionsHTML += block ("option", attributes, key);
        }

        let innerHTML = block ("select", { class: "bedrockElementListContainer", id: id, onchange: "theFilter.onValueChange (this);" }, optionsHTML);
        return innerHTML;
    };

    //------------------------------------------------------------------------------------
    // getAllFields - traverses an array of objects to produce an object that contains all
    // the field names, and all the associated values of each field
    $.getAllFields = function (database) {
        let allFields = {};
        for (let record of database) {
            let fields = Object.keys (record).sort ();
            for (let field of fields) {
                // make sure there is a field collector
                if (!(field in allFields)) {
                    allFields[field] = Object.create (null);
                }

                // put the value in, all the individual values if it's an array
                let values = record[field];
                if (values instanceof Array) {
                    for (let value of values) {
                        allFields[field][value] = value;
                    }
                } else {
                    allFields[field][values] = values;
                }
            }
        }

        // now replace each entry with a sorted array of its keys, and then save it
        let fields = Object.keys (allFields);
        for (let field of fields) {
            allFields[field] = Object.keys (allFields[field]).sort ();
        }
        return allFields;
    };

    //------------------------------------------------------------------------------------
    // a Base class
    $.Base = function () {
        let _ = Object.create (null);

        _.new = function (parameters) {
            return Object.create (this).init (parameters);
        };

        return _;
    } ();

    //------------------------------------------------------------------------------------
    // Source is an interface declaration for something that returns a database
    $.Source = function () {
        let _ = Object.create ($.Base);

        _.init = function (database) {
            this.database = database;
            return this;
        };

        _.getDatabase = function () {
            return this.database;
        };

        return _;
    } ();

    //------------------------------------------------------------------------------------
    // database filter element is a single part of a deep tree query, they are grouped
    // together to build complex AND-based reduction operations
    $.FilterElement = function () {
        let _ = Object.create ($.Base);

        let doFilter = function (database, filterField, filterValue) {
            let result = [];

            // if the search key is not specified, this is a pass-through filter, just return
            // what we started with
            if (filterField.length === 0) {
                return database;
            }

            // the individual filter function
            let conditionedFilterValue = filterValue.toLowerCase ();
            let matchValue = function (value) {
                // XXX would be really interesting to see about using characters like
                // XXX '^' and '$' to indicate beginning and end of string
                let matchIndex = value.toString ().toLowerCase ().indexOf (conditionedFilterValue);
                return (matchIndex >= 0);
            };

            // otherwise, loop over all the records to see what passes
            for (let record of database) {
                // only pass records that contain the search key
                let match = (filterField in record);
                if (match === true) {
                    // get the value from the record, it might be a value, or an array of
                    // values, so we have to check and handle accordingly
                    let values = record[filterField];
                    if (values instanceof Array) {
                        let anyMatches = false;
                        for (let value of values) {
                            anyMatches = anyMatches || matchValue (value);
                        }
                        match = match && anyMatches;
                    } else {
                        match = match && matchValue (values);
                    }
                }

                // if we match, store the record into the result
                if (match === true) {
                    result.push (record);
                }
            }

            // return the result
            return result;
        };

        let makeControls = function (index, field, value, fieldKeys) {
            let innerHTML =
                div ("bedrockElementDiv", makeSelect ("filterElementSelectField" + index, fieldKeys, field, "FILTER FIELD")) +
                div ("bedrockElementDiv", block ("input", { class: "bedrockElementTextbox", type: "text", id: "filterElementTextbox" + index, onkeypress: "if (event.keyCode == 13) { theFilter.onEnterKey (this) };", oninput: "theFilter.onValueChange (this);", value: value }, "")) +
                div ("bedrockElementDiv", makeSelect ("filterElementSelectValue" + index, [], value, "FILTER VALUE")) +
                block ("div", { class: "bedrockElementTextDiv", id: "filterElementCountDiv" + index }, "");

            return innerHTML;
        };

        _.init = function (parameters) {
            this.index = parameters.index;
            this.databaseSource = parameters.databaseSource;
            this.owner = parameters.owner;
            this.filterField = parameters.initialValue.field;
            this.filterValue = parameters.initialValue.value;

            // create the select and editing elements inside the supplied div id
            document.getElementById ("filterElementContainer" + parameters.index).innerHTML = makeControls (parameters.index, this.filterField, this.filterValue, parameters.fieldKeys);

            return this;
        };

        _.update = function () {
            let database = this.databaseSource.getDatabase ();
            let filterField = this.filterField;
            let filterValue = this.filterValue;
            let index = this.index;

            // rebuild the value select
            let allFields = Database.getAllFields (this.databaseSource.getDatabase ());
            let selectParentDiv = document.getElementById ("filterElementSelectValue" + index).parentElement;
            selectParentDiv.innerHTML = makeSelect ("filterElementSelectValue" + index, (filterField in allFields) ? allFields[filterField] : [], filterValue, "FILTER VALUE");

            this.filteredDatabase = doFilter (database, filterField, filterValue);
            document.getElementById ("filterElementCountDiv" + index).innerHTML = this.filteredDatabase.length + "/" + database.length;
            this.owner.push (this.index);
        };

        _.onValueChange = function (updatedControl) {
            switch (updatedControl.id.replace (/\d+$/, "")) {
                case "filterElementSelectField": {
                    // key - clear textbox and selectvalue
                    this.setFilterField (updatedControl.value);
                    break;
                }
                case "filterElementTextbox": {
                    // textbox - update selectvalue
                    document.getElementById ("filterElementSelectValue" + this.index).value = updatedControl.value;
                    this.setFilterValue (updatedControl.value);
                    break;
                }
                case "filterElementSelectValue": {
                    document.getElementById ("filterElementTextbox" + this.index).value = updatedControl.value;
                    this.setFilterValue (updatedControl.value);
                    break;
                }
            }
        };

        _.onEnterKey = function (updatedControl) {

        };

        _.getDatabase = function () {
            return this.filteredDatabase;
        };

        _.setFilterField = function (filterField, shouldUpdate) {
            this.filterField = filterField;
            this.filterValue = "";
            document.getElementById ("filterElementTextbox" + this.index).value = "";
            this.update ();
        };

        _.setFilterValue = function (filterValue, shouldUpdate) {
            this.filterValue = filterValue;
            this.update ();
        };

        _.setFieldValue = function (filterField, filterValue) {
            this.filterField = filterField;
            document.getElementById ("filterElementSelectField" + this.index).value = filterField;
            this.filterValue = filterValue;
            document.getElementById ("filterElementTextbox" + this.index).value = "";
        };

        return _;
    } ();

    //------------------------------------------------------------------------------------
    $.SortElement = function () {
        let _ = Object.create ($.Base);

        let makeControls = function (index, field, type, asc, fieldKeys) {
            let innerHTML =
                div ("bedrockElementDiv", makeSelect ("sortElementSelectKey" + index, fieldKeys, field, "SORT FIELD")) +
                div ("bedrockElementDiv", makeSelect ("sortElementSelectType" + index, ["AUTO", "NUMERIC", "ALPHABETIC", "DATE"], type, "SORT TYPE")) +
                div ("bedrockElementDiv", makeSelect ("sortElementSelectAsc" + index, ["ASCENDING", "DESCENDING"], asc, "SORT ASC"));
            return innerHTML;
        };

        _.init = function (parameters) {
            this.index = parameters.index;
            this.owner = parameters.owner;
            this.sortField = parameters.sortField;
            this.sortType = parameters.sortType;
            this.sortAsc = parameters.sortAsc;

            // create the select and editing elements inside the supplied div id
            document.getElementById ("sortElementContainer" + parameters.index).innerHTML = makeControls (parameters.index, this.sortField, this.sortType, this.sortAsc, parameters.fieldKeys);

            return this;
        };


        return _;
    } ();

    //------------------------------------------------------------------------------------
    $.Filter = function () {
        let _ = Object.create ($.Base);

        let conditionValues = function (values, elementCount) {
            values = (typeof values !== "undefined") ? values : [];
            for (let i = values.length; i < elementCount; ++i) {
                values.push ({});
            }
            for (let value of values) {
                value.field = ("field" in value) ? value.field : "";
                value.value = ("value" in value) ? value.value : "";
            }
            return values;
        };

        _.init = function (parameters) {
            this.databaseSource = Database.Source.new (parameters.database);
            this.elementCount = parameters.elementCount;
            this.owner = parameters.owner;
            this.fieldKeys = parameters.fieldKeys;
            this.initialValues = conditionValues (parameters.initialValues, parameters.elementCount);
            return this.reset ();
        };

        _.push = function (index) {
            let filters = this.filters;
            let length = filters.length;
            if ((index + 1) < length) {
                filters[index + 1].update ();
            } else {
                // this was the last one, reverse up the list looking for the last full filter
                while ((filters[index].filterField.length == 0) && (index > 0)) {
                    --index;
                }
                if (filters[index].filterField.length > 0) {
                    ++index;
                }
                if (index < length) {
                    document.getElementById ("filterElementContainer" + index).style.display = "inline-block";
                    while (++index < length) {
                        document.getElementById ("filterElementContainer" + index).style.display = "none";
                    }
                }

                // and finally call the outbound onUpdate
                this.onUpdate (this.getDatabase ());
            }
            return this;
        };

        _.update = function () {
            return this.push (-1);
        };

        _.onValueChange = function (updatedControl) {
            let index = updatedControl.id.match (/\d+$/)[0];
            this.filters[index].onValueChange (updatedControl);
        };

        _.onEnterKey = function (updatedControl) {
            let index = updatedControl.id.match (/\d+$/)[0];
            this.filters[index].onEnterKey (updatedControl);

        };

        _.getDatabase = function () {
            return this.filters[this.filters.length - 1].getDatabase ();
        };

        _.setValues = function (values) {
            let elementCount = this.elementCount;
            let filters = this.filters;
            values = conditionValues (values, elementCount);
            for (let i = 0; i < elementCount; ++i) {
                filters[i].setFieldValue (values[i].field, values[i].value);
            }
            return this.update ();
        };

        _.reset = function () {
            // create the select and editing elements
            let filterContainerHTML = "";
            for (let index = 0; index < this.elementCount; ++index) {
                filterContainerHTML += block ("div", { class: "bedrockElementContainer", id: "filterElementContainer" + index }, "");
            }

            // drop in the clear button
            filterContainerHTML +=
                div ("bedrockElementContainer",
                    div ("bedrockElementDiv",
                        block ("button", { class: "bedrockClearButton", type: "button", onclick: "theFilter.reset ();" }, "CLEAR")
                    )
                );

            document.getElementById ("filterContainer").innerHTML = filterContainerHTML;

            this.filters = [];
            for (let index = 0; index < this.elementCount; ++index) {
                this.filters.push (Database.FilterElement.new ({
                    index: index,
                    fieldKeys: this.fieldKeys,
                    initialValue: this.initialValues[index],
                    databaseSource: (index > 0) ? this.filters[index - 1] : this.databaseSource,
                    owner: this
                }));
            }

            return this.update ();
        };

        return _;
    } ();

    //------------------------------------------------------------------------------------
    $.Sort = function () {
        let _ = Object.create ($.Base);

        _.init = function (parameters) {
            this.elementCount = parameters.elementCount;
            this.owner = parameters.owner;
            this.fieldKeys = Object.keys (Database.getAllFields (parameters.database)).sort ();

            // create the select and editing elements
            let sortContainerHTML = "";
            for (let index = 0; index < this.elementCount; ++index) {
                sortContainerHTML += block ("div", { class: "bedrockElementContainer", id: "sortElementContainer" + index }, "");
            }

            // drop in the clear button
            sortContainerHTML +=
                div ("bedrockElementContainer",
                    div ("bedrockElementDiv",
                        block ("button", { class: "bedrockClearButton", type: "button", onclick: "theSort.reset ();" }, "CLEAR")
                    )
                );

            document.getElementById ("sortContainer").innerHTML = sortContainerHTML;

            this.sorts = [];
            for (let index = 0; index < this.elementCount; ++index) {
                this.sorts.push (Database.SortElement.new ({
                    index: index,
                    fieldKeys: this.fieldKeys,
                    owner: this,
                    sortField: "",
                    sortType: "",
                    sortAsc: ""
                }));
            }

            return this;
        };

        return _;
    } ();

    $.Bedrock = function () {
        let _ = Object.create ($.Base);

        _.init = function (parameters) {
            this.databaseSource = Database.Source.new (parameters.database);
            this.fieldKeys = Object.keys (Database.getAllFields (parameters.database)).sort ();
            this.onUpdate = parameters.onUpdate;

            let innerHTML =
                block ("div", { class: "bedrockGroupContainer", id: "filterContainer" }, "") +
                block ("div", { class: "bedrockGroupContainer", id: "sortContainer" }, "");

            document.getElementById ("bedrockContainer").innerHTML = innerHTML;

            this.filter = Database.Filter.new ({
                databaseSource: this.databaseSource,
                fieldKeys: this.fieldKeys,
                owner: this,
                elementCount: (typeof parameters.filterElementCount !== "undefined") ? parameters.filterElementCount : 2,
                initialValues: parameters.filterValues,

            });

            this.sort = Database.Sort.new ({
                databaseSource: this.databaseSource,
                fieldKeys: this.fieldKeys,
                owner: this,
                elementCount: (typeof parameters.sortElementCount !== "undefined") ? parameters.sortElementCount : 4,
                initialValues: parameters.filterValues,
            });

            this.

            return this;
        };

        return _;
    } ();

    return $;
} ();

// I'd like a better way to do this than exposing a global variable - is it possible to
// make the whole thing re-entrant?
let theFilter;
let makeFilter = function (parameters) {
    theFilter = Database.Filter.new (parameters);
};

let theSort;
let makeSort = function (parameters) {
    theSort = Database.Sort.new (parameters);
};

let SimpleDatabase = function () {
    let _ = Object.create (null);

    // databases = [ "models", "clips" ];
    /**
     * load all of the requested sub-databases into one object
     * @param databaseNames {Array} names of the sub-databases to load
     * @param onReady {Function} what to do when all of the databases are loaded
     */
    _.load = function (databaseNames, onReady) {
        console.log ("loading " + databaseNames.length + " databases");

        let loadDatabase = function (database, name, onReady) {
            console.log ("loading " + name + "...");
            let request = new XMLHttpRequest ();
            request.overrideMimeType ("application/json");
            request.onload = function () {
                // parse the data
                database[name] = JSON.parse (this.responseText);
                console.log ("loaded " + name);
                onReady ();
            };
            let now = new Date ().getTime ();
            request.open ("GET", "data/" + name + ".json?" + now, true);
            request.send ();
        };

        let database = Object.create (null);
        for (let databaseName of databaseNames) {
            loadDatabase (database, databaseName, function () {
                if (Object.keys (database).length == databaseNames.length) {
                    console.log ("loading completed");
                    onReady (database);
                }
            });
        }
    };

    /**
     * match parameters or a wildcard
     * @param records
     * @param match
     * @returns {Array}
     */
    _.filter = function (records, match) {
        let filteredRecords = [];

        // only enumerate the object's own keys
        let matchKeys = Object.keys (match);
        for (let record of records) {
            let matched = true;
            for (let matchKey of matchKeys) {
                let matchValue = match[matchKey];
                matched &= (("*" == matchValue) || (record[matchKey] == matchValue));
            }

            if (matched) {
                filteredRecords.push (record);
            }
        }

        return filteredRecords;
    };

    let sortLexical = function (a, b, type, asc) {
        // start by checking for nulls, they sort to the top
        if (a == null) {
            return (b != null) ? (asc ? -1 : 1) : 0;
        }
        if (b == null) {
            return (asc ? 1 : -1);
        }

        // XXX this might need to be more sophisticated if a sort field is not a
        // XXX string or number (like... an object)
        switch (type) {
            case "number": {
                return asc ? (a - b) : (b - a);
            }
                break;
            case "string": {
                // try to sort the values as numerical if we can
                let na = Number (a);
                let nb = Number (b);
                if ((na == a.toString ()) && (nb == b.toString ())) {
                    return asc ? (na - nb) : (nb - na);
                }

                // sort case-insensitive strings with no spaces
                a = a.replace (/\s*/g, "").toLowerCase ();
                b = b.replace (/\s*/g, "").toLowerCase ();
                return asc ? a.localeCompare (b) : b.localeCompare (a);
            }
                break;
            case "timestamp": {
                let da = new Date (a).valueOf ();
                let db = new Date (b).valueOf ();
                return asc ? (da - db) : (db - da);
            }
                break;
        }

        // the items are equivalent
        return 0;
    };

    /**
     *
     * @param records
     * @param sortFieldArray
     */
    _.sort = function (records, sortFields) {
        let newRecords = records.slice ();
        newRecords.sort (function (a, b) {
            // walk over the sort fields in order
            for (let sortField of sortFields) {
                let sortResult = sortLexical (a[sortField.name], b[sortField.name], sortField.type, sortField.asc);
                if (sortResult != 0) {
                    return sortResult;
                }
            }
            return 0;
        });
        return newRecords;
    };

    return _;
} ();
