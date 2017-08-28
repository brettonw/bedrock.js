# DEPRECATED

Bedrock.js is now Bedrock (https://github.com/brettonw/Bedrock)


# bedrock.js
Base Javascript code for websites.

 https://brettonw.github.io/bedrock.js/
 
## Style Guide
### Names
- All Javascript variable names and function names should be lower-camel case. 
- All Javascript class names should be capital-camel case.
- All constant values should be all upper-case with underscores as word separators.

#### JS:

    // this is a constant
    const MY_CONSTANT_VALUE = "hello world";
     
    // this is an Object declaration used as a class prototype
    let MyClass = function () {
        // this is a private static variable
        let myJsVariableName = MY_CONSTANT_VALUE;
    } ();
    

#### JS

All HTML Element Ids, and CSS Class Names should be lowercase, dash separated.

#### HTML:

    <div id="my-div-id">blah</div>

#### CSS:

    .my-css-class { width: 100%; }
    
