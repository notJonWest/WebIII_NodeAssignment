let user = function()
{
    let data =
    {
        firstName: "unknown",
        lastName: "unknown",
        username: "unknown",
        emailAddress: "none@nodomain.com",
        phoneNum: "000-000-0000"
    };

    return {
        fill: obj => {
            if (obj)
                for (let key in data)
                    data[key] = obj[key];
        },
        firstName: fn => {
            if (fn === undefined)
                return data.firstName;
            else
                return data.firstName = fn;
        },
        lastName: ln => {
            if (ln === undefined)
                return data.lastname;
            else
                return data.lastname = ln;
        },
        username: un => {
            if (un === undefined)
                return data.username;
            else
                return data.username = un;
        },
        emailAddress: em => {
            if (em === undefined)
                return data.emailAddress;
            else
                return data.emailAddress = em;
        },
        phoneNum: phn => {
            if (phn === undefined)
                return data.phoneNum;
            else
                return data.phoneNum = phn;
        },
        data: () => data,
    }
};

module.exports =
{
    create: obj =>
    {
        let newUser = new user();
        newUser.fill(obj);
        return newUser;
    }
};

//Make this module such that there's a constructor...