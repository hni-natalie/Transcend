import { ReactElement, useState } from 'react'
import { UserChipItem } from "../types/user.types"
import { MenuItem, MenuConfig } from "../types/menu.types"
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

  // const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
	const user: UserChipItem = getUserData();

	return (
	<>
	<div className="bg-brand-black h-full flex flex-col gap-6 p-8 pt-12 pb-12 text-sm">
		<h1 className='brand-logo-lean text-2xl font-bold'>WorkFrom,</h1>
		<div>
			<p>Location MY</p>
			<p>HH:MM</p>
		</div>

		<nav className='flex h-full mt-2'>
		<ul className='flex flex-col w-full'>
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
							items-center space-x-1 hover:text-brand-lime

							${item.subItems 
								? 'cursor-default' 
								: 'cursor-pointer'
							}
						`}
					>
						<span className='w-5 h-5'>{item.icon}</span>
						<span>{item.title}</span>
					</button>
				</li>
				))
			}
		</ul>
		</nav>

		<ChipUser {...user} />
	</div>
	</>
	)
};

export default MenuSide