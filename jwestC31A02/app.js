const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const mst = require("mustache");
const SRCH = require("./my_modules/xml2js-searchable");
const JSONSRCH = require("./my_modules/json-searcher");
const QS = require("querystring");
const PORT = 9000;

const DEFAULT_FILE = "index.html";
const DEFAULT_FILE_2 = "default.html";
const ROOTDIR = "../jwestC31A02root/public/";
const ERRDIR = "../jwestC31A02root/errorpages/";
const LOG_FILE = "../jwestC31A02data/logs/web.log";

const extToMIME = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".svg": "image/svg+xml",
    ".xml": "text/xml",
    ".txt": "text/plain",
    ".ico": "image/x-icon",
    ".json": "application/json"
};

const statusMsgs = {
    200: "OK",
    400: "Bad Request", //Expecting certain extension
    404: "Not Found",
    406: "Not Acceptable",
    415: "Unsupported Media Type",
    416: "Range not satisfiable", //No matching record found
    500: "Internal Server Error",
    520: "Writing Error",
};

SRCH.terms("stocksOld", ["sName", "rating"], ["sSymbol"]); //Because I CAN filter attributes
SRCH.terms("stocks", ["sName", "rating", "sSymbol"]);

JSONSRCH.fields("cars", {
    numeric: {
        "cost": "le",
        "year": "="
    },
    std: ["model", "make", "condition"]
});

http.createServer((req, res)=>
{
    let now = new Date(); //Request time

    let statusCode = 200;
    let content = "Unknown";
    let contentType = extToMIME[".txt"];

    let urlObj = url.parse(req.url, true);
    let filePath = path.parse(urlObj.pathname);
    let fullDir = path.join(ROOTDIR, filePath.dir);

    let newUrlPath = (...newUrl) =>
    {
        urlObj = url.parse(path.join(...newUrl), true);
        filePath = path.parse(urlObj.pathname);
        fullDir = path.join(filePath.dir);
    };

    let writeToLogFile = () =>
    {
        let logArr = [
            now.toISOString().replace('T', ' ').substr(0, 19),
            urlObj.path,
            statusCode,
            statusMsgs[statusCode]
        ];
        fs.appendFile(LOG_FILE, logArr.join("; ") + "\r\n", (logErr) => {
            if (logErr)
                console.log(logErr);
        });
    };
    /**
     * Sends default response and writes to the log file
     * @param sCode: status code
     * @param cType: content-type
     * @param cont: response content
     * @param _res: response object
     */
    let finishResponse = (sCode = statusCode, cType = contentType, cont = content, _res = res) =>
    {
        //Make variables consistent
        statusCode = sCode;
        contentType = cType;
        content = cont;
        sendResponse(_res, sCode, cont, cType);
        writeToLogFile();
    };

    if (req.method === "GET")
    {
        if (urlObj.pathname.substring(0, 5) === "/bin/") {
            newUrlPath("../jwestC31A02data/", filePath.base, urlObj.search); //Begin looking in data folder
            if (filePath.ext !== ".xml")
                statusCode = 400;
            else if (fs.existsSync(path.join(fullDir, filePath.base)))
                if (Object.keys(urlObj.query).length === 0)
                    statusCode = 406;
        }

        if (extToMIME[filePath.ext] === undefined)
        {
            if (filePath.ext === '')
            {
                let srchInfo = urlObj.pathname.split("/");
                srchInfo.shift(); //remove the empty string
                if (JSONSRCH.files().includes(srchInfo[0])) //If the file is expected to be in the data folder
                    newUrlPath("../jwestC31A02data/", srchInfo[0] + ".json", `?${srchInfo[1]}=${srchInfo[2]}&sorter=${srchInfo[3]}`);
                else
                    if (fs.existsSync(path.join(fullDir, filePath.base, DEFAULT_FILE)))
                        newUrlPath(fullDir, filePath.base, DEFAULT_FILE);
                    else if (fs.existsSync(path.join(fullDir, filePath.base, DEFAULT_FILE_2)))
                        newUrlPath(fullDir, filePath.base, DEFAULT_FILE_2);
                    else
                        statusCode = 404;
            } //if ext === ''
            else
                statusCode = 415;
        } //if extToMIME[ext] === undefined

        fs.readFile(path.join(fullDir, filePath.base), (err, data) =>
        {
            if (statusCode !== 200)
                finishResponse();
            else if (err)
            {
                if (err.code === "ENOENT")
                    if (filePath.base === "favicon.ico")
                    {
                        res.end(); //End response if favicon.ico does not exist
                        writeToLogFile();
                    }
                    else
                        statusCode = 404;
                else {
                    console.log(err.code);
                    statusCode = 500;
                }
                finishResponse();
            } //if(err)
            else
            {
                contentType = extToMIME[filePath.ext];
                if (fullDir === path.join("../jwestC31A02data")) //Switched when url is checked for /bin/
                {
                    let searchResults = {
                        "record": [],
                    };
                    if (filePath.ext === ".xml")
                    {
                        if (SRCH.acceptedFiles().includes(filePath.name))
                        {
                            let termResults = []; //Contains arrays of records that matched certain terms
                            contentType = extToMIME[".html"];

                            xml2js.parseString(data,
                                {
                                    trim: true,
                                    explicitCharkey: true,
                                    charkey: SRCH.charKey(),
                                    attrkey: SRCH.attrKey(),
                                },
                                (err, obj) =>
                                {
                                    if (err)
                                    {
                                        console.log(err);
                                        finishResponse(500);
                                    }
                                    else
                                    {
                                        // Assume all xml files accepted in server database must have
                                        // a "dataset" element containing every "record" element
                                        let records = obj.dataset.record; //Array of every record

                                        //Check that every query is an acceptable term
                                        if (Object.keys(urlObj.query).every(term => SRCH.acceptedTerms(filePath.name).includes(term)))
                                        {
                                            for (let term in urlObj.query) //Loop through each query
                                            {
                                                let srchKeys = [SRCH.charKey(), SRCH.attrKey()];
                                                for (let i = 0; i < srchKeys.length; i++)
                                                {
                                                    //Check that the term is an accepted term defined in SRCH.terms
                                                    if (SRCH.terms(filePath.name)[srchKeys[i]].includes(term))
                                                    {
                                                        let passedRecs = [];
                                                        for (let rec of records) {
                                                            if (srchKeys[i] === SRCH.charKey())
                                                            {
                                                                // If the searched term matches any of the same terms in the data,
                                                                // add the record to an array
                                                                // This is useful for when there are mutiple children of the same tag name
                                                                // e.g. check every for every "class" element in a student element
                                                                if (rec[term].some(el => el[SRCH.charKey()] === urlObj.query[term]))
                                                                    passedRecs.push(rec);
                                                            }
                                                            else if (srchKeys[i] === SRCH.attrKey())
                                                            {
                                                                for (let tag in rec)
                                                                    for (let inst in rec[tag]) //Loop through each instance of a tag
                                                                        if (rec[tag][inst][SRCH.attrKey()] !== undefined) //Check if the current tag has attributes
                                                                            if (rec[tag][inst][SRCH.attrKey()][term] === urlObj.query[term])
                                                                                passedRecs.push(rec);
                                                            }
                                                            else
                                                                finishResponse(500);
                                                        }
                                                        if (passedRecs.length > 0)
                                                            termResults.push(passedRecs);
                                                    }
                                                }
                                            }

                                            //Now that termResults holds arrays of every entry that matched ANY of the search terms
                                            //we now remove all of the entries that are not in every one
                                            //i.e. only keep entries that matched every search term
                                            for (let i = 0; i < termResults.length; i++) //Loop through array of arrays containing entries that matched ANY of the terms
                                                for (let j = 0; j < termResults[i].length; j++) //Loop through every entry that matched ANY of the terms
                                                    if (!searchResults.record.includes(termResults[i][j])) //Don't check/add if the entry is already in the results
                                                    {
                                                        let inAll = true;
                                                        let k = 0;
                                                        while (inAll && k < termResults.length) //Loop through the array of entries that matched ANY term
                                                        {
                                                            /*
                                                             * If the current entry (termResults[i][j]) is missing from any of the array
                                                             * inAll (short for "In all of the arrays") will be flagged as false.
                                                             * The loop will end and the current entry will not be added to searchResults.
                                                             * Otherwise, if inAll remains true, the current entry will be added to searchResults.
                                                             */
                                                            inAll = termResults[k].includes(termResults[i][j]);
                                                            k++;
                                                        }
                                                        if (inAll)
                                                            searchResults.record.push(termResults[i][j]);
                                                    }
                                            if (searchResults.record.length > 0)
                                            {
                                                let readableStream = fs.createReadStream(`./templates/${filePath.name}.mst`);
                                                let template = "";
                                                readableStream.setEncoding("utf8");
                                                readableStream.on("data", chunk => {
                                                    template += chunk;
                                                });
                                                readableStream.on("end", () => {
                                                    content = mst.to_html(template, searchResults);
                                                    finishResponse();
                                                });
                                            }
                                            else
                                                finishResponse(416);
                                        } //If all urlObj.query is in SRCH.terms
                                        else
                                            finishResponse(416);
                                    } //no err in xml2js parse
                                }); //parser.parseString callback
                        } //If SRCH.acceptedFiles includes filePath.name
                        else
                            finishResponse(404);
                    } //if file ext is .xml
                    else if (filePath.ext === ".json")
                    {
                        let key = Object.keys(urlObj.query)[0];
                        let obj = JSON.parse(data);
                        for (let ent of obj)
                        {
                            if (Object.keys(JSONSRCH.fields()[filePath.name].numeric).includes(key))
                            {
                                let sorter = urlObj.query.sorter;
                                if (!JSONSRCH.isSorter(sorter))
                                    sorter = JSONSRCH.fields()[filePath.name].numeric[key]; //Change to default
                                sorter = JSONSRCH.toMath(sorter);
                                if (JSONSRCH.compare(sorter)(ent[key], urlObj.query[key]))
                                    searchResults.record.push(ent);

                            }
                            else if (JSONSRCH.fields()[filePath.name].std.includes(key))
                            {
                                if (ent[key].toLowerCase() === urlObj.query[key].toLowerCase())
                                    searchResults.record.push(ent);
                            }
                        }
                        if (searchResults.record.length > 0)
                        {
                            searchResults.record.sort((a, b) => (a[key] > b[key]) ? -1 : 1);
                            content = JSON.stringify(searchResults.record);
                        }
                        else
                        {
                            statusCode = 416;
                        }
                        finishResponse();
                    }
                    else
                        finishResponse(400);

                } //if (fullDir is "../jwestC31A02data")
                else
                {
                    content = data;
                    finishResponse();
                }
            } //No err in readFile
        }); //fs.readFile
    } //if method is GET
    else if (req.method === "POST")
    {
        contentType = extToMIME[".html"];
        let data = "";
        req.on("data", chunk => {
            data += chunk.toString();
        });
        req.on("end", () => {
            let reqHeaders = QS.parse(data);
            let parser = require(`./my_modules/postParsers/${reqHeaders.module}`);
            let infoObj = parser.create(reqHeaders);
            content = JSON.stringify(infoObj.data());
            fs.appendFile(`../jwestC31A02data/${reqHeaders.save}`, Object.values(infoObj.data()).join(", ") + "\r\n", (postErr) =>
            {
                if (postErr)
                    finishResponse(520);
                else
                {
                    if (fs.existsSync(`./templates/${reqHeaders.temp}`))
                    {
                        let readableStream = fs.createReadStream(`./templates/${reqHeaders.temp}`);
                        let template = "";
                        readableStream.setEncoding("utf8");
                        readableStream.on("data", chunk => {
                            template += chunk;
                        });
                        readableStream.on("end", () => {
                            content = mst.to_html(template, infoObj.data());
                            finishResponse();
                        });
                        readableStream.on("error", () => {
                            finishResponse(500);
                        });
                    }
                    else
                        finishResponse(404);
                } //if not err
            }); //append to save file
        }); //req.on end
    } //if method is POST
}).listen(PORT); //http.createServer

let sendResponse = (res, sCode, cont, cType) =>
{
    console.log(sCode);
    if (sCode !== 200)
    {
        let errorCont = cont;
        fs.readFile(path.join(ERRDIR, `${sCode}.html`), (err, data) =>
        {
            if (err) {
                cType = extToMIME[".txt"];
                cont = `${sCode}: ${statusMsgs[sCode]}`;
            }
            else {
                cType = extToMIME[".html"];
                cont = data;
            }

            res.writeHead(sCode, {
                "Content-Type": cType,
                "Failed-Content": errorCont,
                "Accept-Ranges": "none"

            });
            res.end(cont);
        });
    }
    else
    {
        res.writeHead(sCode, {
            "Content-Type": cType
        });
        res.end(cont);
    }
}; //sendResponse