import React, { useState, ChangeEvent } from 'react';
import { InputText, InputDropdown, UploadPhoto, UploadFile } from '@shared';

const permissionOptions = [
    'Default : All Users'
];

export function FormAddWorkspace({ onClose }: { onClose?: () => void }) {
    const [formData, setFormData] = useState({
        spaceName: '',
        url: '',
        permissions: permissionOptions[0],
        photo: '',
        file: ''
    });

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log('Workspace Created:', formData);
    };

    return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
			
			{/* Form Container*/}
			<div 
				className="relative bg-[#121212] border border-[#222222] rounded-[32px] p-6 shadow-2xl flex flex-col justify-between shrink-0 h-[630px] w-[368px] min-w-[368px] max-w-[368px] min-h-[630px] max-h-[630px]"
				onClick={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex justify-between items-center mb-4 shrink-0">
					<div className="w-5" /> 
					<h1 className="text-accent-lime font-semibold text-lg">Workspace Account</h1>
					<button type="button" onClick={onClose} className="text-foreground-3 hover:text-white transition-colors">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 justify-between">
					
					{/* Scrollable Input Area - takes up remaining space without expanding the modal */}
					<div className="flex flex-col gap-y-5 overflow-y-auto pr-1 custom-scrollbar min-h-0 flex-1">
						<div className="flex justify-center mb-1 shrink-0">
							<UploadPhoto onChange={handleChange} />
						</div>

						<InputText title='Name' placeholder='Enter Workspace Name' name='spaceName' value={formData.spaceName} onChange={handleChange} required={true} />
						<InputText title='URL' placeholder='Enter Workspace URL' name='url' value={formData.url} onChange={handleChange} required={true} />
						
						<div className="relative">
							<label className="block text-sm text-foreground-3 mb-1.5 font-medium">Permissions</label>
							<select name="permissions" value={formData.permissions} onChange={handleChange} className="w-full bg-background border border-background-3 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-accent-lime transition-all cursor-pointer">
								{permissionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
							</select>
						</div>

						<UploadFile onChange={handleChange}/>
					</div>

					{/* Footer */}
					<div className="pt-4 shrink-0">
						<button type="submit" className="w-full bg-transparent border border-accent-lime text-accent-lime font-bold py-3 rounded-full hover:bg-accent-lime hover:text-black transition-all cursor-pointer">
							Create Workspace
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
