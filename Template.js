var cache={};
var fs=require('fs');

function Template(file)
{
	var content=fs.readFileSync('./templates/'+file, 'utf-8');
	var template={
		'render': function(obj)
		{
			var replacerFunc=function()
			{
				var name=arguments[1];
				var decorator=arguments[3];
				if(decorator === undefined)
				{
					return obj[name] === undefined ? '{'+name+'}' : obj[name];
				}
				switch(decorator)
				{
					case 'date': 
						var date=new Date(obj[name]);
						return date.getFullYear()+'.'+
							(date.getMonth()<9?'0':'')+(date.getMonth()+1)+'.'+
							(date.getDate()<10?'0':'')+date.getDate()+'. '+
							(date.getHours()<10?'0':'')+date.getHours()+':'+
							(date.getMinutes()<10?'0':'')+date.getMinutes();
					case 'time':
						var date=obj[name];
						return Math.floor(date/24/60/60)+':'+Math.floor(date/60/60%24)+':'+Math.floor(date/60%60)+':'+(date%60);
					default: return obj[name];
				}
			}
			if(obj instanceof Array)
			{
				var temp='';
				for(var i in obj)
				{
					var temp2=obj;
					var obj=obj[i];
					temp+=content.replace(/\{([\w]*?)(\|(.*?))?\}/g, replacerFunc);
					obj=temp2;
				}
				return temp;
			}
			return content.replace(/\{([\w]*?)(\|(.*?))?\}/g, replacerFunc);
		}
	};
	return template;
}

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