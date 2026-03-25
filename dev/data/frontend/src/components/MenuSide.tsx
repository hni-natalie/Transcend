import { ReactElement, useState } from 'react'
import { UserChipItem } from "../types/user.types"
import { MenuItem, MenuConfig } from "../types/menu.types"
import { CollapseIcon } from '../config/menu.icons.conf';

import ChipUser from "./ChipUser"

// tmp, this function should call API from backend
function getUserData(): UserChipItem {
return {
	name: "Mary Doe",
	role: "Software Engineer",
	photo: "https://images.pexels.com/photos/36393879/pexels-photo-36393879.jpeg"
};
}

const handleMenuClick = (item: MenuItem) => {
	// Only navigate if the item doesn't have subItems
	if (!item.subItems && item.href !== '#') {
		window.location.href = item.href;
	}
};

function MenuSide({conf} : {conf:MenuConfig}) : ReactElement {
	const user: UserChipItem = getUserData();

	const [status, setStatus] = useState('expanded');
	const toggleExpand = () => { 
		setStatus(prevStatus => prevStatus === 'expanded' ? 'none' : 'expanded');
	};

	return (
	<>
	<div className="bg-brand-black h-full flex flex-col gap-6 p-8 pt-12 pb-12 text-sm">

		<div className={`w-full flex ${status === 'expanded' ? 'justify-end' : 'justify-center'} `}>
		<div className='text-brand-lime w-8 h-8 cursor-pointer'>
			<CollapseIcon className={`transition-transform duration-1000  ${status === 'expanded' ? '-rotate-180' : ''}`} onClick={toggleExpand}/>
		</div>
		</div>

		<h1 className='bg-teal-90 brand-logo-lean text-2xl text-center font-bold'>{status === 'expanded' ? 'WorkFrom,' : 'WF'}</h1>
		<div style={{ visibility: status === 'expanded' ? 'visible' : 'hidden' }}>
			<p>{status === 'expanded' ? 'Location MY' : 'T'}</p>
			<p>{status === 'expanded' ? 'HH:MM' : 'T'}</p>
		</div>

		<nav className='flex h-full mt-2'>
		<ul className={`flex flex-col w-full
				${status === 'expanded' ? '' : 'items-center'}`}
		>
			{
				conf.map((item : any) => (
				<li
					key={item.title}
					className='flex cursor-pointer'
				>
					<button
						onClick={() => handleMenuClick(item)}
						className={`
							flex w-full py-2 gap-x-2 rounded-sm text-white text-m font-medium
							transition-all duration-200 
							space-x-1 hover:text-brand-lime

							${item.subItems 
								? 'cursor-default' 
								: 'cursor-pointer'
							}
						`}
					>
						<span className='w-5 h-5'>{item.icon}</span>
						{status === 'expanded' && (
							<span>{item.title}</span>
						)}
					</button>
				</li>
				))
			}
		</ul>
		</nav>

		<ChipUser {...user} expandStatus={status} />
	</div>
	</>
	)
};

export default MenuSide