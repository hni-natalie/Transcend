import { PageHeader, IconTasks } from '@shared';
import { use, useEffect, useMemo, useState } from 'react';
import { taskApi } from '@features/tasks/task.api';
import { Task } from '@features/tasks/task.types';

// import features 

export const Tasks = () => {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTasks = async () => {
		try {
			setLoading(true);
			const res = await taskApi.getAllTasks();
			setTasks(res);

		}
		catch (err: any) {
			setError(err.message || 'Failed to load tasks');
		} finally {
			setLoading(false);
		}
	};
	
	useEffect(() => {
		fetchTasks();
	}, []);

	if (loading) {
		return <p>Loading tasks...</p>;
	}
	if (error) {
    	return <p>{error}</p>;
  	}

	return (
  <>
    <PageHeader
      icon={<IconTasks className="w-7 h-7" />}
      title="Tasks"
    />

    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>

      {tasks.length === 0 ? (
        <p className="text-content-2">No tasks found.</p>
      ) : (
        <div className="space-y-6">
          {tasks.map((task) => (
            <div
			  key={task.id}
			  className="relative border p-6 rounded-lg bg-content-50 hover:bg-content-100 transition-colors"
			>
              {/* 3 dots */}
              <button className="absolute right-6 top-6 text-2xl text-gray-300">
                ⋮
              </button>

              {/* Title */}
              <h2 className="text-3xl font-semibold mb-4">
                {task.taskTitle}
              </h2>

              {/* Description */}
              <p className="text-xl text-gray-400 mb-8">
                {task.taskDesc || "No description"}
              </p>

              {/* Priority */}
              <p className="text-2xl text-lime-300 mb-2">
                {task.assignedTo?.[0]?.taskPriority
                  ? `${task.assignedTo[0].taskPriority} Priority`
                  : "No Priority"}
              </p>

              {/* Due date */}
              <p className="text-2xl font-medium mb-4">
                Due{" "}
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No due date"}
              </p>

              {/* Avatar circles */}
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-yellow-300" />
                <div className="w-12 h-12 rounded-full bg-teal-300" />
                <div className="w-12 h-12 rounded-full bg-lime-300" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);

//   return (
// 	<>
// 	  <PageHeader 
// 		icon={<IconTasks className="w-7 h-7" />}
// 		title="Tasks"
// 	  />
// 	  <div className="flex items-center justify-center h-full">
// 		<h1 className="text-2xl font-bold">Tasks</h1>
// 		{tasks.length === 0 ? (
// 			<p>No tasks found.</p>
// 		) : (
// 			tasks.map(task => (
// 				<div key={task.id} className="border p-4 rounded mb-2 w-full max-w-md">
// 					<h2 className="text-lg font-semibold">{task.taskTitle}</h2>
// 					<p> {task.taskDescription}</p>
// 					<p>Priority: {task.assignedTo?.[0]?.taskPriority}</p>
// 					<p>Status: {task.taskStatus}</p>
// 					<p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
// 					<p>Created: {new Date(task.createdAt).toLocaleDateString()}</p>
// 					<p>Updated: {new Date(task.updatedAt).toLocaleDateString()}</p>
// 				</div>
// 			))
// 		)
// 		}
// 	  </div>
// 	</>
//   );
};

