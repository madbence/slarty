var mongodb=require('mongodb'),
	mongoserver=new mongodb.Server('localhost', mongodb.Connection.DEFAULT_PORT),
	db_connector=new mongodb.Db('fw', mongoserver),
	db=null;
db_connector.open(function(err, database)
{
	if(err)
	{
		return console.log(err);
	}
	console.log('Connected to db.');
	db=database;
});

var API={
	'get': function(coll, query, options, fn)
	{
		if(typeof options === 'function')
		{
			fn=options;
			options={};
		}
		if(db === null)
		{
			return fn({'message': 'Database is offline!'}, null);
		}
		db.collection(coll, function(err, collection)
		{
			if(err)
			{
				return fn({'message': 'Database error!', 'original': err});
			}
			collection.find(query, options, function(err, items)
			{
				if(err)
				{
					return fn({'message': 'Database error!', 'original': err},null);
				}
				items.toArray(function(err,items)
				{
					if(err)
					{
						return fn({'message': 'Database error!', 'original': err},null);
					}
					fn(err, items);
				});
			});
		});
	},
	'getOne': function(coll, query, options, fn)
	{
		if(typeof options === 'function')
		{
			fn=options;
			options={};
		}
		if(db === null)
		{
			return fn({'message': 'Database is offline!'}, null);
		}
		db.collection(coll, function(err, collection)
		{
			if(err)
			{
				return fn({'message': 'Database error!', 'original': err});
			}
			collection.findOne(query, options, function(err, item)
			{
				if(err)
				{
					return fn({'message': 'Database error!', 'original': err},null);
				}
				fn(err, item);
			});
		});
	},
	'count': function(coll, query, fn)
	{
		if(db === null)
		{
			return fn({'message': 'Database is offline!'}, null);
		}
		db.collection(coll, function(err, collection)
		{
			if(err)
			{
				return fn({'message': 'Database error!', 'original': err});
			}
			collection.count(query, function(err, count)
			{
				if(err)
				{
					return fn({'message': 'Database error!', 'original': err},null);
				}
				fn(err, count);
			});
		});
	},
	'insert': function(coll, obj, fn)
	{
		if(db === null)
		{
			return fn({'message': 'Database is offline!'}, null);
		}
		db.collection(coll, function(err, collection)
		{
			if(err)
			{
				return fn({'message': 'Database error!', 'original': err});
			}
			collection.insert(obj, {'safe': true}, function(err, result)
			{
				if(err)
				{
					return fn({'message': 'Database error!', 'original': err},null);
				}
				fn(err, result);
			});
		});
	}
}

exports.API=API;