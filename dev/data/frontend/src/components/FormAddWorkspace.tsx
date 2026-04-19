// adds new user
import { InputText, InputDropdown, UploadPhoto, UploadFile } from './index'
import { countryOptions } from '../list/country.list'
import { useState, ChangeEvent } from 'react';

const permissionOptions = [
	'Default : All Users'
];


export default function FormAddWorkspace() {

	const [formData, setFormData] = useState({
		spaceName: '',
		url: '',
		permissions: '',
		photo: '',
		file: ''
	});

	// Single handler for all inputs
	const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		console.log('Form submitted with data:', formData);
		// Send to backend API, validate, etc.
		alert(`Submitted: ${JSON.stringify(formData, null, 2)}`);
	};

	return (
		<div className='flex w-full bg-brand-black-sub p-8 py-4 rounded-2xl border border-brand-gray-500'>

			<form onSubmit={handleSubmit} className='flex flex-col w-full h-full gap-y-4'>
				<h1>Workspace Account</h1>

		    <div className='flex flex-col p-0.5 gap-y-8 overflow-y-auto h-full'>
					<UploadPhoto onChange={handleChange} />

					<InputText title='Name' placeholder='Enter Workspace Name' name='spaceName' value={formData.spaceName} onChange={handleChange} required={true} />
					<InputText title='URL' placeholder='Enter Workspace URL' name='url' value={formData.url} onChange={handleChange} required={true} />
					<InputDropdown title='Permissions' name='permissions' choices={permissionOptions} value={formData.permissions} onChange={handleChange} />
					<UploadFile onChange={handleChange}/>
				</div>

				<div className='flex justify-center'>
					<button type="submit" className='text-xs font-bold text-brand-lime border border-brand-lime p-1 px-8 rounded-lg bg-brand-gray-800 cursor-pointer'>Create Workspace</button>
				</div>
			</form>

		</div>
	)
}