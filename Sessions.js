var sessions={};
var sessionsCount=0;
var crypto=require('crypto');
var Cookies=require('./Cookies.js').Cookies;

var Session=function(key, cookies)
{
	var data={};
	var lastAccess=new Date().getTime();
	var session={
		'set': function(name, value)
		{
			if(sessions[key] === undefined)
			{
				sessions[key]=session;
				sessionsCount++;
				cookies.set('sid', key);
			}
			data[name]=value;
		},
		'get': function(name)
		{
			return data[name];
		},
		'destroy': function()
		{
			delete sessions[key];
		},
		'getAll': function()
		{
			return data;
		},
		'access': function()
		{
			lastAccess=new Date().getTime();
		},
		'getLastAccess': function()
		{
			return lastAccess;
		}
	}
	return session;
}

function generateKey()
{
	return crypto.createHash('sha1').update((new Date().getTime())+':'+Math.random()).digest('hex');
}

function Sessions(req, res)
{
	var cookies=Cookies(req, res);
	var key=cookies.get('sid');
	if(key === undefined || sessions[key] === undefined)
	{
		key=generateKey();
		var tempSession=new Session(key, cookies);
		return tempSession;
	}
	sessions[key].access();
	return sessions[key];
}

setInterval(function()
{
	console.log('Running sessions gc (on '+sessionsCount+' sessions)...');
	var deleted=0;
	var now=new Date().getTime();
	for(var i in sessions)
	{
		if(sessions[i].getLastAccess()+10*60*1000 < now)
		{
			delete sessions[i];
			deleted++;
			sessionsCount--;
		}
	}
	console.log(deleted+' sessions cleaned up!');
}, 1000*60*10);

exports.get=Sessions;
exports.getAll=function(){return sessions;};