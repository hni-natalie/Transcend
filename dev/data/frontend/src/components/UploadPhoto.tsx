import React from 'react';
import { useState, useRef, ChangeEvent } from 'react'

interface UploadPhotoProps {
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	value?: string;
	name?: string;
}


export default function UploadPhoto ({
	onChange,
	value = '',
	name = 'photo'
} : UploadPhotoProps ) {

	const [preview, setPreview] = useState<string>(value);
	const [hasPhoto, setHasPhoto] = useState<boolean>(!!value);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		
		if (file && file.type.startsWith('image/')) {
		// Check file size (optional - limit to 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size should be less than 5MB');
			if (fileInputRef.current) {
			fileInputRef.current.value = '';
			}
			return;
		}

		const reader = new FileReader();
		
		reader.onload = (event: ProgressEvent<FileReader>) => {
			const photoDataUrl = event.target?.result as string;
			setPreview(photoDataUrl);
			setHasPhoto(true);
			
			// Pass the data URL to the form
			if (onChange) {
			// Create a synthetic event object that matches your handleChange expectations
			const syntheticEvent = {
				target: {
				name: name,
				value: photoDataUrl
				}
			};
			onChange(syntheticEvent as any);
			}
		};
		
		reader.readAsDataURL(file);
		} else if (file) {
		alert('Please select a valid image file (JPEG, PNG, etc.)');
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
		}
	};

	const handleClick = () => {
		fileInputRef.current?.click();
			console.log('cliekd')
	};


	return (
		<>
		<div className='flex'>
			<input
				type="file" 
				ref={fileInputRef}
				accept="image/*" 
				className="hidden"
				onChange={handleFileChange}
			/>
			{/* <label */}
			{/* for="photoUpload"  */}
			<div onClick={handleClick} className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-brand-gray-800 cursor-pointer overflow-hidden">

			<img id="preview" className="w-full h-full object-cover hidden" alt="Preview" />

			{/* show image; else show icon */}
			{hasPhoto && preview ? (
				<img src={preview} className="w-full h-full object-cover" alt="Upload preview" />
			) : (
			<div id='cameraIcon' className='text-brand-lime hover:text-white hover:scale-110 transition-transform duration-300'>
				<svg className="w-9 h-9 mb-1" fill="currentColor" stroke="none" viewBox="0 0 37 37">
					<path d="M11.1002 9.43499V10.185C11.3669 10.185 11.6136 10.0433 11.748 9.8129L11.1002 9.43499ZM13.6902 4.995V4.245C13.4234 4.245 13.1768 4.38668 13.0424 4.61709L13.6902 4.995ZM23.3102 4.995L23.958 4.61709C23.8236 4.38668 23.5769 4.245 23.3102 4.245V4.995ZM25.9002 9.43499L25.2524 9.8129C25.3868 10.0433 25.6334 10.185 25.9002 10.185V9.43499ZM3.7002 28.305H4.4502V13.135H3.7002H2.9502V28.305H3.7002ZM7.40019 9.43499V10.185H11.1002V9.43499V8.68499H7.40019V9.43499ZM11.1002 9.43499L11.748 9.8129L14.338 5.3729L13.6902 4.995L13.0424 4.61709L10.4524 9.05709L11.1002 9.43499ZM13.6902 4.995V5.745H23.3102V4.995V4.245H13.6902V4.995ZM23.3102 4.995L22.6624 5.3729L25.2524 9.8129L25.9002 9.43499L26.548 9.05709L23.958 4.61709L23.3102 4.995ZM25.9002 9.43499V10.185H29.6002V9.43499V8.68499H25.9002V9.43499ZM33.3002 13.135H32.5502V28.305H33.3002H34.0502V13.135H33.3002ZM33.3002 28.305H32.5502C32.5502 29.9342 31.2294 31.255 29.6002 31.255V32.005V32.755C32.0579 32.755 34.0502 30.7627 34.0502 28.305H33.3002ZM29.6002 9.43499V10.185C31.2294 10.185 32.5502 11.5058 32.5502 13.135H33.3002H34.0502C34.0502 10.6773 32.0579 8.68499 29.6002 8.68499V9.43499ZM3.7002 13.135H4.4502C4.4502 11.5058 5.77095 10.185 7.40019 10.185V9.43499V8.68499C4.94253 8.68499 2.9502 10.6773 2.9502 13.135H3.7002ZM7.40019 32.005V31.255C5.77096 31.255 4.4502 29.9342 4.4502 28.305H3.7002H2.9502C2.9502 30.7627 4.94253 32.755 7.40019 32.755V32.005ZM24.0502 19.795H23.3002C23.3002 22.446 21.1512 24.595 18.5002 24.595V25.345V26.095C21.9796 26.095 24.8002 23.2744 24.8002 19.795H24.0502ZM18.5002 25.345V24.595C15.8492 24.595 13.7002 22.446 13.7002 19.795H12.9502H12.2002C12.2002 23.2744 15.0208 26.095 18.5002 26.095V25.345ZM12.9502 19.795H13.7002C13.7002 17.144 15.8492 14.995 18.5002 14.995V14.245V13.495C15.0208 13.495 12.2002 16.3156 12.2002 19.795H12.9502ZM18.5002 14.245V14.995C21.1512 14.995 23.3002 17.144 23.3002 19.795H24.0502H24.8002C24.8002 16.3156 21.9796 13.495 18.5002 13.495V14.245ZM29.6002 32.005V31.255H7.40019V32.005V32.755H29.6002V32.005Z"/>
				</svg>
			</div>)}

		</div>
		</div>
		</>
	)
}