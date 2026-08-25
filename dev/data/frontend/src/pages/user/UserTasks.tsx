import { PageHeader, IconTasks, InputDropdown, InputText, IconTaskAdd, UserChipItem, IconPlus, LoadingState, Modal, IconClose, ModalHeader } from '@shared';
import { useEffect, useMemo, useState } from 'react';
import { taskApi } from '@features/tasks/task.api';
import { Task } from '@features/tasks/task.types';
import { InputTextArea } from '@/shared/ui/InputTextArea';
import { InputDropdownChecklist, EmptyCard } from '@/shared';
import { DropdownChoice } from '@/shared/types/ui.types';

type TaskMember = {
  userId: string;
  userName: string;
  userEmail?: string;
  role?: {
    roleId: string;
    roleName: string;
  };
  avatarUrl?: string;
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
    <div className="form-layout">

        <ModalHeader 
          icon={IconTasks}
          iconClassName='text-white w-6 h-6'
          title='Edit Task'
          onClose={onClose}
        />
        <InputText
          title='Title'
          type='text'
          placeholder='Task Title'
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          className="bg-background"
        />
        <InputTextArea
          title='Description'
          value={taskDesc}
          onChange={(e) => setTaskDesc(e.target.value)}
          placeholder="No description"
          className="bg-background"
        />
        <InputDropdown
          title='Status'
          choices={taskStatusOptions}
          value={taskStatus}
          onChange={(e) =>
            setTaskStatus(e.target.value as 'not_started' | 'in_progress' | 'done')
          }
          placeholder='--- Select Task Status ---'
          className='appearance-auto bg-background'
        />
        <InputDropdown
          title='Priority'
          choices={taskPriorityOptions}
          value={taskPriority}
          onChange={(e) =>
            setTaskPriority(e.target.value as 'low' | 'medium' | 'high')
          }
          placeholder='--- Select Task Priority ---'
          className='appearance-auto bg-background'
        />
        <InputText 
          title='Due Date'
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          type='date'
          className="bg-background"
        />

      <div className='flex justify-center pt-4'>
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
          className='btn-lime-outline-solid w-[200px] mx-auto'
        >
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
      // const token = localStorage.getItem("token");

      // // Force status to empty so backend does NOT use task status like "focus"
      // const params = new URLSearchParams();
      // params.append("status", "offline");

      // const url = `/api/users?${params.toString()}`;

      // console.log("Fetching users from:", url);

      // const res = await fetch(url, {
      //   method: "GET",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      // const data = await res.json();

      // console.log("Fetched users:", data);

      // if (!res.ok) {
      //   throw new Error(data.error || "Failed to fetch users");
      // }

      // if (Array.isArray(data)) {
      //   setUsers(data);
      // } else if (Array.isArray(data.users)) {
      //   setUsers(data.users);
      // } else if (Array.isArray(data.data)) {
      //   setUsers(data.data);
      // } else {
      //   setUsers([]);
      // }
      const res = (await taskApi.allUsers())as TaskMember[];
      setUsers(res);

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
    <div className='form-layout'>
      <ModalHeader 
        icon={IconTasks}
        iconClassName='text-white w-6 h-6'
        title='Create New Task'
        onClose={onClose}
      />

      <InputText
        title='Title'
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        required={true}
        placeholder='Task Title'
        type='text'
        className="bg-background"
      />
      <InputTextArea
        title='Description'
        value={taskDesc}
        onChange={(e) => setTaskDesc(e.target.value)}
        placeholder="Task Description"
        className="bg-background"
      />
      <InputDropdown 
        title='Priority'
        name='task_priority'
        choices={taskPriorityOptions}
        value={taskPriority}
        onChange={(e) =>
          setTaskPriority(e.target.value as "low" | "medium" | "high")
        }
        className='appearance-auto bg-background'
      />
      <InputText
        title='Due Date'
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required={true}
        type='date'
        className="bg-background"
      />
      <InputDropdownChecklist
        title='Task Members'
        placeholder='Select Members'
        emptyText='No users found'
        users={users}
        selectedUserIds={selectedUserIds}
        onUserToggle={toggleUser}
        className="bg-background"
      />
      <div className='flex justify-center pt-4'>
        <button
          onClick={handleSubmit}
          disabled={loading || !taskTitle}
          className='btn-lime-outline-solid w-[200px] mx-auto'
        >
          {loading ? "Creating..." : "Create Task"}
        </button>
      </div>
    </div>
);
};

const TaskCard = ({ task, onEdit, onDelete,}: {
  task: Task;
  onEdit: () => void;
  onDelete: (taskId: string) => void;
}) => {
  const priority = task.assignedTo?.[0]?.taskPriority;
  const [showMenu, setShowMenu] = useState(false);
  const displayDate = task.taskStatus === 'done' ? task.completedDate: task.dueDate;  

  const assignedUsersChips: UserChipItem[] = (task.assignedTo ?? [])
    .filter((assignment) => assignment.user)
    .map((assignment) => ({
      name: assignment.user.userName,
      email: assignment.user.userEmail,
      role: assignment.user.role?.roleName ?? "Unknown",
      photo: assignment.user.avatarUrl || "/default-avatar.png",
    }));
    
  return (
    <div
      // onClick={onClick}
      className="relative task-card hover:border-lime-300 transition-all"
    >
      <div className="absolute right-6 top-6">
      <button
        onClick={(e) => {
          // e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="text-2xl text-gray-300"
      >
        ⋮
      </button>

      {showMenu && (
        <div className="absolute right-0 z-10 mt-2 w-24 rounded-xl bg-[#2a2a2a] p-2 shadow-xl">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
                setShowMenu(false);
              }}
              className="w-full rounded-xl px-3 py-2 text-white-400 hover:bg-[#333]"
            >
            Edit
          </button>

          <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();

                if (window.confirm("Delete this task?")) {
                  onDelete(task.taskId);
                }

                setShowMenu(false);
              }}
              className="mt-2 w-full rounded-xl px-3 py-2 text-red-400 hover:bg-[#333]">
              Delete
            </button>
        </div>
      )}
    </div>

      <h2 className="text-xl font-semibold mb-4 pr-8">
        {task.taskTitle}
      </h2>

      <p className="task-desc">
        {task.taskDesc || 'No description'}
      </p>

      <p className={`font-medium capitalize ${
          priority === 'high'
            ? 'text-accent-lime'
            : priority === 'medium'
            ? 'text-yellow-300'
            : 'text-gray-400'
        }`}>
        {priority || 'No'} Priority
      </p>

      <p className="mb-4 whitespace-pre">
        {task.taskStatus != 'done' ? 'Due on  ·' : 'Completed on  ·'}{'  '}
        {displayDate ? new Date(displayDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric',}): '-'}
      </p>

      <div className="flex items-center">
        {assignedUsersChips.map((user, index) => (
          <img
            key={user.email ?? `${user.name}-${index}`}
            src={user.photo}
            alt={`${user.name}'s avatar`}
            title={user.name}
            className={`w-10 h-10 rounded-full object-cover border-2 border-[#1f1f1f] ${
              index > 0 ? "-ml-3" : ""
            }`}
            onError={(event) => {
              event.currentTarget.src = "/default-avatar.png";
            }}
          />
        ))}
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
      <div className='task-tab'>
        <h2 className="text-lg">{title}</h2>
        <span className="text-2xl text-accent-lime">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-6">
        {tasks.length === 0 ? (
          <EmptyCard 
            title='No tasks found'
            desc='Nothing assigned at the moment'
          />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.taskId}
              task={task}
              onEdit={() => onTaskClick(task.taskId)}
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
      await fetchTasks();
      setSelectedTask(null);
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
    const now = Date.now();
    return {
      backlog: tasks.filter((task) => (!task.dueDate || new Date(task.dueDate).getTime() < now) && (task.taskStatus === 'not_started' || task.taskStatus === 'in_progress')),
      upcoming: tasks.filter((task) => task.taskStatus === 'not_started'),
      inProgress: tasks.filter((task) => task.taskStatus === 'in_progress'),
      done: tasks.filter((task) => task.taskStatus === 'done'),
    };
  }, [tasks]);

  if (loading) {
    return (
      <div className='flex h-full justify-center'>
        <LoadingState message="Loading tasks..." size="full" />
      </div>
    );
  }

  if (error) {
    return <p className="p-6 text-red-400">{error}</p>;
  }

  return (
    <>
      <PageHeader
        icon={<IconTasks className="w-7 h-7" />}
        title="Tasks"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-header"
          >
            <IconPlus className="w-4 h-4" />
            Add Task
        </button>
        }
      />
			<div className="flex-1 overflow-y-auto mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <TaskColumn
            title="Backlog"
            tasks={groupedTasks.backlog}
            onTaskClick={handleTaskClick}
            onDelete={handleDeleteTask}
          />
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
      </div>

      {detailLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-2xl bg-content-50 p-8">
            Loading task detail...
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)}>
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          loading={updateLoading}
        />
      </Modal>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          loading={createLoading}
        />
      </Modal>
    </>
  );
};

