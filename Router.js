function Router()
{
	var routes=[];
	var that={
		'addRoute': function(route, handler, options)
		{
			routes.push({
				'route': new Route(route, options),
				'handler': handler
			});
		},
		'getHandler': function(req)
		{
			for(var i in routes)
			{
				var route=routes[i];
				if(req.method !== route['route'].getOptions()['method'])
				{
					continue;
				}
				var match=null;
				if(match=route['route'].match(req.url))
				{
					return [route, match];
				}
			}
			return match;
		}
	}
	return that;
}

var filters={
	'number': function()
	{
		return '([1-9]\d*)';
	},
	'alpha': function()
	{
		return '([a-zA-Z])';
	},
}

var slugPrefix=':';
var slugReplacer=new RegExp(slugPrefix+'(\\w+)', 'g');

function Route(path, options)
{
	var options=options||{};
	var regExp=null;

	if(path.charAt(path.length-1) !== '/')
	{
		path+='/';
	}
	
	function getFilter(name)
	{
		if(options[name] === undefined)
		{
			return '(\\w+)';
		}
		if(filters[options[name]] === undefined)
		{
			throw new Error('Filter \''+options[name]+'\' not exists.');
		}
		return filters[options[name]];
	}

	var that={
		'getRaw': function()
		{
			return path;
		},
		'getRegexp': function()
		{
			return regExp || (regexp=new RegExp('^'+path.replace(slugReplacer, function()
			{
				return getFilter(arguments[1]);
			})+'$'));
		},
		'getSlugs': function()
		{
			return path.match(slugReplacer);
		},
		'match': function(str)
		{
			var m=str.match(that.getRegexp());
			if(m === null)
			{
				return false;
			}
			var slugs=that.getSlugs();
			var res={};
			for(var i in slugs)
			{
				var slug=slugs[i].substr(1);
				res[slug]=m[parseInt(i)+1];
			}
			return res;
		},
		'getOptions': function()
		{
			return options;
		}
	}
	return that;
}

exports.Router=Router;
exports.Route=Route;