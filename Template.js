var cache={};
var fs=require('fs');

function get(name)
{
	return cache[name] || (cache[name]=new Template(name));
}

setInterval(function()
{
	for(var i in cache)
	{
		cache[i]=new Template(i);
	}
}, 2000);

exports.get=get;

function Template(name)
{
	var content=fs.readFileSync('./templates/'+name, 'utf-8');
	var variables={};
	var asArray=false;
	var variableArray=null;
	var renderedContent=null;
	var template={
		'getVariables': function()
		{
			return variables;
		},
		'addVariable': function(nname, value, replace)
		{
			if(!replace && variables[nname] !== undefined)
			{
				//console.log(name, nname, 'exists!');
				return template;
			}
			variables[nname]=value;
			return template;
		},
		'addVariables': function(obj, replace)
		{
			for(var i in obj)
			{
				template.addVariable(i, obj[i], replace);
			}
			return template;
		},
		'setVariableArray': function(arr)
		{
			variableArray=arr;
			asArray=true;
			return template;
		},
		'render': function()
		{
			console.log('rendering '+name);
			if(asArray)
			{
				var temp='';
				for(var i in variableArray)
				{
					template.addVariables(variableArray[i], true)
					temp+=doReplace(content, variables);
				}
				return temp;
			}
			return doReplace(content, variables);
		},
		'toString': function()
		{
			return template.render();
		}
	}
	return template;
}

function doReplace(str, variables)
{
	var replacerFunc=function()
	{
		var name=arguments[1];
		var decorator=arguments[3];
		if(decorator === undefined)
		{
			if(variables[name] === undefined)
			{
				return '{'+name+'}';
			}
			if(typeof variables[name] === 'function')
			{
				return variables[name]();
			}
			if(typeof variables[name].render === 'function')
			{
				//console.log('passing variables to '+name);
				variables[name].addVariables(variables);
				//console.log(name+' now has variables ', variables[name].getVariables());
				return variables[name].render();
			}
			return variables[name];
		}
		switch(decorator)
		{
			case 'date': 
				var date=new Date(variables[name]);
				return date.getFullYear()+'.'+
					(date.getMonth()<9?'0':'')+(date.getMonth()+1)+'.'+
					(date.getDate()<10?'0':'')+date.getDate()+'. '+
					(date.getHours()<10?'0':'')+date.getHours()+':'+
					(date.getMinutes()<10?'0':'')+date.getMinutes();
			case 'time':
				var date=variables[name];
				return Math.floor(date/24/60/60)+':'+Math.floor(date/60/60%24)+':'+Math.floor(date/60%60)+':'+(date%60);
			default: return variables[name];
		}
	}
	var controlReplacerFunc=function()
	{
		switch(arguments[1])
		{
			case 'if':
				return variables[arguments[2]] === true ? arguments[3] : '';
			default:
				return arguments[0];
		}
	}
	return str.replace(/\{(if):(\w.*?)\}([\s\S]*?)\{\/\1:\2\}/g, controlReplacerFunc).replace(/\{([\w]*?)(\|(.*?))?\}/g, replacerFunc);
}