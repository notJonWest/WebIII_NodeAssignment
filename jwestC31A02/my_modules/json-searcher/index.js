let searcher =  {
    data:
    {
        flds: {}, //Object of filenames and acceptable search fields
        // An example of an entry in flds will look like this
        // "fileName":
        // {
        //      "std": [array of standard fields],
        //      "numeric": {
        //          "fld1": "defaultSorter" //see sorters options
        //           }
        // }
        sorters: //Returns compared
        {
            ">": (val, comp) => val>comp,
            ">=": (val, comp) => val>=comp,
            "=": (val, comp) => val.toString()===comp.toString(),
            "<=": (val, comp) => val<=comp,
            "<": (val, comp) => val<comp

        },
        charToMath:
        {
            "l": "<",
            "g": ">",
            "e": "=",
            "ge": ">=",
            "le": "<="
        },
        allSorters: () => Object.keys(searcher.data.sorters)
            .concat(Object.keys(searcher.data.charToMath)),
        isSorter: str => searcher.data.allSorters().includes(str),
    },

    fields: (fileName, field) =>
    {
        if (fileName === undefined || field === undefined)
            return searcher.data.flds;
        else if (typeof fileName !== "string")
            throw new Error("The filename must be a string.");
        else
        {
            if (field.numeric !== undefined)
                for (let sorter in field.numeric)
                    field.numeric[sorter] = field.numeric[sorter].toLowerCase();
                if (Object.values(field.numeric).every(el =>
                    searcher.data.allSorters().includes(el)))
                {
                    searcher.data.flds[fileName] = field;
                }
                else
                {
                    throw new Error("Invalid numeric value. The value must indicate how" +
                        "other objects will be compared to this field. The options are:\n" +
                        searcher.data.allSorters().toString());
                }
        }
    }, //fields

};

module.exports =
{
    files: () => Object.keys(searcher.data.flds),
    fields: searcher.fields,
    compare: srt => searcher.data.sorters[srt],
    sorters: () => searcher.data.allSorters(),
    isSorter: searcher.data.isSorter,
    toMath: str => {
        if (searcher.data.isSorter(str))
            if (searcher.data.charToMath[str])
                return searcher.data.charToMath[str];
            else
                return str;
    },
    acceptedFields: (fileName) =>
        Object.keys(searcher.data.flds[fileName].numeric)
            .concat(searcher.data.flds[fileName].std),
};