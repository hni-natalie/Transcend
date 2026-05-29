import { PageHeader, IconTasks } from '@shared';
import { useEffect, useMemo, useState } from 'react';
import { taskApi } from '@features/tasks/task.api';
import { Task } from '@features/tasks/task.types';

const TaskDetailModal = ({
  task,
  onClose,
  onUpdate,
  loading,
}: {
  task: Task;
  onClose: () => void;
  onUpdate: (
    taskId: string,
    data: {
      taskTitle?: string;
      taskPriority?: 'low' | 'medium' | 'high';
      taskDesc?: string;
      taskStatus?: 'not_started' | 'in_progress' | 'done';
      dueDate?: string;
    }
  ) => void;
  loading: boolean;
}) => {

  const [taskTitle, setTaskTitle] = useState(task.taskTitle);
  const [taskDesc, setTaskDesc] = useState(task.taskDesc || '');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>( task.assignedTo?.[0]?.taskPriority || 'medium');
  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'done' >(task.taskStatus);
  const [dueDate, setDueDate] = useState( task.dueDate ? task.dueDate.split('T')[0] : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#1f1f1f] border border-gray-700 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-2xl text-gray-300 hover:text-white"
        >
          ×
        </button>

        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="w-full mb-4 rounded-xl bg-[#2a2a2a] p-4 outline-none text-2xl font-bold"
        />

        <textarea
          value={taskDesc}
          onChange={(e) => setTaskDesc(e.target.value)}
          placeholder="No description"
          className="w-full mb-4 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        />

        <select
          value={taskStatus}
          onChange={(e) =>
            setTaskStatus(e.target.value as 'not_started' | 'in_progress' | 'done')
          }
          className="w-full mb-4 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={taskPriority}
          onChange={(e) =>
            setTaskPriority(e.target.value as 'low' | 'medium' | 'high')
          }
          className="w-full mb-4 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full mb-6 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        />

        <button
          onClick={() =>
            onUpdate(task.taskId, {
              taskTitle,
              taskDesc,
              taskPriority,
              taskStatus,
              dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            })
          }
          disabled={loading || !taskTitle}
          className="w-full rounded-xl bg-lime-300 py-3 font-bold text-black disabled:opacity-50">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

const CreateTaskModal = ({onClose, onSubmit, loading,}:
{

  onClose: () => void;
  onSubmit: (data: {
    taskTitle: string;
    taskPriority: 'low' | 'medium' | 'high';
    taskDescription?: string; }) => void;
  loading: boolean;}) => {

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] =
    useState<'low' | 'medium' | 'high'>('medium');
  const [taskDescription, setTaskDescription] = useState('');

  const handleSubmit = () => {
    onSubmit({
      taskTitle,
      taskPriority,
      taskDescription,
    });
 };

    return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#1f1f1f] border border-gray-700 p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-2xl text-gray-300 hover:text-white"
        >
          ×
        </button>

        <h1 className="text-3xl font-bold mb-6">Create Task</h1>

        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Task title"
          className="w-full mb-4 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        />

        <textarea
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          placeholder="Description"
          className="w-full mb-4 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        />

        <select
          value={taskPriority}
          onChange={(e) =>
            setTaskPriority(e.target.value as 'low' | 'medium' | 'high')
          }
          className="w-full mb-6 rounded-xl bg-[#2a2a2a] p-4 outline-none"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <button
          onClick={handleSubmit}
          disabled={loading || !taskTitle}
          className="w-full rounded-xl bg-lime-300 py-3 font-bold text-black disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </div>
  );
};

const TaskCard = ({ task, onClick, onDelete,}: {
  task: Task;
  onClick: () => void;
  onDelete: (taskId: string) => void;
}) => {
  const priority = task.assignedTo?.[0]?.taskPriority;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      onClick={onClick}
      className="relative p-6 rounded-2xl bg-[#1f1f1f]  shadow-lg hover:border-lime-300 transition-all cursor-pointer"
    >
      <div className="absolute right-6 top-6">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="text-2xl text-gray-300"
      >
        ⋮
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#2a2a2a] border border-gray-700 shadow-xl">
          <button
            onClick={(e) => {
              e.stopPropagation();

              if (window.confirm('Delete this task?')) {
                onDelete(task.taskId);
              }

              setShowMenu(false);
            }}
            className="w-full px-4 py-3 text-left text-red-400 hover:bg-[#333]"
          >
            Delete
          </button>
        </div>
      )}
    </div>

      <h2 className="text-2xl font-semibold mb-3 pr-8">
        {task.taskTitle}
      </h2>

      <p className="text-gray-400 mb-6">
        {task.taskDesc || 'No description'}
      </p>

      <p
        className={`text-lg font-medium ${
          priority === 'high'
            ? 'text-lime-300'
            : priority === 'medium'
            ? 'text-yellow-300'
            : 'text-gray-400'
        }`}
      >
        {priority ? `${priority} Priority` : 'No Priority'}
      </p>

      <p className="text-lg mb-4">
        {task.taskStatus === 'done' ? 'Completed' : 'Due on'}{' '}
        {task.dueDate
          ? new Date(task.dueDate).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })
          : 'No due date'}
      </p>

      <div className="flex -space-x-2">
        <div className="w-10 h-10 rounded-full bg-yellow-300" />
        <div className="w-10 h-10 rounded-full bg-teal-300" />
        <div className="w-10 h-10 rounded-full bg-lime-300" />
      </div>
    </div>
  );
};

const TaskColumn = ({
  title,
  tasks,
  onTaskClick,
  onDelete
}: {
  title: string;
  tasks: Task[];
  onTaskClick: (id: string) => void;
  onDelete: (taskId: string) => void;
}) => {
  return (
    <div>
      <div className="flex items-center justify-between border border-gray-700 rounded-2xl px-6 py-4 mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-2xl font-bold text-lime-300">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <p className="text-content-2">No tasks found.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onClick={() => onTaskClick(task.taskId)}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await taskApi.getAllTasks();
      setTasks(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (id: string) => {
    try {
      setDetailLoading(true);
      setError(null);

      const res = await taskApi.getTaskById(id);

      setSelectedTask(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load task detail');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateTask = async (data: {
    taskTitle: string;
    taskPriority: 'low' | 'medium' | 'high';
    taskDescription?: string; }) => {
    try {
      setCreateLoading(true);
      setError(null);

      await taskApi.createTask({
        ...data,
        workSpaceId: 'b90333e5-6b53-4dfb-87ca-0b5120b5d960',
      });
      await fetchTasks();
      setShowCreateModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    data: {
      taskTitle?: string;
      taskPriority?: 'low' | 'medium' | 'high';
      taskDesc?: string;
      taskStatus?: 'not_started' | 'in_progress' | 'done';
      dueDate?: string;
    }
  ) => {
    try {
      setUpdateLoading(true);
      setError(null);
      
      const updatedTask = await taskApi.updateTask(taskId, data);
      setSelectedTask(null);
      await fetchTasks();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setError(null);

      await taskApi.deleteTask(taskId);
      await fetchTasks();

      setSelectedTask(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };


  // run only in the first render
  useEffect(() => {
    fetchTasks();
  }, []);

  const groupedTasks = useMemo(() => {
    return {
      upcoming: tasks.filter((task) => task.taskStatus === 'not_started'),
      inProgress: tasks.filter((task) => task.taskStatus === 'in_progress'),
      done: tasks.filter((task) => task.taskStatus === 'done'),
    };
  }, [tasks]);

  if (loading) {
    return <p className="p-6">Loading tasks...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-400">{error}</p>;
  }

  return (
    <>
      <div className="flex items-center justify-between px-6">
        <PageHeader
          icon={<IconTasks className="w-7 h-7" />}
          title="Tasks"
        />

        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-full border border-lime-300 px-5 py-2 text-lime-300 font-semibold hover:bg-lime-300 hover:text-black"
        >
          + Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
        <TaskColumn
          title="Upcoming"
          tasks={groupedTasks.upcoming}
          onTaskClick={handleTaskClick}
          onDelete={handleDeleteTask}
        />

        <TaskColumn
          title="In Progress"
          tasks={groupedTasks.inProgress}
          onTaskClick={handleTaskClick}
          onDelete={handleDeleteTask}
        />

        <TaskColumn
          title="Done"
          tasks={groupedTasks.done}
          onTaskClick={handleTaskClick}
          onDelete={handleDeleteTask}
        />
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-content-50 p-8">
            Loading task detail...
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          loading={updateLoading}
        />
      )}

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          loading={createLoading}
        />
      )}
    </>
  );
};

