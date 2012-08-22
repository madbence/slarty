function Job(job, onComplete)
{
	var finished=false;
	var that={
		'finish': function(result)
		{
			finished=true;
			onComplete(result);
		},
		'run': function()
		{
			job(that);
		}
	}
	return that;
}

function paralell(jobs, onComplete)
{
	var all=Object.keys(jobs).length,finished=0,results={};
	for(var i in jobs)
	{
		jobs[i]=new Job(jobs[i], function(n)
		{
			return function(result)
			{
				results[n]=result;
				finished++;
				if(finished === all)
				{
					onComplete(results);
				}
			};
		}(i));
		jobs[i].run();
	}
}

exports.paralell=paralell;