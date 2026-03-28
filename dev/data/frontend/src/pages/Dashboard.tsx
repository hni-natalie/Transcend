import { MenuSide, FormAddUser, FormAddWorkspace } from '../components';
import { menuConfig } from '../config/menu.conf';

export default function PageDashboard () {
	return (
		<div className='bg-brand-black-sub h-screen'>

			<div className='flex h-full gap-x-0.5'>
				<MenuSide conf={menuConfig} />

				<div className='bg-brand-black flex w-full p-8 gap-8'>
					<FormAddUser />
					<FormAddWorkspace />

					{/* <div className='p-8 bg-gray-800 w-full'>
						<h1>example container</h1>
					</div> */}

				</div>

			</div>

		</div>
	)
}