// adds new user
import InputText from './InputText'
import InputDropdown from './InputDropdown'
import { countryOptions } from '../list/country.list'
import { useState, ChangeEvent } from 'react';


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


export default function FormAddUser() {
	// Updates form value
  // const [value, setValue] = useState('');
  // const handleChange = (e) => {
  //   setValue(e.target.value);
  // };

	const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dept: '',
    role: '',
    location: ''
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
		<div className='flex flex-col'>
			<h1>User Account</h1>

			<form onSubmit={handleSubmit} className='flex flex-col gap-y-8'>
				<button> Upload Photo </button>

				<InputText title='First Name' placeholder='Enter First Name' name='firstName' value={formData.firstName} onChange={handleChange} required={true} />
				<InputText title='Last Name' placeholder='Enter Last Name' name='lastName' value={formData.lastName} onChange={handleChange} required={true} />
				<InputText title='Email' placeholder='Enter Email' name='email' value={formData.email} onChange={handleChange} required={true} />
				<InputDropdown title='Department' name='dept' choices={deptOptions} value={formData.dept} onChange={handleChange} />
				<InputDropdown title='Role' name='role' choices={roleOptions} value={formData.role} onChange={handleChange} required={true} />
				<InputDropdown title='Location' name='location' choices={countryOptions} value={formData.location} onChange={handleChange} />

	      <button type="submit">Submit</button>
			</form>

		</div>
	)
}