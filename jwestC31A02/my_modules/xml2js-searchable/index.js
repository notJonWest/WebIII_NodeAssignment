let searchable =  {
    data:
    {
        charKey: "_",
        attrKey: "$",
        acceptedTerms: {},
        // An example of an entry in acceptedTerms will look like this
        // "fileName":
        // {
        //      "_" : ["tagName"], //List all accepted tags
        //      "$": ["attrName"], //List all accepted attributes
        // }
    },
    charKey: newKey =>
    {
        if (newKey === undefined)
            return searchable.data.charKey;
        else if (typeof newKey !== "string")
            throw new Error("charKey must be a string.");
        else
            return searchable.data.charKey = newKey;
    },
    attrKey: newKey =>
    {
        if (newKey === undefined)
            return searchable.data.attrKey;
        else if (typeof newKey !== "string")
            throw new Error("attrKey must be a string.");
        else
            return searchable.data.attrKey = newKey;
    },

    /**
     * Add an entry
     * @param fileName: The filename of the file that is being searched, without the extension
     * @param cArr: List of tags that can be searched for
     * @param aArr: List of attributes that can be searched for
     * @returns {undefined|searchable.data.acceptedTerms}
     */
    terms: (fileName, cArr, aArr) =>
    {
        if (fileName === undefined)
            throw new Error("The filename must be provided.");
        else if (typeof fileName !== "string")
            throw new Error("The filename must be a string.");
        //If only one of the arrays is undefined,
        // that means that the user is not trying to return the terms,
        // but is trying to add a new entry that does not accept either
        // chars or attributes.
        if (cArr === undefined && aArr !== undefined)
            cArr = [];
        else if (cArr !== undefined && aArr === undefined)
            aArr = [];
        //If both are undefined, then the user is trying to return the terms
        else if (cArr === undefined && aArr === undefined)
            return searchable.data.acceptedTerms[fileName];

        if (!(cArr instanceof Array))
            cArr = [cArr];
        if (!(aArr instanceof Array))
            aArr = [aArr];
        if (cArr.concat(aArr).every(el => typeof el === "string"))
        {
            searchable.data.acceptedTerms[fileName] = {};
            searchable.data.acceptedTerms[fileName][searchable.data.charKey] = cArr;
            searchable.data.acceptedTerms[fileName][searchable.data.attrKey] = aArr;
            return searchable.data.acceptedTerms[fileName];
        }
        else
            throw new Error("Every accepted term must be a string.");
    } //acceptedTerms

};

module.exports =
{
    charKey: searchable.charKey,
    attrKey: searchable.attrKey,
    terms: searchable.terms,
    acceptedTerms: (fileName) => //Return all accepted terms for that file
        searchable.data.acceptedTerms[fileName][searchable.attrKey()]
            .concat(searchable.data.acceptedTerms[fileName][searchable.charKey()]),
    acceptedFiles: () => Object.keys(searchable.data.acceptedTerms)
};