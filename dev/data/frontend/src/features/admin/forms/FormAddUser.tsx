// adds new user
import React from 'react';
import { useState, ChangeEvent } from 'react';
import { InputText, InputDropdown } from '@shared';
import { UploadPhoto } from '@features/admin';
import { countryOptions, normalizeOptions } from '@shared';


const deptOptions = [
	'Engineering',
	'Marketing',
	'Sales',
	'Human Resources',
	'Finance'
];

const roleOptions = [
	'Administrator',
	'Manager',
	'Team Member',
	'Team Leader'
];


export function FormAddUser() {

	const [formData, setFormData] = useState({
		firstName: '',
		lastName: '',
		email: '',
		dept: '',
		role: '',
		location: '',
		photo: ''
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
		// Send to API, validate, etc.
		alert(`Submitted: ${JSON.stringify(formData, null, 2)}`);
	};

	return (
		<div className='flex w-full bg-background-1 p-8 py-4 rounded-2xl border border-border-2'>

			<form onSubmit={handleSubmit} className='flex flex-col w-full h-full gap-y-4'>
				<h1>User Account</h1>

		    <div className='flex flex-col p-0.5 gap-y-8 overflow-y-auto h-full'>
					<UploadPhoto onChange={handleChange} />

					<InputText title='First Name' placeholder='Enter First Name' name='firstName' value={formData.firstName} onChange={handleChange} required={true} />
					<InputText title='Last Name' placeholder='Enter Last Name' name='lastName' value={formData.lastName} onChange={handleChange} required={true} />
					<InputText title='Email' placeholder='Enter Email' name='email' value={formData.email} onChange={handleChange} required={true} />
					<InputDropdown title='Department' name='dept' choices={normalizeOptions(deptOptions)} value={formData.dept} onChange={handleChange} />
					<InputDropdown title='Role' name='role' choices={normalizeOptions(roleOptions)} value={formData.role} onChange={handleChange} required={true} />
					<InputDropdown title='Location' name='location' choices={normalizeOptions(countryOptions)} value={formData.location} onChange={handleChange} />
				</div>

				<div className='flex justify-center'>
					<button type="submit" className='text-xs font-bold text-accent-lime border border-accent-lime p-1 px-8 rounded-lg bg-background-2 cursor-pointer'>Submit</button>
				</div>
			</form>

		</div>
	)
}
