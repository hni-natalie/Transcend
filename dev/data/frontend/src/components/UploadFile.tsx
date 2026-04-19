import { useState, useRef, ChangeEvent } from 'react'
import { IconUpload } from '../config/menu.icons.conf'

interface UploadFileProps {
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
	name?: string;
	title?: string;
	desc?: string;
	className?: string;
}

export default function UploadFile ({
	onChange,
	title='Choose file to upload',
	desc='Supported format : pdf',
	className='',
	name='file'
} : UploadFileProps ) {
	
  const fileInputRef = useRef<HTMLInputElement>(null); // to trigger click event
  const [fileName, setFileName] = useState<string>('');

  const handleClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		
		if (file) {
			setFileName(file.name);
			// Pass the data URL to the form
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
				console.log('reader res: ', reader.result);
				if (onChange) {
					const syntheticEvent = {
						target: {
							name: name,
							value: reader.result
						}
					};
					onChange(syntheticEvent as any);
				}
			}
      reader.readAsDataURL(file);
		}
	}

	return (
		<>
		<input
			ref={fileInputRef}
			type="file"
			onChange={handleFileChange}
			accept=".pdf"
			className="hidden"
		/>
		<div onClick={handleClick} 
				className={`flex flex-col cursor-pointer items-center text-white/60 bg-brand-gray-800 border border-brand-gray-500 rounded-lg p-4 
				${className} ${fileName ? '' : 'border-dashed'} `} >
			<IconUpload className='h-8 w-8 text-brand-lime'/>
			<h2 className='text-white'>{fileName ? 'File selected' : title}</h2>
			<p className='text-xs'>{fileName ? fileName : desc}</p>
		</div>
		</>
	)
}
