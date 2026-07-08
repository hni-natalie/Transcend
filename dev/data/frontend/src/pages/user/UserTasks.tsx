import { PageHeader, IconTasks, InputDropdown, InputText, IconTaskAdd } from '@shared';
import { useEffect, useMemo, useState } from 'react';
import { taskApi } from '@features/tasks/task.api';
import { Task } from '@features/tasks/task.types';
import { InputTextArea } from '@/shared/ui/InputTextArea';
import { InputDropdownChecklist } from '@/shared/ui/InputDropdownChecklist';
import { DropdownChoice } from '@/shared/types/ui.types';

type TaskMember = {
  userId: string;
  userName: string;
  userEmail?: string;
};

const taskStatusOptions : DropdownChoice[] = [
	{ id: 'not_started', name: 'Not Started' },
	{ id: 'in_progress', name: 'In Progress' },
	{ id: 'done', name: 'Done' }
];
const taskPriorityOptions : DropdownChoice[] = [
	{ id: 'low', name: 'Low Priority' },
	{ id: 'medium', name: 'Medium Priority' },
	{ id: 'high', name: 'High Priority' }
];

const TaskDetailModal = ({task, onClose, onUpdate, loading,}: {
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
    }) => void;
  loading: boolean;}) => {

  const [taskTitle, setTaskTitle] = useState(task.taskTitle);
  const [taskDesc, setTaskDesc] = useState(task.taskDesc || '');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>( task.assignedTo?.[0]?.taskPriority || 'medium');
  const [taskStatus, setTaskStatus] = useState<'not_started' | 'in_progress' | 'done' >(task.taskStatus);
  const [dueDate, setDueDate] = useState( task.dueDate ? task.dueDate.split('T')[0] : '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col gap-y-4 w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-[1.5rem] bg-[#1b1b1b] border border-[#242424] px-8 py-7 shadow-2xl text-gray-200">
        <button
          onClick={onClose}
          className="close-right"
        >
          ×
        </button>
        <div className='flex flex-col gap-y-2 items-center justify-center text-center text-4xl'>
          <IconTasks className='text-white w-6 h-6' />
          <h1 className="font-medium text-accent-lime">Edit Task</h1>
        </div>

        <InputText
          title='Title'
          type='text'
          placeholder='Task Title'
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <InputTextArea
          title='Description'
          value={taskDesc}
          onChange={(e) => setTaskDesc(e.target.value)}
          placeholder="No description"
        />
        <InputDropdown
          title='Status'
          choices={taskStatusOptions}
          value={taskStatus}
          onChange={(e) =>
            setTaskStatus(e.target.value as 'not_started' | 'in_progress' | 'done')
          }
          placeholder='--- Select Task Status ---'
          className='appearance-auto'
        />
        <InputDropdown
          title='Priority'
          choices={taskPriorityOptions}
          value={taskPriority}
          onChange={(e) =>
            setTaskPriority(e.target.value as 'low' | 'medium' | 'high')
          }
          placeholder='--- Select Task Priority ---'
          className='appearance-auto'
        />
        <InputText 
          title='Due Date'
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          type='date'
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

  const CreateTaskModal = ({onClose, onSubmit, loading}:
  {
    onClose: () => void;
    onSubmit: (data: {
      taskTitle: string;
      taskPriority: 'low' | 'medium' | 'high';
      taskDesc?: string; 
      dueDate?: string;
      assignedUserIds: string[];
    }) => void;
    loading: boolean;}) => {

    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [taskDesc, setTaskDesc] = useState('');
    const [dueDate, setDueDate] = useState('');

    const [users, setUsers] = useState<TaskMember[]>([]);
    // const [memberOpen, setMemberOpen] = useState(false);
    const [selectedUserIds, setSelectedUserIds] =  useState<string[]>([]);

    useEffect(() => {
    const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      // Force status to empty so backend does NOT use task status like "focus"
      const params = new URLSearchParams();
      params.append("status", "offline");

      const url = `/api/users?${params.toString()}`;

      console.log("Fetching users from:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("Fetched users:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch users");
      }

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setUsers([]);
    }
  };

  fetchUsers();
}, []);

  function toggleUser(userId: string) {
    setSelectedUserIds((prevSelected) => {
      if (prevSelected.includes(userId)) 
      {
        return prevSelected.filter((id) => id !== userId);
      } 
      else 
      {
        return [...prevSelected, userId];
      }
    });
  }

  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.userId));
  // const selectedText = selectedUsers.length > 0 ? selectedUsers.map((user) => user.userName).join(', ') : 'Select members';
  const handleSubmit = () => {
    onSubmit({
      taskTitle,
      taskPriority,
      taskDesc,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined, 
      assignedUserIds: selectedUserIds,
    });
 };

    return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
    <div className="flex flex-col gap-y-4 w-full max-w-[480px] max-h-[92vh] overflow-y-auto rounded-[2rem] bg-[#1b1b1b] border border-[#242424] px-12 py-10 shadow-2xl text-gray-200">
      
      <button
        onClick={onClose}
        className='close-right text-4xl'
      >
        ×
      </button>

      <div className='flex flex-col gap-y-2 items-center justify-center text-center text-4xl'>
        <IconTaskAdd className='text-white w-8 h-8' />
        <h1 className="font-medium text-accent-lime">Create New Task</h1>
      </div>

      <InputText
        title='Title'
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        required={true}
        placeholder='Task Title'
        type='text'
      />
      <InputTextArea
        title='Description'
        value={taskDesc}
        onChange={(e) => setTaskDesc(e.target.value)}
        placeholder="Task Description"
      />
      <InputDropdown 
        title='Priority'
        name='task_priority'
        choices={taskPriorityOptions}
        value={taskPriority}
        onChange={(e) =>
          setTaskPriority(e.target.value as "low" | "medium" | "high")
        }
        className='appearance-auto'
      />
      <InputText
        title='Due Date'
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required={true}
        type='date'
      />
      <InputDropdownChecklist
        title='Task Members'
        placeholder='Select Members'
        emptyText='No users found'
        users={users}
        selectedUserIds={selectedUserIds}
        onUserToggle={toggleUser}
      />

      {/* Task Members Dropdown */}
      {/* <div className="relative">
        <label className="mb-3 block text-2xl font-bold text-gray-400">
          Task Members
        </label>

        <button
          type="button"
          onClick={() => setMemberOpen(!memberOpen)}
          className="flex w-full items-center justify-between rounded-2xl border-2 border-[#5a5a5a] bg-transparent px-6 py-4 text-left text-2xl text-gray-200 outline-none focus:border-lime-300"
        >
          <span className="truncate">{selectedText}</span>
          <span className="text-2xl text-white">{memberOpen ? "⌃" : "⌄"}</span>
        </button>

        {memberOpen && (
          <div className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto rounded-2xl border-2 border-[#5a5a5a] bg-[#1b1b1b] p-3 shadow-2xl">
            {users.length === 0 ? (
              <p className="px-4 py-3 text-xl text-gray-400">
                No users found
              </p>
            ) : (
              users.map((user) => (
                <label
                  key={user.userId}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl px-4 py-3 text-xl text-gray-200 hover:bg-[#2a2a2a]"
                >
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.userId)}
                    onChange={() => toggleUser(user.userId)}
                    className="h-5 w-5 accent-lime"
                  />

                  <div>
                    <p>{user.userName}</p>
                    <p className="text-sm text-gray-400">{user.userEmail}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
      </div> */}

      <button
        onClick={handleSubmit}
        disabled={loading || !taskTitle}
        className="mt-6 w-full rounded-2xl bg-lime-300 py-4 text-2xl font-bold text-black hover:brightness-110 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Task"}
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
  const displayDate = task.taskStatus === 'done' ? task.completedDate: task.dueDate;

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

      <p className={`text-lg font-medium ${
          priority === 'high'
            ? 'text-accent-lime'
            : priority === 'medium'
            ? 'text-yellow-300'
            : 'text-gray-400'
        }`}>
        {priority ? `${priority} Priority` : 'No Priority'}
      </p>

      <p className="text-lg mb-4">
        
        {task.taskStatus === 'done' ? 'Completed on' : 'Due on'}{' '}
        {displayDate ? new Date(displayDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric',}): 'No due date'}
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
        <span className="text-2xl font-bold text-accent-lime">
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
    try 
    {
      setLoading(true);
      setError(null);

      const res = await taskApi.getAllTasks();
      setTasks(res);
    } 
    catch (err: any) 
    {
      setError(err.message || 'Failed to load tasks');
    } 
    finally 
    {
      setLoading(false);
    }
  };

  const handleTaskClick = async (id: string) => {
    try 
    {
      setDetailLoading(true);
      setError(null);

      const res = await taskApi.getTaskById(id);

      setSelectedTask(res);
    } 
    catch (err: any) 
    {
      setError(err.message || 'Failed to load task detail');
    } 
    finally 
    {
      setDetailLoading(false);
    }
  };

  const handleCreateTask = async (data: {
    taskTitle: string;
    taskPriority: 'low' | 'medium' | 'high';
    taskDesc?: string;
    dueDate?: string; 
    assignedUserIds: string[];
}) => {
    try 
    {
      setCreateLoading(true);
      setError(null);

      await taskApi.createTask(data);
      await fetchTasks();
      setShowCreateModal(false);
    } 
    catch (err: any) 
    {
      setError(err.message || 'Failed to create task');
    } 
    finally 
    {
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
    try 
    {
      setUpdateLoading(true);
      setError(null);


      await taskApi.updateTask(taskId, data);
      setSelectedTask(null);
      await fetchTasks();
    } 
    catch (err: any) 
    {
      setError(err.message || 'Failed to update task');
    } 
    finally 
    {
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
          className="btn-lime-outline"
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

